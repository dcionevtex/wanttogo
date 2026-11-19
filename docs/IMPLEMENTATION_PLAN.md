# WantToGo — Implementation Plan

**Version:** 1.0  
**Status:** In Progress
**Product:** WantToGo — Save Now. Go Later.  
**Platform:** Mobile-first PWA  
**Primary Device:** iPhone  
**Geographic Scope:** Global

---

## 1. Project Objective

Build a reliable Progressive Web Application that lets users capture URLs from social media and websites, automatically identify places, and organize them into a private, searchable, geolocated collection.

The MVP must support:

1. URL capture via Apple Shortcuts and manual input.
2. Persistent Inbox with asynchronous processing.
3. AI-powered place identification and Google Places verification.
4. Saved places with search, filters, and visit status.
5. Interactive map and nearby saved places.
6. Source and physical place deduplication.

The first release is intended for personal use, but the architecture must support multiple users.

## 2. Engineering Strategy

### Development principles

- Deliver small, independently testable milestones.
- Keep the application deployable after every completed milestone.
- Prefer simplicity over premature abstraction.
- Never implement features outside the approved MVP without authorization.
- Never commit secrets or production credentials.
- Use version-controlled database migrations.
- Maintain strict TypeScript configuration.
- Treat external URLs and AI outputs as untrusted data.
- Prioritize data persistence and recoverability over extraction completeness.
- Do not mark tasks complete without evidence.

### Working agreement with Codex

Before starting a milestone:

1. Read `AGENTS.md`.
2. Read `docs/PRD.md` and `docs/ARCHITECTURE.md`, if available.
3. Review the existing implementation.
4. Identify dependencies and missing credentials.
5. Present an implementation approach.

During implementation:

- Work in a feature branch.
- Make focused commits.
- Maintain compatibility with previous milestones.
- Add tests for critical behavior.
- Avoid unrelated refactoring.

After implementation:

- Execute relevant tests and checks.
- Summarize all modified files.
- Document configuration requirements.
- Update milestone status and acceptance criteria.
- Prepare changes for review.

Never merge or deploy to production without explicit approval.

---

# Milestone 0 — Project Foundation

**Priority:** P0  
**Status:** Completed

### M0 verification — 2026-11-17

Implemented the Next.js shell, responsive navigation and preview routes, Tailwind/shadcn Button setup, strict TypeScript, environment validation, PWA manifest/icons, local fonts and test tooling. No live capture or external services are connected.

Validation: lint and TypeScript passed; 8 unit tests and 4 Playwright tests passed (desktop Chromium and iPhone-sized WebKit); production build passed; README links and formatting checked. Desktop/mobile screenshots inspected. The manifest and icon dimensions were checked through HTTP. Dependencies reported zero known vulnerabilities during installation; this is not a complete security audit.

User reviewed the preview and approved M0 on 2026-11-17 after the app-wide Helvetica-style typography change. The updated production build passed and desktop/mobile screenshots were inspected. Full iPhone installation and sharing tests remain in their dependent milestones. No production deployment, offline support, or service worker has been added. Run commands are in README.md. M1 remains Not Started.

## Goal

Establish a maintainable codebase, development standards, documentation, and basic application structure.

## Tasks

- [x] Initialize Next.js with App Router and TypeScript.
- [x] Configure TypeScript strict mode.
- [x] Install Tailwind CSS.
- [x] Configure shadcn/ui.
- [x] Establish project folder structure.
- [x] Configure ESLint and formatting.
- [x] Configure environment variable validation.
- [x] Create `.env.example` with placeholder values.
- [x] Create `.gitignore`.
- [x] Configure Vitest and React Testing Library.
- [x] Configure Playwright for future E2E testing.
- [x] Create basic layout and application shell.
- [x] Implement responsive navigation.
- [x] Add PWA manifest and required icons.
- [x] Document local development setup.
- [x] Verify production build.

## Suggested Directory Structure

