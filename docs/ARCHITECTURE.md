# WantToGo — Architecture

Status: M0 approved. M1 Auth/capture/Inbox code and SQL migration implemented and tested locally. With explicit user approval on 2026-11-19, the migration and exact localhost Auth settings were applied to the user-created Supabase project and remote schema/grants verified. Live email/session workflow acceptance remains pending. Worker/enrichment architecture remains proposed for M3.

## Components and trust boundaries

- Next.js App Router renders the mobile UI. Route Handlers validate requests and enforce identity and ownership.
- Supabase Auth supplies user sessions. Database RLS enforces isolation in addition to API checks.
- PostgreSQL stores sources, personal places, associations, and durable processing intent.
- A server-side worker claims database jobs and calls bounded extraction, AI, and Google Places adapters. The worker's trigger mechanism remains open; an ordinary request must never depend on an unawaited background promise for durability.
- Google Maps JavaScript runs in the browser with a separate restricted browser key. AI and privileged Places credentials stay on the server.
- Apple Shortcuts sends HTTPS requests with a capture-only credential, never a Supabase service-role key.

## Capture transaction

`POST /api/v1/captures` accepts `{ "url": "https://example.com/place" }` with a session (M1) or scoped bearer credential (M2).

1. Authenticate and apply a durable rate limit per user/credential. Cookie-based mutation requests also enforce same-origin/CSRF protection.
2. Validate input size and HTTP(S) syntax; reject embedded credentials and unsafe destinations. Do not fetch the submitted URL during capture.
3. Preserve the original string. Produce a conservative normalized URL and a SHA-256 lookup hash.
4. In one database transaction, insert the source and one processing job. Enforce uniqueness in the database; concurrent duplicate submissions return the existing source without resetting state or enqueueing duplicate work. Check normalized strings when handling a hash conflict.
5. Return `201` for a new persisted capture or `200` for an existing source, including `{ sourceId, status, duplicate }`. Database failure returns an error, never success.

Proposed errors: `400` invalid input, `401` unauthenticated/revoked credential, `403` forbidden request, `429` throttled with retry guidance, and `503` temporary storage failure. Do not reveal another user's record existence.

## Durable processing

Jobs exist from M1; enrichment starts in M3. A database-backed queue avoids an additional queue service initially. Claim ready jobs atomically with row locking, an expiring lease, and a unique attempt token. Commit before network work; never hold a transaction open across external calls.

The worker persists `processing`, fetches permitted public evidence, runs deterministic extraction first, validates AI candidates where necessary, and resolves identity using Google Places. It commits associations and the terminal source state atomically. Updates must match the active lease token so an expired worker cannot overwrite a newer attempt. Refresh or expire leases explicitly; reclaim interrupted jobs.

Proposed defaults for implementation tests: three automatic attempts with exponential backoff; external requests have explicit timeouts, response-size and redirect limits. Final values must fit the chosen runtime's measured limits. Retry transient network, quota, and provider errors; inaccessible or ambiguous evidence goes to review. Exhausted transient failures become `failed`. Manual retry is owner-scoped, idempotent, and preserves confirmed associations and notes.

| Source state    | Meaning                                                                      |
| --------------- | ---------------------------------------------------------------------------- |
| pending         | Durable intent exists; waiting for a worker/provider                         |
| processing      | An active worker lease owns the attempt                                      |
| resolved        | Processing completed with confirmed place associations                       |
| review_required | Evidence absent, blocked, ambiguous, or partly unresolved                    |
| failed          | Processing exhausted retries or encountered an unrecoverable technical error |

## Isolation and deletion

Use owner-scoped place records for the MVP, even when two users save the same Google Place ID. This avoids exposing private manual corrections or source associations through a global shared place row. Verified identity deduplication occurs within the user. Composite foreign keys enforce ownership across associations.

Session paths use RLS-aware clients. Privileged worker and Shortcut paths bypass RLS only when necessary and must explicitly constrain owner IDs. Worker endpoints require separate authentication. Tests must cover both direct database access and API authorization.

Delete behavior is defined in the data model. A worker must tolerate a source being deleted while it processes and must not recreate it. Logs contain stable IDs, sanitized error categories, durations and usage, not tokens, full private URLs, or raw provider responses by default.

## External content security

An SSRF-aware fetcher must validate DNS results and the actual destination, block internal/reserved IPv4 and IPv6 ranges, constrain outbound ports, and repeat validation on every redirect. Prevent DNS rebinding by binding connections to validated destinations while preserving TLS hostname verification. Reject oversized responses and unsupported content types. No arbitrary internal fetch proxy is exposed to clients.

Treat webpages and AI results as data, not instructions. Schema validation, evidence checks, safe rendering, and explicit review protect the application from malicious content and invented locations.

## Provider and PWA boundaries

Use one AI adapter behind a small typed interface; choose the provider/model at M3 after a representative evaluation. No automatic expensive fallback. Record usage and enforce a budget before calls.

Google Places persistence, refresh, field masks, and attribution must be checked against current official terms before implementing storage. Keep user-authored data separate from provider-derived fields. No perpetual storage policy is assumed here.

M0 adds a manifest and icons; actual installation and offline behavior require later browser/device verification. Introduce only static asset/offline-shell caching initially. Do not intercept and cache authenticated API responses. iPhone capture uses Apple Shortcuts rather than assuming browser share-target support.

## Validation and configuration gates

- M0: app shell, lint, typecheck, unit runner, production build, manifest validation; no provider credentials required.
- M1: Supabase configuration and migrations; transactional capture, concurrency, auth, RLS and failure recovery tests.
- M2: credential lifecycle and physical iPhone evidence; HTTPS reachable environment.
- M3: choose and verify worker scheduling, egress protection, AI provider, Google Places policies and quotas before enabling real extraction.
- M4/M5: collection filters and geographic correctness, then real Maps/iPhone integration and release checks.

Use the implementation plan for full acceptance criteria. This document defines intended behavior and does not claim deployed integrations.
