# WantToGo

**Save now. Go later.**

A private, mobile-first PWA for collecting links to places and turning them into a searchable collection. The primary device is an iPhone; locations can be anywhere in the world.

## Current status

Milestone 0 is approved. Milestone 1 implements password and email-link sign-in, protected routes, a capture API, a paginated private Inbox, and a tested database migration. With explicit approval, the migration and localhost Auth settings were applied to the user's Supabase project on 2026-11-19; remote schema/RLS/grants were verified. Full workflow acceptance remains pending. AI processing and interactive maps are later milestones.

## Project documentation

- [Engineering instructions](AGENTS.MD)
- [Product requirements](docs/PRD.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Data model](docs/DATA_MODEL.md)
- [Implementation plan](docs/IMPLEMENTATION_PLAN.md)
- [Decisions and open questions](docs/DECISIONS.md)

## Planned stack

Next.js App Router, strict TypeScript, Tailwind CSS, shadcn/ui, Supabase PostgreSQL/Auth/RLS, Google Maps and Places, and one structured-output AI provider. Vercel is the planned hosting platform.

## Development

Read the engineering instructions and implementation plan before changing the project. Work on a feature branch and implement one milestone at a time.

Use Node.js 24 and npm, matching CI and Vercel. From the project folder:

```sh
npm ci
npm run dev
```

Open http://127.0.0.1:3000. The server binds to loopback by default. Copy `.env.example` to `.env.local` and use the same `NEXT_PUBLIC_APP_URL` origin in the browser and Auth configuration. The overview works without Supabase, and sign-in explains missing configuration. Invalid origins fail validation without logging the input value. Never put secrets in `NEXT_PUBLIC_` variables.

## Supabase setup for M1

1. Use a Supabase project designated for this application. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in `.env.local` from its dashboard. The publishable key is public by design; RLS protects records. Legacy `anon` keys are accepted; `service_role` and secret keys are rejected. No database password or privileged key is needed by the app.
2. Review [the migration](supabase/migrations/202611190001_capture_foundation.sql). It creates six tables, owner-read RLS policies, indexes, ownership constraints and the transactional `capture_url` function. It makes no external API calls and creates no worker. Apply it once through the project's normal migration workflow. Changes to a production branch require explicit approval first. Do not rerun a partially applied migration blindly; its explicit transaction makes creation atomic.
3. Set Supabase Auth's Site URL to `http://127.0.0.1:3000` and allow exactly `http://127.0.0.1:3000/auth/callback` as an additional redirect. Avoid wildcard production redirects. Match the scheme, hostname and port exactly. Keep email authentication enabled. The app requests a PKCE magic link using `signInWithOtp`; the default confirmation link must preserve the callback code. Open it in the browser that requested it.
4. Configure a permitted email sender/recipient arrangement for the project. Supabase's email delivery/rate limits depend on its current settings; local automated tests do not prove email delivery. Do not disable email verification for testing or use admin keys in the client.
5. Rebuild/restart after changing public environment values. Sign in at `/login`, save a URL at `/inbox`, reload and confirm it remains. Repeat the same link and confirm it returns the existing source. Sign out, then use a second account to check data isolation. Verify denied/expired sessions, invalid URLs, pagination with more than 20 sources and a failed-save retry. Do not mark M1 complete until the real workflow is verified and approved.

Deployment record: `202611190001_capture_foundation.sql` was applied manually, once, through SQL Editor to project `kixejgpuqzbaxpmwkhbr` on 2026-11-19 after user approval and verification that the public schema was empty. Post-apply checks in `supabase/tests/verify_m1.sql` returned the expected 6 tables, 6 RLS flags, 4 policies and privilege booleans. The Site URL and exact localhost callback above were saved successfully. The SQL Editor operation does not register a Supabase CLI migration history entry. Before switching to CLI migration deployment, reconcile the remote migration history using the official CLI workflow to avoid replaying this schema. No remote migration history table has been modified manually.