```text
wanttogo/
├── app/
│   ├── (auth)/
│   ├── (app)/
│   │   ├── inbox/
│   │   ├── places/
│   │   └── map/
│   ├── api/
│   │   └── v1/
│   └── layout.tsx
├── components/
│   ├── ui/
│   ├── layout/
│   ├── inbox/
│   ├── places/
│   └── maps/
├── lib/
│   ├── supabase/
│   ├── ai/
│   ├── google/
│   ├── extraction/
│   ├── security/
│   └── utils/
├── supabase/
│   └── migrations/
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── public/
├── docs/
│   ├── PRD.md
│   ├── ARCHITECTURE.md
│   ├── DATA_MODEL.md
│   ├── DECISIONS.md
│   └── IMPLEMENTATION_PLAN.md
├── AGENTS.md
├── README.md
└── .env.example
```

The directory structure is a starting recommendation, not a requirement to create unused files or folders.

## Acceptance Criteria

- [x] Application runs locally.
- [x] Landing page renders correctly on desktop and mobile.
- [x] TypeScript passes without errors.
- [x] Lint passes.
- [x] Unit test command executes successfully.
- [x] Production build completes.
- [x] PWA manifest is valid.
- [x] No secrets exist in the repository.
- [x] README contains working setup instructions.

## Deliverable

A functional application skeleton with development tooling and documentation.

---

# Milestone 1 — Authentication, Database and URL Capture

**Priority:** P0  
**Status:** In Progress
**Depends on:** Milestone 0

### M1 implementation checkpoint — 2026-11-19

The task checkboxes below track code and local schema implementation, not remote application or milestone acceptance. Implemented email magic-link/PKCE Auth, session refresh, guarded pages, logout, capture validation, transactional SQL RPC, durable rate limiting, and a 20-item keyset-paginated Inbox. The migration creates six RLS-enabled tables with composite ownership constraints; jobs and quota state have no browser grants.

Verification: 64 unit/database tests passed, including actual PostgreSQL RLS/rollback/constraints in PGlite with the Auth boundary emulated; 6 Chromium/mobile-WebKit browser smoke tests passed; production build, lint, TypeScript and formatting passed. No AI provider is needed or called. PGlite tests do not validate hosted Supabase Auth/PostgREST or multi-connection concurrency.

The user created Supabase project `kixejgpuqzbaxpmwkhbr`. Its public URL/key were configured only in ignored `.env.local`. The user explicitly approved remote migration and Auth redirect configuration on 2026-11-19. The migration was applied once through SQL Editor after confirming an empty public schema. Read-only verification confirmed 6 tables, RLS on all 6, 4 owner-read policies, authenticated-only capture execution, no direct authenticated source inserts and no browser job reads. Site URL is `http://127.0.0.1:3000` and the single allowed callback is `http://127.0.0.1:3000/auth/callback`.

Real email sign-in, save/reload, duplicate/concurrent requests, second-account isolation and pagination remain to be verified on that project before acceptance. The user has been asked to sign in through the local app without sharing auth codes or links in chat. No application production deployment has occurred. M2 remains Not Started.

Email test follow-up: hosted Auth logs subsequently confirmed successful email verification/token exchange, owner-scoped source reads and a capture RPC. Further sign-in requests reached `over_email_send_rate_limit` with custom SMTP disabled. The API message was corrected to distinguish the email quota from a short resend cooldown; no unsupported one-minute retry header is returned for Auth limits. Existing security settings were preserved. Remaining deliberate workflow and second-user acceptance checks are still pending; M1 remains In Progress.

Offline acceptance progress: the existing browser session was no longer authenticated and correctly redirected Inbox access to login. Added Supabase-client HTTP contract tests for 20-item pagination, tied microsecond timestamps, cursor tampering, empty/final pages and failed loads; responses are mocked, so these are not live PostgREST acceptance. Expanded real local PostgreSQL checks to cover owner-only reads across all four user-facing tables and ensure duplicate retries preserve review state and the single processing job. All 74 unit/database tests passed. No test email was sent and no remote records were modified. Password sign-in has been discussed as an alternative but has not been implemented or enabled by this work.

