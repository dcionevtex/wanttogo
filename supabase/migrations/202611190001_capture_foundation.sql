-- M1: private capture and durable intent. No provider calls or worker yet.
begin;

create table public.sources (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  original_url text not null check (length(original_url) between 1 and 4096 and original_url ~* '^https?://' and original_url !~ '[[:cntrl:]]'),
  normalized_url text not null check (length(normalized_url) between 1 and 4096 and normalized_url ~* '^https?://' and normalized_url !~ '[[:cntrl:]]'),
  url_hash text not null,
  platform text not null default 'website' check (platform in ('instagram','tiktok','x','google_maps','website')),
  status text not null default 'pending' check (status in ('pending','processing','resolved','review_required','failed')),
  safe_error_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, url_hash),
  unique (user_id, id)
);
create index sources_inbox_idx on public.sources (user_id, created_at desc, id desc);

create table public.processing_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source_id uuid not null unique,
  state text not null default 'queued' check (state in ('queued','running','completed','failed')),
  attempt_count integer not null default 0 check (attempt_count >= 0),
  available_at timestamptz not null default now(),
  lease_until timestamptz,
  lease_token uuid,
  safe_error_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (user_id, source_id) references public.sources(user_id, id) on delete cascade
);
create index processing_jobs_ready_idx on public.processing_jobs (state, available_at);

create table public.places (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  google_place_id text,
  identity_kind text not null check (identity_kind in ('google_verified','user_confirmed')),
  name text, address text, city text, country text, category text,
  latitude double precision, longitude double precision,
  coordinate_origin text check (coordinate_origin in ('google_verified','user_confirmed')),
  confirmed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, id),
  check ((latitude is null and longitude is null and coordinate_origin is null) or
    (latitude is not null and longitude is not null and latitude between -90 and 90 and longitude between -180 and 180 and coordinate_origin is not null)),
  check (identity_kind <> 'google_verified' or google_place_id is not null)
);
create unique index places_google_identity_idx on public.places (user_id, google_place_id) where google_place_id is not null;

create table public.saved_places (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  place_id uuid not null,
  visit_status text not null default 'want_to_go' check (visit_status in ('want_to_go','visited')),
  notes text check (length(notes) <= 10000),
  saved_at timestamptz not null default now(),
  visited_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (user_id, place_id),
  foreign key (user_id, place_id) references public.places(user_id, id) on delete cascade,
  check ((visit_status = 'visited') = (visited_at is not null))
);

create table public.source_places (
  user_id uuid not null references auth.users(id) on delete cascade,
  source_id uuid not null,
  place_id uuid not null,
  confirmation_kind text not null check (confirmation_kind in ('google_verified','user_confirmed')),
  confirmed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  primary key (user_id, source_id, place_id),
  foreign key (user_id, source_id) references public.sources(user_id, id) on delete cascade,
  foreign key (user_id, place_id) references public.saved_places(user_id, place_id) on delete cascade
);

-- Exactly one current rate-limit window per user; no accumulating time buckets.
create table public.capture_limits (
  user_id uuid primary key references auth.users(id) on delete cascade,
  window_start timestamptz not null,
  requests integer not null check (requests >= 0)
);

alter table public.sources enable row level security;
alter table public.processing_jobs enable row level security;
alter table public.places enable row level security;
alter table public.saved_places enable row level security;
alter table public.source_places enable row level security;
alter table public.capture_limits enable row level security;

-- Explicit grants override any Supabase default table privileges.
revoke all on public.sources, public.processing_jobs, public.places, public.saved_places, public.source_places, public.capture_limits from anon, authenticated;
grant select on public.sources, public.places, public.saved_places, public.source_places to authenticated;
create policy sources_owner_read on public.sources for select to authenticated using ((select auth.uid()) = user_id);
create policy places_owner_read on public.places for select to authenticated using ((select auth.uid()) = user_id);
create policy saved_places_owner_read on public.saved_places for select to authenticated using ((select auth.uid()) = user_id);
create policy source_places_owner_read on public.source_places for select to authenticated using ((select auth.uid()) = user_id);

-- Never accept a user_id argument. Authorization comes from verified JWT context.
-- Supabase executes a function call in a transaction: source + job either both
-- commit or both roll back. Workers must revalidate URLs before fetching (M3).
create function public.capture_url(p_original_url text, p_normalized_url text)
returns table (source_id uuid, source_status text, duplicate boolean, rate_limited boolean)
language plpgsql security definer set search_path = '' as $$
declare
  owner_id uuid := auth.uid();
  current_window timestamptz := date_trunc('minute', clock_timestamp());
  used integer;
  existing public.sources%rowtype;
  inserted_id uuid;
  identity_hash text;
  source_host text;
  detected_platform text := 'website';
begin
  if owner_id is null then raise exception 'Authentication required' using errcode = '42501'; end if;
  if p_original_url is null or p_normalized_url is null
     or length(p_original_url) not between 1 and 4096
     or length(p_normalized_url) not between 1 and 4096
     or p_original_url !~* '^https?://'
     or p_normalized_url !~* '^https?://'
     or p_original_url ~ '[[:cntrl:]]' or p_normalized_url ~ '[[:cntrl:]]'
  then raise exception 'Invalid capture' using errcode = '22023'; end if;

  insert into public.capture_limits (user_id, window_start, requests)
    values (owner_id, current_window, 1)
  on conflict (user_id) do update set
    requests = case when capture_limits.window_start = current_window then least(capture_limits.requests + 1, 61) else 1 end,
    window_start = current_window
  returning requests into used;
  if used > 60 then
    return query select null::uuid, null::text, false, true;
    return;
  end if;

  identity_hash := encode(sha256(convert_to(p_normalized_url, 'UTF8')), 'hex');
  source_host := lower(split_part(split_part(p_normalized_url, '://', 2), '/', 1));
  if source_host ~ '(^|\.)instagram\.com$' then detected_platform := 'instagram';
  elsif source_host ~ '(^|\.)tiktok\.com$' then detected_platform := 'tiktok';
  elsif source_host ~ '(^|\.)(x|twitter)\.com$' then detected_platform := 'x';
  elsif source_host in ('maps.app.goo.gl', 'maps.google.com', 'goo.gl') or
    (source_host ~ '(^|\.)google\.com$' and p_normalized_url ~ '^https?://[^/]+/maps([/?]|$)') then detected_platform := 'google_maps';
  end if;

  insert into public.sources (user_id, original_url, normalized_url, url_hash, platform)
    values (owner_id, p_original_url, p_normalized_url, identity_hash, detected_platform)
    on conflict (user_id, url_hash) do nothing returning id into inserted_id;
  if inserted_id is null then
    select * into strict existing from public.sources where user_id = owner_id and url_hash = identity_hash;
    if existing.normalized_url <> p_normalized_url then raise exception 'URL identity conflict' using errcode = '22023'; end if;
    return query select existing.id, existing.status, true, false;
  else
    insert into public.processing_jobs (user_id, source_id) values (owner_id, inserted_id);
    return query select inserted_id, 'pending'::text, false, false;
  end if;
end;
$$;
revoke all on function public.capture_url(text, text) from public, anon;
grant execute on function public.capture_url(text, text) to authenticated;

commit;
