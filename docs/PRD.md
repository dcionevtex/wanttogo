# WantToGo — Product Requirements

Version: 1.0 draft | Updated: 2026-11-19 | Implementation: M0 approved; M1 implemented locally, pending remote configuration and real workflow acceptance

## Product and audience

People discover places across Instagram, TikTok, X, Google Maps, blogs, and websites, but lose them across saved posts and bookmarks. WantToGo keeps original links and organizes identified locations into a private collection.

The initial user is an individual using an iPhone. The application must isolate multiple users' data from the first database release. The initial interface is English and the geographic scope is global.

## MVP requirements

| ID  | Requirement                         | Acceptance evidence                                                                                                 | Milestone |
| --- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------- | --------- |
| R01 | Save an HTTP(S) URL manually        | Authenticated submission persists before confirmation; a reload shows it in Inbox                                   | M1        |
| R02 | Capture from the iPhone Share Sheet | Apple Shortcut submits using a revocable capture-only credential; tested on a physical iPhone                       | M2        |
| R03 | Keep a persistent Inbox             | Original URL, source domain, timestamp, and processing state remain accessible after extraction failure             | M1, M3    |
| R04 | Identify places asynchronously      | Public evidence produces schema-validated candidates; ambiguous results require user review                         | M3        |
| R05 | Verify identity                     | Google Places verifies candidates where possible; unsupported addresses, coordinates, and IDs are never invented    | M3        |
| R06 | Maintain a personal collection      | Save Want to Go / Visited status and personal notes; all associated source links remain accessible                  | M4        |
| R07 | Search and filter                   | Combine name search with country, city, category, status, and source platform filters; sort by name or saved date   | M4        |
| R08 | Prevent duplicates                  | Same normalized URL per user returns an existing source; multiple links to a verified place produce one saved place | M1, M4    |
| R09 | Map saved places                    | Display locations with verified or explicitly confirmed coordinates and open external directions                    | M5        |
| R10 | Find nearby saved places            | On explicit location permission, calculate distance and filter by 1, 5, 10, or 25 km; denial leaves the app usable  | M5        |

## Main journeys

1. **Capture:** sign in, paste a URL, submit, and see confirmation only after the source and processing intent commit. Invalid input explains how to correct it. Failed saves retain the form input and allow retry.
2. **Share:** select WantToGo's Shortcut in the iPhone Share Sheet. It reports server confirmation or a clear failure, without requiring the PWA to open each time.
3. **Resolve:** open Inbox, see pending/processing status, and inspect results. A source can identify zero, one, or multiple places. Inaccessible content remains a usable bookmark.
4. **Review:** inspect ambiguous candidates, search for the correct place, and confirm one or more matches. Retries preserve user corrections. Empty evidence never silently creates a place.
5. **Revisit:** search the library, change visit status, add notes, inspect original links, or open directions. Nearby search is optional and uses the current permitted location.

## Product rules

- Capture succeeds independently of AI and Google availability. With providers absent, captures remain pending and retrievable.
- Deduplicate sources within each user only. Normalize conservatively: do not discard query parameters or alter paths without a proven platform-specific rule.
- Never merge similarly named venues or branches without a verified identity.
- Extraction is best effort. Access restrictions must not be bypassed.
- No offline save promise: a network failure must not look like a completed save. An offline screen can explain the need to reconnect.
- Never cache private pages or authenticated responses in a shared service worker cache. Define logout cleanup before adding private offline storage.
- A deleted source removes its evidence associations and jobs, but does not implicitly delete a saved place. Removing a saved place removes personal notes/status and its associations; unrelated bookmarks remain.

## Quality and acceptance

Mobile layouts must support touch, keyboard navigation, accessible labels, visible focus, and loading, empty, permission-denied, and error states. Pagination prevents unbounded Inbox and library responses.

Security acceptance includes unauthorized access rejection, two-user isolation tests, revoked Shortcut rejection, bounded external fetches, SSRF protection through redirects, and no credentials in logs or bundles. The browser Maps key is intentionally public and must be restricted; privileged credentials remain server-side.

Tests T01–T15 in the implementation plan are the baseline acceptance suite. Paid providers are mocked in automated tests; real integration checks and a physical iPhone test are separate evidence. No milestone is complete solely because code exists.

## Exclusions

No social feeds, public profiles, followers, comments, public reviews, bookings, generated itineraries, push notifications, background location tracking, native apps, multi-agent systems, monetization, bulk Instagram imports, vector database, or semantic search.

## Release measures

Record whether a committed capture is retrievable, duplicate submissions create no extra source, unresolved captures survive provider failures, and private records are inaccessible to a second user. Track extraction outcomes and provider cost without retaining unnecessary sensitive content. Numerical latency and budget targets will be set from measured integration results before release; none have been validated yet.