Password follow-up (approved by the user): email/password sign-in is now the default, with email links retained as an explicit alternative. Added an authenticated Password settings page and current-user-only update endpoint. Supabase verifies all sessions/credentials and retains its confirmation, RLS, rate-limit and reauthentication requirements. All 88 unit/database tests passed and the production build passed. Initial password setup and live password login must be completed by the user; no real password has been created, entered or observed by the agent. With no existing session/password, one successful email sign-in is still required after quota recovery. SMTP remains deferred in B01.

CI preparation: added `.github/workflows/ci.yml` for pushes/PRs with read-only permissions and pinned GitHub action SHAs. It runs on Ubuntu/Node 24 without Supabase credentials. A separate local copy installed the lockfile with `npm ci`; formatting, lint, TypeScript, all 88 unit/database tests, production build and 8 browser tests passed there without `.env.local` or live provider configuration. The unconfigured password-update route is expected to fail closed with 503, while configured unauthenticated requests return 401. This is Windows verification of equivalent commands, not evidence of a hosted Ubuntu workflow run. That run remains pending until the branch/workflow are pushed. No email quota was consumed and M2 has not started.

## Goal

Enable authenticated users to save URLs reliably and retrieve them in a persistent Inbox.

This milestone establishes the core product value.

## Tasks

### Authentication

- [x] Create Supabase browser and server clients.
- [x] Implement Supabase Auth.
- [x] Implement login and logout.
- [x] Protect private application routes.
- [x] Implement authenticated API access.
- [x] Add clear unauthorized and expired-session handling.

### Database

- [x] Create `sources` table.
- [x] Create `places` table.
- [x] Create `saved_places` table.
- [x] Create `source_places` table.
- [x] Add necessary indexes and constraints.
- [x] Enable RLS on user-owned tables.
- [x] Implement ownership-aware access policies.
- [x] Add migration tests or schema verification.
- [x] Define delete behavior to avoid orphaned records.

### Capture API

Implement:

`POST /api/v1/captures`

Requirements:

- [x] Validate request schema.
- [x] Accept HTTP and HTTPS URLs.
- [x] Reject unsafe schemes and malformed URLs.
- [x] Normalize URLs conservatively.
- [x] Preserve the original submitted URL.
- [x] Implement user-scoped idempotency.
- [x] Persist the capture transactionally.
- [x] Record a durable processing intent.
- [x] Return a source ID and pending status.
- [x] Apply authentication and rate limiting.

### Manual Capture UI

- [x] Implement URL submission form.
- [x] Show validation errors.
- [x] Show successful persistence confirmation.
- [x] Prevent accidental repeated submissions.
- [x] Support touch-friendly mobile interaction.

### Inbox UI

- [x] Show saved sources.
- [x] Display source domain and original URL.
- [x] Show capture timestamp.
- [x] Display processing state.
- [x] Allow opening original links.
- [x] Implement empty and loading states.
- [x] Implement pagination.

## Acceptance Criteria

- [ ] An authenticated user can submit a valid URL.
- [ ] The URL is persisted before success is shown.
- [ ] The submitted source appears in the Inbox.
- [ ] Duplicate submissions return the existing source.
- [ ] An invalid URL is rejected.
- [ ] A user cannot view another user's captures.
- [ ] The system stores processing intent durably.
- [ ] The application works without an AI provider configured.

## Deliverable

A usable private URL bookmarking application.

**First meaningful user milestone:** save a link and retrieve it later.

---

# Milestone 2 — iPhone Share Integration

**Priority:** P0  
**Status:** Not Started  
**Depends on:** Milestone 1

## Goal

Allow users to capture links directly from the iPhone share sheet without opening WantToGo manually.

## Tasks

### Shortcut Authentication

- [ ] Design a scoped capture credential mechanism.
- [ ] Store credential hashes server-side.
- [ ] Allow credential revocation.
- [ ] Authenticate Shortcut requests.
- [ ] Prevent embedding service-role credentials in the Shortcut.
- [ ] Apply rate limits to Shortcut credentials.

