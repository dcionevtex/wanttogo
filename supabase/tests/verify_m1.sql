-- Read-only post-migration verification. Expected values:
-- 6, 6, true, false, true, false, false, 4.
select
  (select count(*) from pg_tables where schemaname = 'public'
    and tablename in ('sources','processing_jobs','places','saved_places','source_places','capture_limits')) as tables_created,
  (select count(*) from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname in ('sources','processing_jobs','places','saved_places','source_places','capture_limits')
    and c.relrowsecurity) as rls_enabled,
  has_function_privilege('authenticated','public.capture_url(text,text)','execute') as authenticated_capture,
  has_function_privilege('anon','public.capture_url(text,text)','execute') as anonymous_capture,
  has_table_privilege('authenticated','public.sources','select') as owner_read_grant,
  has_table_privilege('authenticated','public.sources','insert') as direct_insert,
  has_table_privilege('authenticated','public.processing_jobs','select') as browser_job_read,
  (select count(*) from pg_policies where schemaname = 'public') as owner_policies;
