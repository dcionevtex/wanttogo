# WantToGo — Decisions

Updated: 2026-11-19. These records distinguish implementation from proposals. Public configuration for the user-created Supabase project is local. After explicit approval, its migration/Auth settings were applied and schema/grants verified; real email workflow acceptance is pending.

| ID  | Status                              | Decision and rationale                                                                                                                                                 |
| --- | ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D01 | Required by AGENTS.MD               | Next.js App Router, strict TypeScript, Tailwind, shadcn/ui, Supabase Auth/PostgreSQL/RLS, Google Maps/Places, and Vercel. Do not change the stack without approval.    |
| D02 | Required by AGENTS.MD               | Commit captures before enrichment and preserve original sources. Provider failures must not lose bookmarks.                                                            |
| D03 | Proposed for M1                     | Store durable jobs in PostgreSQL alongside sources in one transaction. Avoid an additional queue service; scheduler/worker runtime remains open.                       |
| D04 | Proposed for M1                     | Use owner-scoped places and composite ownership foreign keys. This keeps personal corrections private and avoids a globally mutable shared catalog.                    |
| D05 | Required; mechanism proposed for M2 | Use revocable, capture-only, high-entropy Shortcut credentials, hash at rest, with expiry and per-credential limits. Never distribute a privileged database key.       |
| D06 | Required by AGENTS.MD               | Treat AI as a candidate extractor, not a source of coordinates or verified identity. Preserve ambiguity and manual corrections.                                        |
| D07 | Proposed for M0/M5                  | Begin with manifest/icons and static offline shell only. Private offline storage requires explicit logout/invalidation design. Apple Shortcuts handles iPhone sharing. |

## Open decisions and gates

| Question                                                    | Resolve by | Impact / default direction                                                                                                                                                  |
| ----------------------------------------------------------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Which Supabase login method?                                | M1         | Propose email magic link; confirm redirect/SMTP configuration and device behavior before implementation. No additional social provider required.                            |
| Which worker trigger/runtime fits available plans?          | M3         | Verify current scheduling/runtime constraints; use leased PostgreSQL jobs regardless of trigger. No fire-and-forget request processing.                                     |
| Which AI provider and model?                                | M3         | Evaluate one inexpensive structured-output model against representative public evidence and define a cost ceiling. No paid usage before configuration is authorized.        |
| Which Google fields can be stored, and for how long?        | M3         | Review current official policy, caching, refresh and attribution requirements before schema/API implementation. No assumed indefinite cache.                                |
| How will outbound requests prevent DNS rebinding?           | M3         | Validate runtime support for binding connections to approved addresses or an equivalent enforced egress boundary. Do not enable arbitrary external fetching until verified. |
| What are request, retention, and budget limits?             | M1/M3      | Define and test finite values before the relevant endpoint/provider is enabled. Bound input, extraction response, retries, per-user traffic and spend.                      |
| Is a user-confirmed place without a Google identity needed? | M3         | Existing scope permits manual confirmation. Keep provenance explicit and do not merge by name; finalize the review UI and accepted fields then.                             |

## Configuration sequence

M0 needs no external secrets. M1 needs Supabase URLs/keys and Auth configuration. M2 needs a reachable HTTPS environment and physical iPhone. M3 needs worker authentication, provider credentials and quotas. M5 needs restricted browser Maps configuration and release approval. Never paste credentials into documentation or chat.

## Documentation review findings

- The corrected root file is stored as `AGENTS.MD`; retain it and link using its actual case. The implementation plan refers to `AGENTS.md`; normalize this filename in a future focused change for consistent case-sensitive tooling.
- The existing plan remains authoritative. M0 is Completed, approved by the user on 2026-11-17; M1 is In Progress; M2–M5 remain Not Started.
- The browser Google Maps key is public by design and must use API/referrer restrictions. The general requirement to keep API secrets server-side does not mean a browser Maps key can remain secret.
- M1 must include durable processing intent and distributed rate limiting even though actual enrichment begins only in M3.
- Provider policy details, library versions, deployment plan limits and integrations have not been researched or verified during this documentation task.

## Next implementation scope

M0 now provides the application skeleton, responsive navigation, manifest/icons, strict tooling, environment validation and verified local setup. At the user's request, typography defaults to `Helvetica Neue, Helvetica, Arial, sans-serif` throughout the app, including headings and SVG labels. Fonts resolve locally; no proprietary font files are distributed. The UI uses native SVG illustration, a shadcn-style Button with Radix Slot/CVA, and no service worker or private offline cache. The setup follows the [Next.js installation documentation](https://nextjs.org/docs/app/getting-started/installation) and [shadcn manual configuration](https://ui.shadcn.com/docs/installation/manual), consulted on 2026-11-17. The dependency lockfile records installed versions.

M0 was reviewed and approved. M1 implementation adds Supabase SSR clients, server-verified sessions, PKCE email magic links, same-origin mutations and no-store responses. The request handler uses the public project key and the user's session, with no service-role credential. D03/D04 are now implemented in the tested migration; the worker is still absent.

Capture defaults: 4,096-character URL, 8 KiB JSON body, 60 committed requests/user/minute and 20 sources/page. Queries/fragments remain intact. SQL computes the deduplication hash itself and derives ownership from `auth.uid()`; browsers cannot directly mutate sources or access jobs/limits. Cross-table ownership is enforced with composite keys. Place writes/editing are deferred to their planned milestones.

PGlite is a dev-only test dependency because Docker/Supabase CLI were unavailable locally. It runs the SQL migration, grants and RLS in PostgreSQL; only Supabase Auth fixtures are emulated. It introduces no production database alternative. Real Supabase email/PostgREST and concurrent sessions still need verification. The hosted project is labeled PRODUCTION; the user explicitly approved applying the reviewed migration and localhost Auth settings on 2026-11-19. Both were applied, and a read-only SQL check confirmed the intended schema and grants.

Next: test the real M1 workflow after the user signs in. The migration was applied manually and is recorded in README; reconcile Supabase CLI migration history before future CLI deployment. Do not begin M2 until M1 is accepted.

## Approved password option — 2026-11-19

The user explicitly approved adding email/password sign-in with magic links retained as an alternative. The login form now defaults to password. Verification uses the official Supabase session client and `signInWithPassword`; it does not skip authentication, email confirmation, RLS or provider throttling. Account enumeration is limited by generic credential failures, and tokens are stored through SSR cookies rather than returned in JSON.

An authenticated Password settings page uses `auth.updateUser` for the current user, with a 12-character minimum, matching confirmation in the UI, same-origin protection and reauthentication handling. Initial setup requires an existing trusted session or one last successful email login after quota recovery. The agent has not created or entered any real password, changed provider settings, disabled safeguards, or introduced privileged credentials. Custom SMTP remains in backlog.