### Capture Integration

- [ ] Support Shortcut authentication in the capture endpoint.
- [ ] Accept shared URLs.
- [ ] Return a clear success or failure response.
- [ ] Maintain idempotency.
- [ ] Preserve submitted links without requiring enrichment.

### Shortcut Setup

- [ ] Document creation of an Apple Shortcut.
- [ ] Configure Shortcut to accept URLs from Share Sheet.
- [ ] Configure HTTPS submission.
- [ ] Display server confirmation.
- [ ] Document secure credential provisioning.
- [ ] Document troubleshooting steps.

## Acceptance Criteria

- [ ] A link shared from Safari is saved through the Shortcut.
- [ ] The source appears in the Inbox.
- [ ] Authentication works without opening the PWA each time.
- [ ] Expired or revoked credentials are rejected.
- [ ] Network failures do not display a false success message.
- [ ] Repeated capture does not create duplicate records.
- [ ] The Shortcut is tested on a physical iPhone.

## Deliverable

A working iPhone Share Sheet → WantToGo capture experience.

---

# Milestone 3 — Asynchronous Extraction and Place Identification

**Priority:** P1  
**Status:** Not Started  
**Depends on:** Milestones 1 and 2

## Goal

Convert saved URLs into structured, verified places, with reliable fallbacks.

## Tasks

### Background Processing

- [ ] Implement durable background job processing.
- [ ] Support pending, processing, resolved, review_required, and failed states.
- [ ] Add bounded retries with exponential backoff.
- [ ] Recover interrupted jobs.
- [ ] Prevent concurrent duplicate processing.
- [ ] Record processing errors without exposing credentials.
- [ ] Add manual retry endpoint.

### Content Extraction

- [ ] Detect source platform.
- [ ] Extract publicly accessible page metadata.
- [ ] Extract Open Graph metadata where available.
- [ ] Extract supported structured data, including JSON-LD.
- [ ] Implement HTTP timeouts and response-size limits.
- [ ] Implement SSRF protection across redirects.
- [ ] Do not attempt to bypass platform restrictions.
- [ ] Preserve links when content cannot be accessed.

### AI Provider

- [ ] Define provider-independent extraction interface.
- [ ] Implement one low-cost AI provider.
- [ ] Use structured JSON outputs.
- [ ] Validate outputs using a schema.
- [ ] Support zero, one, or multiple candidates.
- [ ] Preserve supporting evidence.
- [ ] Reject unsupported invented location information.
- [ ] Track token use and estimated cost.

### Google Places Integration

- [ ] Implement Places Text Search (New).
- [ ] Use minimal required field masks.
- [ ] Resolve candidate place identities.
- [ ] Verify city and country context.
- [ ] Avoid automatic selection when multiple candidates are plausible.
- [ ] Respect provider caching and attribution requirements.
- [ ] Make Google API requests server-side where appropriate.

### Manual Review

- [ ] Display unresolved or ambiguous captures.
- [ ] Allow the user to search Google Places manually.
- [ ] Allow the user to select a candidate.
- [ ] Allow association of multiple places with one source.
- [ ] Preserve user corrections on retries.

## Acceptance Criteria

- [ ] A public website with sufficient place information can be resolved.
- [ ] An inaccessible Instagram Reel remains saved.
- [ ] An ambiguous result requires review.
- [ ] User-confirmed corrections are preserved.
- [ ] Failed jobs can be retried.
- [ ] A source with multiple places can reference multiple records.
- [ ] The system never generates fake coordinates.
- [ ] AI and Google API calls are covered by mocks in automated tests.
- [ ] Real integration behavior is validated separately.

## Deliverable

An automated source-to-place identification pipeline with manual recovery.

---

# Milestone 4 — Saved Places, Search and Deduplication

**Priority:** P1  
**Status:** Not Started  
**Depends on:** Milestone 3

## Goal

Provide a useful personal collection of places without duplicate entries.

## Tasks

### Saved Places

