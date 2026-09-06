# Feature Status

Single source of truth for what actually works. Update it at the end of every
phase — an item is only ticked when it works in the browser, not when the file
exists.

**Legend:** `[ ]` not started · `[~]` partial · `[x]` done — working in the browser
against the live PHP API and MySQL database, unless a note says otherwise.

_Last updated: sign-in and registration wired to the API — 2026-09-06_

## Foundation

| Item | Status | Notes |
| --- | --- | --- |
| Project scaffold (React + Vite + Tailwind) | `[x]` | Phase 0 |
| Design tokens (colour, shape, spacing, type, containers) | `[x]` | **Teal + Amber approved.** `src/index.css`, documented in `docs/design-system.md` |
| Homepage | `[x]` | Hero, 3 primary actions, recent reports, how it works, safety |
| `PetCard` + type/status badges | `[x]` | Reused by every later listing |
| UI primitives (button, inputs, card, modal) | `[x]` | `src/components/ui/` |
| Service abstraction | `[x]` | `src/services/` — now calls the PHP API. The boundary is why the UI did not change when the data source did. |
| Seed data | `[x]` | 32 reports across 4 statuses, 4 species and 15 cities. Generated from `src/mock/` by `scripts/gen-seed.mjs`. |
| Image assets | `[~]` | 24 pet photographs delivered. The second batch (reports 025-032) has none yet — IMG-011 in `docs/image-requirements.md`; they render the placeholder. |
| Routing & navigation | `[x]` | All 25 routes, navbar, mobile nav, footer, sidebar, breadcrumb, 404, unauthorized |
| Role-aware navigation + route guards | `[x]` | Demo role selector; guards are UI-only, not security |

## Core workflows

| Item | Status | Phase |
| --- | --- | --- |
| Authentication | `[x]` | **Real, and reachable from the interface.** The sign-in form posts to `POST /api/auth/login`; PHP sessions, `password_hash`/`password_verify`, session ID regenerated on sign-in, HttpOnly cookies. Guest by default; browsing stays public. Every seeded account uses `demo1234`. The development role selector is kept as a demonstration shortcut. |
| Registration | `[x]` | `POST /api/auth/register` — server-side validation, bcrypt hashing, duplicate email rejected by the unique index (409), and the new account is signed in on success. **The role is never read from the request**, so an account cannot register itself as staff or admin. |
| Lost report | `[x]` | 3 — multi-step form, validation, submits via `petService` |
| Found report | `[x]` | 3 — same form, found-specific fields, no pet name |
| Photo upload | `[~]` | 3 — local preview only. **Not yet persisted**; needs a PHP upload endpoint writing to `api/uploads/`. |
| Search | `[x]` | 4 — free text across name, breed, colours, markings, description, place |
| Filters | `[x]` | 4 — type, species, size, colour, city, status, date range; chips, clear, sort, load-more |
| Pet report detail | `[x]` | 5 — photos, details, location, possible matches, privacy-safe contact |
| Flag a report for moderation | `[x]` | 5 — `POST /api/moderation`. The flagger is taken from the session, so nobody can flag in someone else's name. |
| Owner status controls | `[x]` | 5/6 — mark returned and close, from the detail page and My Reports |
| Edit a report | `[x]` | 6 — reuses the reporting wizard, prefilled; owner-only |
| Map | `[x]` | 8 — Leaflet + OpenStreetMap: Explore map view, report detail map, pin-drop in the form |
| Matching | `[x]` | 7 — explainable weighted algorithm, no AI. `src/services/matchScoring.js` |
| Verification | `[x]` | 7/10 — users request it, coordinators confirm, request more information, or rule it out |
| Notifications | `[x]` | 9 — written to the `notifications` table by the same transaction as the event that caused them. No outbound delivery (email/push); in-app only. |
| Status workflow & history | `[x]` | 9 — every change appends to `status_logs`; the case timeline and the dashboard activity feed both read it. |

## Dashboards

| Item | Status | Phase |
| --- | --- | --- |
| User dashboard | `[x]` | 6 — overview with stats and activity, My Reports, Profile |
| Staff dashboard | `[x]` | 10 — overview, report queue, match queue, verification workspace |
| Admin dashboard | `[x]` | 11 — overview, user management, record oversight, pet categories |
| Moderation API | `[x]` | `GET/POST /api/moderation`, `PATCH /api/moderation/{id}`. Admin-only, verified: a customer gets 403, signed-out gets 401. |
| Moderation queue | `[x]` | 11 — dismiss, warn, remove, remove-and-suspend; the reporter is always told. Each decision is one transaction: case, report status, account status and notification move together or not at all. |

## Cross-cutting

| Item | Status | Notes |
| --- | --- | --- |
| Responsive (390 / 768 / 1366 / 1920) | `[~]` | Navigation and layouts verified; each page re-checked as it is built |
| Accessibility | `[~]` | Focus ring, skip link, labels, `aria-describedby`, breadcrumb `aria-current`, reduced motion |
| Empty / loading / error states | `[~]` | `EmptyState` and `LoadingSkeleton` built and in use; applied per page as pages are built |
| Real database | `[x]` | MySQL, 11 tables, verified on MariaDB 10.4.32 via XAMPP. `database/schema.sql`. |
| Prepared statements everywhere | `[x]` | PDO with `ATTR_EMULATE_PREPARES => false`. Injection tested with three payloads. |
| Category management | `[~]` | Admin UI works but still writes to mock data — not persisted. |
| Pagination | `[~]` | The API supports `page`/`per_page`; the frontend still uses "Show more". |
| Charts on dashboards | `[ ]` | Required by the project guide. Not started. |
| Deployment | `[ ]` | Local XAMPP only — team decision, 2026-08-19. |
