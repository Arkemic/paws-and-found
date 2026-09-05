# Feature Status

Single source of truth for what actually works. Update it at the end of every
phase — an item is only ticked when it works in the browser, not when the file
exists.

**Legend:** `[ ]` not started · `[~]` partial · `[x]` done (frontend, on mock data)

_Last updated: Phase 11 — 2026-08-18_

## Foundation

| Item | Status | Notes |
| --- | --- | --- |
| Project scaffold (React + Vite + Tailwind) | `[x]` | Phase 0 |
| Design tokens (colour, shape, spacing, type, containers) | `[x]` | **Teal + Amber approved.** `src/index.css`, documented in `docs/design-system.md` |
| Homepage | `[x]` | Hero, 3 primary actions, recent reports, how it works, safety |
| `PetCard` + type/status badges | `[x]` | Reused by every later listing |
| UI primitives (button, inputs, card, modal) | `[x]` | `src/components/ui/` |
| Service abstraction over mock data | `[x]` | `src/services/` |
| Seed mock data | `[x]` | 24 reports across 4 statuses, 5 species, 15 cities |
| Image assets | `[x]` | All delivered and wired up, including 24 pet photographs |
| Routing & navigation | `[x]` | All 25 routes, navbar, mobile nav, footer, sidebar, breadcrumb, 404, unauthorized |
| Role-aware navigation + route guards | `[x]` | Demo role selector; guards are UI-only, not security |

## Core workflows

| Item | Status | Phase |
| --- | --- | --- |
| Authentication (simulated) | `[~]` | **Guest by default.** Reporting and all workspaces require signing in; browsing stays public. Sign-in works through the development panel on `/login`; the email/password form is inert. Real auth after backend requirements. |
| Lost report | `[x]` | 3 — multi-step form, validation, submits via `petService` |
| Found report | `[x]` | 3 — same form, found-specific fields, no pet name |
| Photo upload UI | `[~]` | 3 — local preview only; real storage waits for the backend |
| Search | `[x]` | 4 — free text across name, breed, colours, markings, description, place |
| Filters | `[x]` | 4 — type, species, size, colour, city, status, date range; chips, clear, sort, load-more |
| Pet report detail | `[x]` | 5 — photos, details, location, possible matches, privacy-safe contact |
| Flag a report for moderation | `[x]` | 5 — raises a case for the Phase 11 admin queue |
| Owner status controls | `[x]` | 5/6 — mark returned and close, from the detail page and My Reports |
| Edit a report | `[x]` | 6 — reuses the reporting wizard, prefilled; owner-only |
| Map | `[x]` | 8 — Leaflet + OpenStreetMap: Explore map view, report detail map, pin-drop in the form |
| Matching | `[x]` | 7 — explainable weighted algorithm, no AI. `src/services/matchScoring.js` |
| Verification | `[x]` | 7/10 — users request it, coordinators confirm, request more information, or rule it out |
| Notifications | `[x]` | 9 — notification centre, raised automatically by real events. No delivery (email/push) until the backend. |
| Status workflow & history | `[x]` | 9 — case timeline on the report detail page, built from appended `statusHistory` |

## Dashboards

| Item | Status | Phase |
| --- | --- | --- |
| User dashboard | `[x]` | 6 — overview with stats and activity, My Reports, Profile |
| Staff dashboard | `[x]` | 10 — overview, report queue, match queue, verification workspace |
| Admin dashboard | `[x]` | 11 — overview, user management, record oversight, pet categories |
| Moderation queue | `[x]` | 11 — dismiss, warn, remove, remove-and-suspend; the reporter is always told |

## Cross-cutting

| Item | Status | Notes |
| --- | --- | --- |
| Responsive (390 / 768 / 1366 / 1920) | `[~]` | Navigation and layouts verified; each page re-checked as it is built |
| Accessibility | `[~]` | Focus ring, skip link, labels, `aria-describedby`, breadcrumb `aria-current`, reduced motion |
| Empty / loading / error states | `[~]` | `EmptyState` and `LoadingSkeleton` built and in use; applied per page as pages are built |
| Real database | `[ ]` | **Blocked — waiting on instructor requirements** |
