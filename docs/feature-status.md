# Feature Status

Single source of truth for what actually works. Update it at the end of every
phase — an item is only ticked when it works in the browser, not when the file
exists.

**Legend:** `[ ]` not started · `[~]` partial · `[x]` done — working in the browser
against the live PHP API and MySQL database, unless a note says otherwise.

_Last updated: accessibility audited with axe-core; failure states swept — 2026-09-10_

## Foundation

| Item | Status | Notes |
| --- | --- | --- |
| Project scaffold (React + Vite + Tailwind) | `[x]` | Phase 0 |
| Design tokens (colour, shape, spacing, type, containers) | `[x]` | **Teal + Amber approved.** `src/index.css`, documented in `docs/design-system.md` |
| Homepage | `[x]` | Hero, 3 primary actions, recent reports, how it works, safety |
| `PetCard` + type/status badges | `[x]` | Reused by every later listing |
| UI primitives (button, inputs, card, modal) | `[x]` | `src/components/ui/` |
| Service abstraction | `[x]` | `src/services/` — now calls the PHP API. The boundary is why the UI did not change when the data source did. |
| Seed data | `[x]` | 32 reports across 4 statuses, 4 species, 15 cities and **six months** (April–September: 3, 3, 4, 6, 9, 7). Generated from `src/mock/` by `scripts/gen-seed.mjs`. Matched pairs were shifted by identical offsets, so every seeded match score is unchanged — verified against the algorithm afterwards. |
| Image assets | `[x]` | Every seeded report carries a photograph (33 images across 32 reports). Reports 025 and 026 are the same dog from either side, so the 100% pairing demonstrates convincingly. Help header band (IMG-012) in place. |
| Routing & navigation | `[x]` | All 25 routes, navbar, mobile nav, footer, sidebar, breadcrumb, 404, unauthorized |
| Role-aware navigation + route guards | `[x]` | Route guards keep the interface coherent; they are not security — every endpoint checks the session again. The demo role selector is **development only** and is removed from production builds along with the demo password (see below). |

## Core workflows

| Item | Status | Phase |
| --- | --- | --- |
| Authentication | `[x]` | **Real, and reachable from the interface.** The sign-in form posts to `POST /api/auth/login`; PHP sessions, `password_hash`/`password_verify`, session ID regenerated on sign-in, HttpOnly cookies. Guest by default; browsing stays public. Every seeded account uses `demo1234`. The development role selector is kept as a demonstration shortcut. |
| Demo sign-in removed from builds | `[x]` | The role selector and the one-click "Development sign-in" panel are behind `import.meta.env.DEV`, so a production build contains neither them nor the demo password. Verified by searching the built bundle: `demo1234` no longer appears. Signing out is a separate action and works in both builds. |
| Registration | `[x]` | `POST /api/auth/register` — server-side validation, bcrypt hashing, duplicate email rejected by the unique index (409), and the new account is signed in on success. **The role is never read from the request**, so an account cannot register itself as staff or admin. |
| Profile | `[x]` | `PATCH /api/users/me` — name, email, phone, preferred location and the three notification preferences. The account comes from the session, so it can only ever edit your own; `role` and `account_status` are not readable there, so an account cannot promote or un-suspend itself. |
| Lost report | `[x]` | 3 — multi-step form, validation, submits via `petService` |
| Found report | `[x]` | 3 — same form, found-specific fields, no pet name |
| Photo upload | `[x]` | 3 — `POST /api/reports/{id}/photos`, multipart. Owner only. Validated by what the file *is* (`getimagesize`), not by its name or the type the browser claims; a PHP script renamed `.jpg` is refused. Stored under a generated name in `api/uploads/`, which is configured never to execute anything. |
| Search | `[x]` | 4 — free text across name, breed, colours, markings, description, place |
| Filters | `[x]` | 4 — type, species, size, colour, city, status, date range; chips, clear, sort, load-more |
| Pet report detail | `[x]` | 5 — photos, details, location, possible matches, privacy-safe contact |
| Flag a report for moderation | `[x]` | 5 — `POST /api/moderation`. The flagger is taken from the session, so nobody can flag in someone else's name. |
| Owner status controls | `[x]` | 5/6 — mark returned and close, from the detail page and My Reports |
| Edit a report | `[x]` | 6 — reuses the reporting wizard, prefilled; owner-only |
| Map | `[x]` | 8 — Leaflet + OpenStreetMap: Explore map view, report detail map, pin-drop in the form |
| Matching | `[x]` | 7 — explainable weighted algorithm, no AI. **Now runs on the server** in `api/matching.php` whenever a report is filed, so a newly filed report gets suggestions like any other. Creating a pairing writes its seven signals, notifies both reporters, and moves both reports to Possible Match, in one transaction. Verified to reproduce all four seeded pairings exactly. |
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

