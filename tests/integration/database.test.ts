// @vitest-environment node
import { PGlite } from "@electric-sql/pglite";
import { readFile } from "node:fs/promises";
import { beforeAll, beforeEach, afterAll, describe, expect, it } from "vitest";

const alice = "00000000-0000-4000-8000-000000000001";
const bob = "00000000-0000-4000-8000-000000000002";
const db = new PGlite();
beforeAll(async () => {
  // Only the Supabase Auth boundary is emulated. RLS, constraints, functions,
  // grants, cascades and transactions execute in a real PostgreSQL WASM engine.
  await db.exec(`create role anon; create role authenticated;
    create schema auth; create table auth.users (id uuid primary key);
    create function auth.uid() returns uuid language sql stable as
      $$select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid$$;
    grant usage on schema public, auth to anon, authenticated;
    insert into auth.users values ('${alice}'), ('${bob}');`);
  await db.exec(
    await readFile(
      new URL(
        "../../supabase/migrations/202611190001_capture_foundation.sql",
        import.meta.url,
      ),
      "utf8",
    ),
  );
});
beforeEach(async () => {
  await db.exec(
    "truncate public.sources, public.processing_jobs, public.capture_limits, public.places, public.saved_places, public.source_places cascade;",
  );
});
afterAll(async () => {
  await db.close();
});

async function asUser<T>(
  id: string,
  fn: (tx: Parameters<Parameters<typeof db.transaction>[0]>[0]) => Promise<T>,
) {
  return db.transaction(async (tx) => {
    await tx.exec("set local role authenticated");
    await tx.query("select set_config('request.jwt.claim.sub', $1, true)", [
      id,
    ]);
    return fn(tx);
  });
}
type Capture = {
  source_id: string;
  source_status: string;
  duplicate: boolean;
  rate_limited: boolean;
};
async function capture(id: string, url = "https://example.com/place") {
  return asUser(
    id,
    async (tx) =>
      (
        await tx.query<Capture>("select * from public.capture_url($1,$2)", [
          url,
          url,
        ])
      ).rows[0],
  );
}