The implementation follows [Supabase SSR guidance](https://supabase.com/docs/guides/auth/server-side/creating-a-client?framework=nextjs) and [passwordless email guidance](https://supabase.com/docs/guides/auth/auth-email-passwordless), reviewed on 2026-11-19.

## Capture behavior and limits

### Password sign-in and initial setup

The user approved password sign-in as the default method on 2026-11-19. `/login` offers Password and Email link explicitly. Password sign-in calls Supabase `signInWithPassword` through the same-origin, bounded JSON endpoint `/api/auth/password`. It creates no account, sends no login email and returns no credentials/tokens. Normal Supabase validation, confirmation requirements and rate limits remain in effect; this is not an authentication bypass. Invalid account/password/confirmation outcomes use the same generic error.

Existing magic-link accounts may not have a password. **One-time setup still requires a trusted authenticated session.** Once signed in, choose **Password settings** in the Inbox (or open `/account/password`), enter and confirm a new password of at least 12 characters, and save it yourself. The owner-only endpoint uses `auth.getUser()` and `auth.updateUser({ password })`; it accepts no target user ID and requires the same origin. Supabase can require a fresh sign-in before this change. The app neither logs nor stores the plaintext password and never uses a service-role key. Do not send passwords through chat or set them with SQL that records plaintext in query logs.

The hosted dashboard was inspected: the existing account is email-confirmed, and its self-service recovery action sends email. No password was set or reset by the agent. If no authenticated browser session remains and no password exists, wait for the email quota to recover and complete one last email sign-in before setting the password. Future password sign-ins do not consume email quota. The SMTP backlog item remains deferred; no email-confirmation or rate-limit protection has been disabled.

Implementation follows [Supabase password sign-in](https://supabase.com/docs/reference/javascript/auth-signinwithpassword) and [authenticated password updates](https://supabase.com/docs/reference/javascript/auth-updateuser), checked on 2026-11-19.

### Sign-in email limit

On 2026-11-19 the hosted Auth logs reported `over_email_send_rate_limit`. Custom SMTP is disabled. The [built-in provider currently allows two email messages per hour across the project](https://supabase.com/docs/guides/auth/rate-limits), shared by confirmation/recovery/sign-in flows. This is separate from the short per-user resend interval. Waiting one minute does not guarantee the hourly quota will reset, and the API therefore does not invent a Retry-After value for Auth limits. Wait for quota capacity to return before retrying; repeated requests do not resolve this condition. Custom SMTP is the supported longer-term option and requires an approved provider/configuration. No limits, confirmation requirements or SMTP settings were weakened or changed during this diagnosis.

Auth logs also recorded successful email verification, token exchange, owner-scoped Inbox reads and a capture RPC before the quota was exhausted. Those observations confirm provider connectivity, but do not replace the remaining deliberate reload/duplicate/multi-user/concurrency acceptance checks.

`POST /api/v1/captures` accepts JSON `{ "url": "https://example.com/place" }` with the authenticated session cookie and an exact matching `Origin`. It returns `201` for a new committed source/job, `200` for an existing capture, `400` for invalid input, `401` for missing/expired sessions, `403` for a wrong origin, `413` for a body over 8 KiB, `415` for non-JSON, `429` when throttled, or `503` on an unconfirmed storage/configuration failure. Duplicate responses preserve the existing processing state. Errors never expose upstream database messages.

URLs are limited to 4,096 characters and public HTTP(S) destinations without credentials or custom ports. Standard URL canonicalization normalizes hostname/default ports while preserving paths, queries, fragments and the original source. Private/reserved literal IPs and local hostnames are rejected. Capture performs **no fetch**, DNS lookup, AI call, or Places request. DNS/redirect/connection SSRF checks are mandatory before any future worker fetch.

The database enforces 60 committed capture requests per user per UTC minute, including duplicates. The quota uses one atomic durable row per user and does not rely on a single server process. Calls that exceed the limit return `429`; UI retains the input for retry. Login requests also respect Supabase Auth's provider limits.

`GET /api/v1/captures` returns 20 owner-scoped sources per page and an opaque cursor. The Inbox uses the same keyset query. All private API/route responses prohibit caching. Sign-out performs a hard navigation to discard the in-memory router cache; no private offline storage exists.

Only owner reads are granted on user-owned tables. Writes go through the authenticated transactional RPC, deriving ownership from `auth.uid()`, and jobs/rate counters cannot be accessed from the browser. The public RPC also validates bounded HTTP(S) strings, but callers outside the app can bypass the app's fuller URL checks: any future worker must independently validate every destination. Schema/relationship definitions are foundations for later milestones; they do not expose saved-place editing yet.

```sh
npm run lint
npm run typecheck
npm test
npm run format:check
npm run build
npm run start
```

For browser tests, stop any process already using port 3000, build the app, and run:

```sh
npx playwright install chromium webkit
npm run test:e2e
```

Playwright starts the production server and exercises desktop Chromium and mobile WebKit. Its smoke tests use no signed-in account and never send login email. Unit tests mock Auth/API boundaries; database tests run the actual migration in PGlite PostgreSQL with only `auth.users`, `auth.uid()` and the authenticated/anonymous roles emulated. They verify RLS, uniqueness, transactional rollback, grants, limits and ownership constraints. PGlite is a dev-only test dependency, not application storage, and its single connection does not establish multi-connection race behavior. Verify real Supabase Auth/PostgREST and concurrent requests against the configured project separately. Mobile emulation does not replace a physical iPhone installation/share test. Regenerate raster icons from the checked-in vector artwork with `node scripts/generate-icons.mjs`.

## Continuous integration

`.github/workflows/ci.yml` checks pushes and pull requests on a clean Ubuntu runner with Node.js 24. It installs from the lockfile, runs formatting/lint/TypeScript, the local PostgreSQL and unit tests, a production build, and Chromium/mobile-WebKit smoke tests. It requires no Supabase or SMTP credentials and explicitly leaves the Supabase configuration blank, so it cannot send login email or modify the hosted project. GitHub actions are pinned to verified v6 commit SHAs and the workflow token has read-only contents access.

The workflow follows the [official Playwright CI setup](https://playwright.dev/docs/ci). Local verification of equivalent commands is separate from an actual hosted GitHub Actions run: a hosted run only occurs after this workflow and the application are pushed. `.tmp/` is ignored scratch space for checking a clean install without disturbing the active development dependencies.

Verified locally on Windows/Node 24 from a separate lockfile installation without `.env.local`: formatting, lint, TypeScript, 88 unit/database tests, production build, and 8 browser tests all passed. The [hosted Ubuntu job also passed](https://github.com/dcionevtex/wanttogo/actions/runs/44598797884) for commit `0e56f1e`. npm currently reports peer-range warnings from transitive ESLint plugins; installation and lint complete successfully with the committed versions.

## Vercel deployment

The user approved direct MVP publication from `main`. The connected project is `wanttogo` with domain `https://wanttogo-xi.vercel.app`. Use the Next.js framework preset, repository root, Node.js 24.x, `npm ci` and `npm run build`, with the default Next.js output directory. Pushes to the production branch trigger deployment automatically.

Production environment variables are `NEXT_PUBLIC_APP_URL=https://wanttogo-xi.vercel.app`, the project's public Supabase URL and its publishable key. Configure them in Vercel rather than committing environment files; no privileged key is required. Preview deployments need their own explicit origin and Auth callback configuration before authenticated testing.

For production, Supabase Auth must use `https://wanttogo-xi.vercel.app` as Site URL and allow exactly `https://wanttogo-xi.vercel.app/auth/callback`. Retain the explicit localhost callback for development. Email quota and first-password setup limitations above still apply; deployment does not establish M1 acceptance.

## PWA foundation

The manifest is served at `/manifest.webmanifest` with standalone mode, 192/512px icons, and a separate maskable icon. The Apple touch icon is 180px. Typography uses the local system stack `Helvetica Neue, Helvetica, Arial, sans-serif` throughout the app, without remote font requests. Appearance depends on installed fonts. Installation on a deployed HTTPS origin and a real iPhone remains a release check. No service worker or offline capture is implemented; private data is not cached. A manifest alone does not establish full offline PWA behavior.

The first useful end-to-end workflow follows in Milestone 1: sign in, save a URL, reload, and retrieve it from the private Inbox. That requires Supabase setup. See the implementation plan for the review status of M0 and the gates for later milestones.

Never commit secrets. Configure external services only when their dependent milestone begins. Production deployment requires explicit approval.