## Audit

`npm run audit` runs every documented test case against the running system and
prints a table per category. It restores the demonstration data afterwards, so
it can be run again at any time.

`npm run a11y` runs axe-core over all 25 pages in every role.

| Category | Cases | Passing |
| --- | --- | --- |
| A. Input validation | 19 | 19 |
| B. SQL injection | 13 | 13 |
| C. Authentication | 13 | 13 |
| D. Authorization | 31 | 31 |
| E. Cross-site scripting | 4 | 4 |
| F. File upload | 7 | 7 |
| G. Functional | 24 | 24 |
| H. Error handling | 6 | 6 |
| **Total** | **117** | **117** |

Last run 2026-09-10 against the deployed build.

## Cross-cutting

| Item | Status | Notes |
| --- | --- | --- |
| Responsive (390 / 768 / 1366 / 1920) | `[x]` | Eight representative pages measured at all four widths against the deployed build — homepage, Explore, report detail, report form, customer dashboard, coordinator comparison, admin dashboard and admin table. No horizontal overflow anywhere. Explore overflowed by 16px at 390px until the results controls were allowed to wrap. |
| Accessibility | `[x]` | Focus ring, skip link, labels, `aria-describedby`, breadcrumb `aria-current`, reduced motion — and now **audited with axe-core** across all 25 pages in every role: zero violations. Run `npm run a11y`. Four rules had been failing: colour contrast in five places, an invalid `dl`, and headings skipping a level. |
| Empty / loading / error states | `[x]` | Swept by forcing each state: a new account for empty lists, a search matching nothing, aborted and 500 responses for errors, delayed responses for loading. Two faults found and fixed — a slow first load showed a blank page, and the report page called every failure "this report does not exist". |
| Real database | `[x]` | MySQL, 11 tables, verified on MariaDB 10.4.32 via XAMPP. `database/schema.sql`. |
| Prepared statements everywhere | `[x]` | PDO with `ATTR_EMULATE_PREPARES => false`. Injection tested with three payloads. |
| Category management | `[x]` | `GET/POST /api/categories`, `PATCH/DELETE /api/categories/{code}`. Administrator only. Report counts come from SQL; deleting is refused while any report uses the category, and retiring it is offered instead. Verified to survive a reload. |
| Pagination | `[x]` | Explore pages through the database with `LIMIT`/`OFFSET`, nine to a page — one request per page, not a full list sliced in the browser. Numbered links, a "Showing 10–18 of 32" status, and the page resets when a filter or the sort changes. **The map view is deliberately not paged**: it asks for one large page so every pin is drawn, capped at the API's 50-row maximum. |
| Charts on dashboards | `[x]` | `GET /api/reports/stats` — three SQL `GROUP BY` queries behind a staff/admin-only endpoint. The administrator overview shows reports filed per month (lost vs found, six months), where reports stand, and most-reported animals; the coordinator overview shares the same breakdown component. No charting library. **The seed clusters 28 of 32 reports in August**, so the monthly chart is honest but lopsided until the dates are spread. |
| Deployment | `[x]` | The build deploys to `htdocs/pawsandfound/` and runs from Apache alone — no dev server, no proxy, one origin for the site and the API. Deep links and refreshes work via `public/.htaccess`. Still a local XAMPP deployment; no public hosting, which remains the team decision of 2026-08-19. |