describe("M1 migration", () => {
  it("commits a source and durable job, with the original URL and pending state", async () => {
    const result = await capture(
      alice,
      "https://instagram.com/reel/123?igsh=x",
    );
    expect(result).toMatchObject({
      duplicate: false,
      source_status: "pending",
      rate_limited: false,
    });
    const row = (
      await db.query(
        "select s.original_url, s.platform, j.state from public.sources s join public.processing_jobs j on j.source_id=s.id",
      )
    ).rows[0];
    expect(row).toEqual({
      original_url: "https://instagram.com/reel/123?igsh=x",
      platform: "instagram",
      state: "queued",
    });
  });
  it("returns the existing source and keeps one job on retries", async () => {
    const first = await capture(alice);
    const second = await capture(alice);
    expect(second).toMatchObject({
      source_id: first.source_id,
      duplicate: true,
    });
    expect(
      (await db.query("select count(*)::int as n from public.processing_jobs"))
        .rows,
    ).toEqual([{ n: 1 }]);
  });
  it("scopes deduplication and reads to each owner", async () => {
    const a = await capture(alice);
    const b = await capture(bob);
    expect(a.source_id).not.toBe(b.source_id);
    const rows = await asUser(bob, (tx) =>
      tx.query("select id from public.sources"),
    );
    expect(rows.rows).toEqual([{ id: b.source_id }]);
    expect(
      (
        await asUser(bob, (tx) =>
          tx.query("select * from public.sources where id=$1", [a.source_id]),
        )
      ).rows,
    ).toEqual([]);
  });
  it("rolls back capture if the durable job cannot be created", async () => {
    await db.exec(`create function public.test_job_failure() returns trigger language plpgsql as $$begin raise exception 'simulated storage failure'; end;$$;
      create trigger test_failure before insert on public.processing_jobs for each row execute function public.test_job_failure();`);
    try {
      await expect(capture(alice)).rejects.toThrow("simulated storage failure");
    } finally {
      await db.exec(
        "drop trigger test_failure on public.processing_jobs; drop function public.test_job_failure();",
      );
    }
    expect(
      (await db.query("select count(*)::int as n from public.sources")).rows,
    ).toEqual([{ n: 0 }]);
    expect(
      (await db.query("select count(*)::int as n from public.capture_limits"))
        .rows,
    ).toEqual([{ n: 0 }]);
  });
  it("does not allow anonymous reads or RPC execution", async () => {
    await capture(alice);
    await expect(
      db.transaction(async (tx) => {
        await tx.exec("set local role anon");
        return tx.query("select * from public.sources");
      }),
    ).rejects.toThrow(/permission denied/);
    await expect(
      db.transaction(async (tx) => {
        await tx.exec("set local role anon");
        return tx.query(
          "select * from public.capture_url('https://example.com','https://example.com')",
        );
      }),
    ).rejects.toThrow(/permission denied/);
    await expect(capture("")).rejects.toThrow("Authentication required");
  });
  it("prevents direct source mutations, state tampering, and job access", async () => {
    await capture(alice);
    await expect(
      asUser(alice, (tx) =>
        tx.query("update public.sources set status='resolved'"),
      ),
    ).rejects.toThrow(/permission denied/);
    await expect(
      asUser(alice, (tx) => tx.query("select * from public.processing_jobs")),
    ).rejects.toThrow(/permission denied/);
    await expect(
      asUser(alice, (tx) => tx.query("select * from public.capture_limits")),
    ).rejects.toThrow(/permission denied/);
  });
  it("limits repeated captures atomically without adding jobs after the limit", async () => {
    await capture(alice);
    await db.query(
      "update public.capture_limits set requests=60 where user_id=$1",
      [alice],
    );
    const result = await capture(alice, "https://example.com/second");
    expect(result.rate_limited).toBe(true);
    expect(
      (await db.query("select count(*)::int as n from public.sources")).rows,
    ).toEqual([{ n: 1 }]);
    await db.query(
      "update public.capture_limits set window_start=now()-interval '2 minutes' where user_id=$1",
      [alice],
    );
    expect(
      (await capture(alice, "https://example.com/second")).rate_limited,
    ).toBe(false);
  });
  it("rejects cross-user relationships through database constraints", async () => {
    const a = await capture(alice);
    const place = (
      await db.query<{ id: string }>(
        "insert into public.places(user_id,identity_kind,name) values ($1,'user_confirmed','My place') returning id",
        [bob],
      )
    ).rows[0];
    await db.query(
      "insert into public.saved_places(user_id,place_id) values ($1,$2)",
      [bob, place.id],
    );
    await expect(
      db.query(
        "insert into public.source_places(user_id,source_id,place_id,confirmation_kind) values ($1,$2,$3,'user_confirmed')",
        [alice, a.source_id, place.id],
      ),
    ).rejects.toThrow(/foreign key/);
    expect(
      (await asUser(alice, (tx) => tx.query("select * from public.places")))
        .rows,
    ).toEqual([]);
  });
  it("cascades source jobs and associations while preserving saved places", async () => {
    const a = await capture(alice);
    const place = (
      await db.query<{ id: string }>(
        "insert into public.places(user_id,identity_kind,name) values ($1,'user_confirmed','My place') returning id",
        [alice],
      )
    ).rows[0];
    await db.query(
      "insert into public.saved_places(user_id,place_id) values ($1,$2)",
      [alice, place.id],
    );
    await db.query(
      "insert into public.source_places(user_id,source_id,place_id,confirmation_kind) values ($1,$2,$3,'user_confirmed')",
      [alice, a.source_id, place.id],
    );
    await db.query("delete from public.sources where id=$1", [a.source_id]);
    expect(
      (await db.query("select count(*)::int as n from public.processing_jobs"))
        .rows,
    ).toEqual([{ n: 0 }]);
    expect(
      (await db.query("select count(*)::int as n from public.source_places"))
        .rows,
    ).toEqual([{ n: 0 }]);
    expect(
      (await db.query("select count(*)::int as n from public.saved_places"))
        .rows,
    ).toEqual([{ n: 1 }]);
  });
  it("refuses invalid RPC input even when the API is bypassed", async () => {
    await expect(capture(alice, "javascript:alert(1)")).rejects.toThrow(
      "Invalid capture",
    );
  });
  it("isolates saved places and source associations as well as captures", async () => {
    const source = await capture(alice);
    const place = (
      await db.query<{ id: string }>(
        "insert into public.places(user_id,identity_kind,name) values ($1,'user_confirmed','Private fixture') returning id",
        [alice],
      )
    ).rows[0];
    await db.query(
      "insert into public.saved_places(user_id,place_id,notes) values ($1,$2,'Private fixture note')",
      [alice, place.id],
    );
    await db.query(
      "insert into public.source_places(user_id,source_id,place_id,confirmation_kind) values ($1,$2,$3,'user_confirmed')",
      [alice, source.source_id, place.id],
    );
    for (const table of [
      "sources",
      "places",
      "saved_places",
      "source_places",
    ]) {
      expect(
        (await asUser(alice, (tx) => tx.query(`select * from public.${table}`)))
          .rows,
      ).toHaveLength(1);
      expect(
        (await asUser(bob, (tx) => tx.query(`select * from public.${table}`)))
          .rows,
      ).toHaveLength(0);
    }
  });
  it("retries do not reset a source after processing changes its state", async () => {
    const first = await capture(alice);
    await db.query(
      "update public.sources set status='review_required' where id=$1",
      [first.source_id],
    );
    expect(await capture(alice)).toMatchObject({
      source_id: first.source_id,
      duplicate: true,
      source_status: "review_required",
    });
    expect(
      (await db.query("select count(*)::int as n from public.processing_jobs"))
        .rows,
    ).toEqual([{ n: 1 }]);
  });
});