- [ ] Implement saved places listing.
- [ ] Implement place details.
- [ ] Implement Want to Go / Visited status.
- [ ] Preserve all associated source links.
- [ ] Allow personal notes.
- [ ] Allow user corrections where permitted.
- [ ] Support deleting personal saved records safely.

### Search and Filters

- [ ] Search by place name.
- [ ] Filter by country.
- [ ] Filter by city.
- [ ] Filter by category.
- [ ] Filter by visit status.
- [ ] Filter by source platform.
- [ ] Sort by saved date and name.
- [ ] Support combined filters.
- [ ] Implement empty states.

### Deduplication

- [ ] Deduplicate normalized URLs per user.
- [ ] Deduplicate confirmed places using verified identities.
- [ ] Associate multiple sources with one saved place.
- [ ] Avoid merging different branches or distinct locations.
- [ ] Avoid merging similarly named places without sufficient evidence.
- [ ] Preserve source associations when merging.
- [ ] Ensure processing retries do not create duplicates.

## Acceptance Criteria

- [ ] Multiple links to the same confirmed place appear as one saved place.
- [ ] All original links remain accessible.
- [ ] Different establishments with similar names remain distinct.
- [ ] Search returns matching saved locations.
- [ ] Combined filters work correctly.
- [ ] Updating visit status persists.
- [ ] Users cannot access other users' saved places.
- [ ] Duplicate detection is safe under concurrent requests.

## Deliverable

A searchable personal places library.

---

# Milestone 5 — Maps, Nearby Places and MVP Release

**Priority:** P1  
**Status:** Not Started  
**Depends on:** Milestone 4

## Goal

Let users discover which saved places are nearby and view their personal collection geographically.

## Tasks

### Interactive Map

- [ ] Integrate Google Maps JavaScript API.
- [ ] Display geolocated saved places.
- [ ] Implement marker selection.
- [ ] Connect markers to place details.
- [ ] Implement marker clustering if needed.
- [ ] Provide loading and error states.

### Nearby Places

- [ ] Request location permission explicitly.
- [ ] Calculate distances to saved places.
- [ ] Implement radius filters: 1, 5, 10, and 25 km.
- [ ] Sort nearby results by geographic distance.
- [ ] Handle denied location permission.
- [ ] Do not require location permission for basic app functionality.

### Navigation

- [ ] Support opening a place in Google Maps.
- [ ] Provide directions link.
- [ ] Preserve compatibility with global locations.

### Quality and Release

- [ ] Perform iPhone Safari testing.
- [ ] Verify Add to Home Screen behavior.
- [ ] Test Shortcut integration end-to-end.
- [ ] Verify keyboard and touch accessibility.
- [ ] Verify responsive layouts.
- [ ] Run unit, integration, and E2E tests.
- [ ] Verify production build.
- [ ] Audit secrets and environment variables.
- [ ] Validate RLS policies.
- [ ] Configure API quotas and usage alerts.
- [ ] Configure Vercel deployment.
- [ ] Test production smoke scenarios.
- [ ] Update README and deployment documentation.

## Acceptance Criteria

- [ ] Saved places appear on a global map.
- [ ] Nearby results reflect current permitted location.
- [ ] Radius filters produce correct geographic results.
- [ ] App remains usable without geolocation.
- [ ] Users can open directions.
- [ ] PWA can be installed on an iPhone.
- [ ] A full URL-to-place workflow succeeds end-to-end.
- [ ] Core automated tests pass.
- [ ] No critical security findings remain.
- [ ] Production deployment is completed only after approval.

## Deliverable

WantToGo MVP v1.0, ready for personal use.

---

# 3. Test Scenarios

The following scenarios must be included in the test plan.

