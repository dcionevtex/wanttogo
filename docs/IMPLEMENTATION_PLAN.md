# WantToGo — Implementation Plan

**Version:** 1.0  
**Status:** Not Started  
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
**Status:** Not Started

## Goal

Establish a maintainable codebase, development standards, documentation, and basic application structure.

## Tasks

- [ ] Initialize Next.js with App Router and TypeScript.
- [ ] Configure TypeScript strict mode.
- [ ] Install Tailwind CSS.
- [ ] Configure shadcn/ui.
- [ ] Establish project folder structure.
- [ ] Configure ESLint and formatting.
- [ ] Configure environment variable validation.
- [ ] Create `.env.example` with placeholder values.
- [ ] Create `.gitignore`.
- [ ] Configure Vitest and React Testing Library.
- [ ] Configure Playwright for future E2E testing.
- [ ] Create basic layout and application shell.
- [ ] Implement responsive navigation.
- [ ] Add PWA manifest and required icons.
- [ ] Document local development setup.
- [ ] Verify production build.

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

- [ ] Application runs locally.
- [ ] Landing page renders correctly on desktop and mobile.
- [ ] TypeScript passes without errors.
- [ ] Lint passes.
- [ ] Unit test command executes successfully.
- [ ] Production build completes.
- [ ] PWA manifest is valid.
- [ ] No secrets exist in the repository.
- [ ] README contains working setup instructions.

## Deliverable

A functional application skeleton with development tooling and documentation.

---

# Milestone 1 — Authentication, Database and URL Capture

**Priority:** P0  
**Status:** Not Started  
**Depends on:** Milestone 0

## Goal

Enable authenticated users to save URLs reliably and retrieve them in a persistent Inbox.

This milestone establishes the core product value.

## Tasks

### Authentication

- [ ] Create Supabase browser and server clients.
- [ ] Implement Supabase Auth.
- [ ] Implement login and logout.
- [ ] Protect private application routes.
- [ ] Implement authenticated API access.
- [ ] Add clear unauthorized and expired-session handling.

### Database

- [ ] Create `sources` table.
- [ ] Create `places` table.
- [ ] Create `saved_places` table.
- [ ] Create `source_places` table.
- [ ] Add necessary indexes and constraints.
- [ ] Enable RLS on user-owned tables.
- [ ] Implement ownership-aware access policies.
- [ ] Add migration tests or schema verification.
- [ ] Define delete behavior to avoid orphaned records.

### Capture API

Implement:

`POST /api/v1/captures`

Requirements:

- [ ] Validate request schema.
- [ ] Accept HTTP and HTTPS URLs.
- [ ] Reject unsafe schemes and malformed URLs.
- [ ] Normalize URLs conservatively.
- [ ] Preserve the original submitted URL.
- [ ] Implement user-scoped idempotency.
- [ ] Persist the capture transactionally.
- [ ] Record a durable processing intent.
- [ ] Return a source ID and pending status.
- [ ] Apply authentication and rate limiting.

### Manual Capture UI

- [ ] Implement URL submission form.
- [ ] Show validation errors.
- [ ] Show successful persistence confirmation.
- [ ] Prevent accidental repeated submissions.
- [ ] Support touch-friendly mobile interaction.

### Inbox UI

- [ ] Show saved sources.
- [ ] Display source domain and original URL.
- [ ] Show capture timestamp.
- [ ] Display processing state.
- [ ] Allow opening original links.
- [ ] Implement empty and loading states.
- [ ] Implement pagination.

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
| M0 — Project Foundation | Not Started | P0 |
| M1 — Auth, Database and Capture | Not Started | P0 |
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

- [ ] GitHub repository.
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
