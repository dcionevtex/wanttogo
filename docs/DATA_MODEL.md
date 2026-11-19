# WantToGo — Proposed Data Model

M1 schema is implemented in `supabase/migrations/202611190001_capture_foundation.sql` and tested in PGlite PostgreSQL. With explicit user approval, the same file was applied through SQL Editor to project `kixejgpuqzbaxpmwkhbr` on 2026-11-19. Read-only schema/grant verification matched `supabase/tests/verify_m1.sql`. Candidate/credential/cache additions remain future work. All identifiers below are UUIDs unless specified; timestamps use `timestamptz` in UTC.

## Relationships

`auth.users` owns sources, places, saved places, capture credentials, and processing jobs. A source has many places through `source_places`; a saved place can have many source links. Physical identity is deduplicated per user, not across users.

## Tables

| Table               | Principal fields                                                                                                                                                                                                        | Constraints and purpose                                                                                                                                                                                                              |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| sources             | id, user_id, original_url, normalized_url, url_hash, platform, status, safe_error_code, created_at, updated_at                                                                                                          | Unique `(user_id, url_hash)`; compare normalized string on conflict. Status follows architecture state table. Never replace original_url with extracted data.                                                                        |
| places              | id, user_id, google_place_id nullable, identity_kind, user-authored name/address/city/country/category nullable, latitude/longitude nullable, coordinate_origin nullable, confirmed_at nullable, created_at, updated_at | Partial unique `(user_id, google_place_id)` for non-null verified IDs. No name-based uniqueness. Coordinates must be both null or both valid; latitude -90..90, longitude -180..180. AI candidates never supply trusted coordinates. |
| saved_places        | id, user_id, place_id, visit_status, notes nullable, saved_at, visited_at nullable, updated_at                                                                                                                          | Unique `(user_id, place_id)`. Status `want_to_go` or `visited`; visited_at cleared when returning to want_to_go.                                                                                                                     |
| source_places       | user_id, source_id, place_id, confirmation_kind, confirmed_at, created_at                                                                                                                                               | Primary key `(user_id, source_id, place_id)`; confirmation records user or verified matching origin. Link only a place in this user's saved collection.                                                                              |
| processing_jobs     | id, user_id, source_id, state, attempt_count, available_at, lease_until nullable, lease_token nullable, safe_error_code nullable, created_at, updated_at                                                                | One job per source for the MVP. States queued/running/completed/failed; manual retry resets scheduling, not source evidence or user corrections. Worker-only mutations.                                                              |
| place_candidates    | id, user_id, source_id, attempt_token, candidate_data, evidence_excerpt, review_state, created_at                                                                                                                       | Untrusted, schema-validated candidates separate from confirmed places. Bound field sizes and retention. Never treat candidate JSON as authoritative geography. Introduced in M3.                                                     |
| capture_credentials | id, user_id, token_hash, label, scope, created_at, expires_at, revoked_at nullable, last_used_at nullable                                                                                                               | Unique token hash; scope capture-only. Generate high-entropy secrets, reveal once, store only a cryptographic hash. Introduced in M2.                                                                                                |

Rate limiting also requires an atomic durable counter/bucket per user or credential and time window, introduced with capture. Its storage is server-only and expires old windows; no in-memory-only limit is sufficient across multiple instances.

Provider-derived Google fields need a separate, policy-reviewed cache with provenance, retrieval/expiry timestamps, and attribution if storage is permitted. Do not copy provider responses into permanent user-authored fields. Exact allowed fields and retention are an M3 implementation gate.

## Ownership and RLS

Add unique `(user_id, id)` keys on referenced owner-scoped tables and composite foreign keys for all owned relationships. A foreign key to an ID alone does not prove common ownership.

- `sources` and personal collection rows: authenticated owner-only reads; validated mutations through defined API/RPC operations. Do not grant clients arbitrary processing-state changes.
- `source_places`: references an owned source and owned saved-place relationship; enforce consistency in PostgreSQL, not only application code.
- `processing_jobs`, credentials' hashes, and rate-limit storage: no direct browser access. Provision/revoke credentials through authenticated server routes and return only safe metadata.
- Candidates: owner-only review reads; worker writes and explicit review actions. Users cannot confirm another user's candidate.
- All exposed tables enable RLS. Grant only necessary operations; use constrained functions with fixed search paths where transactional server operations require elevated rights.

Test policies with at least two authenticated users and an anonymous client. Test composite foreign keys against cross-user association attempts even through privileged application code.

## Transaction and index plan

M1 introduces sources and jobs in the same transaction plus the core place relationship schema. Index Inbox pagination on `(user_id, created_at, id)` and job readiness on `(state, available_at)`. A unique source constraint arbitrates concurrent captures; no check-then-insert race.

M3 adds candidates and atomic job claim/finalization functions. M4 adds collection search/filter indexes based on query plans. M5 evaluates PostGIS geography with a spatial index for meters-based radius queries; stored coordinates have known provenance. Do not introduce an extension before there is a tested query requirement.

## Deletion and retention

- Deleting a source cascades its jobs, candidates, and source-place links; saved places remain.
- Deleting a saved place removes its source-place links and notes/status. Delete the associated owner-scoped place if no relationship remains, in the same operation. Preserve source bookmarks.
- Deleting an account removes all owned records through reviewed cascades, including credentials and queue state.
- Workers must not recreate deleted rows or finalize expired leases.
- Keep processing error categories and bounded evidence only as needed. Set explicit retention periods for candidates, logs, and provider cache before enabling enrichment. Do not log raw capture credentials or full source URLs by default.

All schema and policy changes require version-controlled migrations with rollback/recovery considerations. Destructive production migrations require approval.