| ID | Scenario | Expected Result |
|---|---|---|
| T01 | Save a normal website URL | Source persisted |
| T02 | Save an Instagram Reel | Source persisted even if extraction fails |
| T03 | Save the same link twice | No duplicate source |
| T04 | Save two links about one restaurant | One saved place, two sources |
| T05 | Source identifies multiple establishments | Multiple candidate places |
| T06 | Two establishments share the same name | No incorrect merge |
| T07 | Google Places fails | Source remains recoverable |
| T08 | AI returns malformed JSON | Validated failure, retry or review |
| T09 | User denies location permission | App remains functional |
| T10 | User is in another country | Nearby query uses current coordinates |
| T11 | A user requests another user's source | Access denied |
| T12 | Submitted URL redirects to an internal address | Fetch blocked |
| T13 | Background job is executed twice | No duplicate records |
| T14 | Shortcut credential is revoked | Capture denied |
| T15 | External API quota is exhausted | Controlled error, no data loss |

---

# 4. Definition of Done

A milestone may only be marked completed after:

1. Every mandatory acceptance criterion is satisfied.
2. Required automated tests pass.
3. TypeScript compilation succeeds.
4. Lint checks pass.
5. Production build succeeds where applicable.
6. No critical security issue remains.
7. Relevant documentation is updated.
8. The implementation is reviewed.
9. External dependencies and configuration requirements are documented.
10. The user approves the milestone.

If a milestone is only partially implemented, retain its status as In Progress.

Do not mark tasks as completed based solely on code generation.

---

# 5. Milestone Tracking

| Milestone | Status | Priority |
|---|---|---|
| M0 — Project Foundation | Completed | P0 |
| M1 — Auth, Database and Capture | In Progress | P0 |
| M2 — iPhone Shortcut | Not Started | P0 |
| M3 — AI and Place Identification | Not Started | P1 |
| M4 — Library, Search and Deduplication | Not Started | P1 |
| M5 — Maps and Release | Not Started | P1 |

Status values:

- Not Started
- In Progress
- Blocked
- In Review
- Completed

Update this table after each milestone.

---

# 6. External Configuration Checklist

The following services must be configured when their dependent milestone begins.

- [x] GitHub repository.
- [ ] Vercel project.
- [ ] Supabase project.
- [ ] Supabase environment variables.
- [ ] Supabase Auth settings.
- [ ] Google Cloud project.
- [ ] Google Maps JavaScript API.
- [ ] Google Places API (New).
- [ ] Google Maps API key restrictions.
- [ ] AI provider credentials.
- [ ] Server-side API cost and rate limits.
- [ ] Apple Shortcut configuration.
- [ ] Production domain and redirect URLs.

Do not hardcode credentials.

Do not require all external services before Milestone 0 can begin.

---

# 7. Implementation Notes for Codex

This plan is the authoritative task sequence for the WantToGo MVP.

`AGENTS.md` defines permanent engineering rules.

`docs/PRD.md` defines product requirements.

`docs/ARCHITECTURE.md` defines architectural decisions.

Before changing the architecture or scope, explain the proposed change and request approval.

Implement one milestone at a time.

Do not automatically proceed to the next milestone after completing the current one.

At the end of each milestone, provide:

- Summary of completed functionality.
- Changed files.
- Tests executed and results.
- Known limitations.
- Configuration required.
- Outstanding tasks.
- Recommended next action.

The objective is a reliable, usable product, not merely a completed checklist.

---

# 8. Backlog

## B01 — Configure custom SMTP for Supabase Auth

**Added:** 2026-11-19 | **Status:** Backlog | **Priority:** P1

Deferred at the user's request. The built-in email provider's project-wide sending quota interrupted multi-user login testing during M1. Until this item is implemented, tests using real email must respect that quota; M1 acceptance checks remain pending where unverified.

- [ ] Select a suitable SMTP provider and confirm its costs and sending limits.
- [ ] Configure the verified sender/domain and store SMTP credentials only in Supabase's protected settings.
- [ ] Configure custom SMTP after obtaining approval for any paid service and production Auth changes.
- [ ] Verify sign-in email delivery to multiple users, the same-browser callback, and safe handling of throttled sends.
- [ ] Document the selected provider, configuration and verified limits without recording credentials.

Acceptance: multiple authorized test users receive valid sign-in links through the configured provider within its limits; email verification and existing authentication protections remain enabled.
