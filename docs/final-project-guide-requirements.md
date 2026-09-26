# Final Project Requirements — ITS122P – AM2

Transcribed from the instructor's *Final Project Guide* (8 pages), received
2026-08-19. This is the checklist the project is graded against. Where a row is
already satisfied, the evidence is named.

**The Requirement column is the instructor's wording and is never edited.** Only
Status and Where are ours. Row 4 says *MySQL database*, not "a relational
database", and that is why `docs/deployment-architecture-audit.md` treats the
engine as fixed rather than as a team preference.

Statuses reconciled against the running system on **26 September 2026**. Eleven
rows still said "Not started" or "Partly done" for work that had been finished
weeks earlier.

Topic: **Campus Lost-and-Found System** — assigned to this group as Paws&Found.

## Mandatory

| # | Requirement | Status | Where |
| --- | --- | --- | --- |
| 1 | Responsive web application | **Done** | Verified at 390 / 768 / 1366 / 1920 across all routes |
| 2 | Login / logout | **Done** | Real PHP sessions. `api/auth.php`; bcrypt, CSRF, three-attempt lock, administrator unlock |
| 3 | Minimum 3 user roles | **Done** | Customer/User, Staff/Pet Coordinator, Administrator |
| 4 | MySQL database | **Done** | MariaDB 10.4.32 via XAMPP. `database/schema.sql`, four migrations, `database/seed.sql` |
| 5 | Minimum 8 related tables | **Done** | 15 tables, 23 foreign keys, counted from `information_schema`. Fourteen are on the ERD; the fifteenth, `schema_migrations`, is infrastructure. |
| 6 | CRUD operations | **Done** | Reports, users, categories, matches, moderation — all SQL behind the REST API |
| 7 | Server-side processing (PHP) | **Done** | `api/index.php` front controller; sessions, authentication, per-request authorisation |
| 8 | JavaScript interaction | **Done** | React 19 + Vite, client-side routing, dynamic content |
| 9 | REST API | **Done** | `/api/auth`, `/reports`, `/matches`, `/notifications`, `/users`, `/categories`, `/moderation` |
| 10 | API consumption | **Partly done** | Leaflet + OpenStreetMap tiles (maps/location API) |
| 11 | Search / filter | **Done** | Explore: text, type, species, size, colour, city, status, date |
| 12 | Sort | **Done** | Explore sort; staff queue sorts on six columns |
| 13 | Pagination | **Done** | `LIMIT`/`OFFSET` in SQL, nine per page, numbered links and a range status |
| 14 | Dashboard | **Done** | Customer, staff and admin dashboards |
| 15 | Reports | **Done** | `GET /api/reports/stats` — three SQL `GROUP BY` queries behind charts on the staff and administrator dashboards |
| 16 | Form validation | **Done** | Report wizard, per-step, with error messages |
| 17 | Security implementation | **Done** | bcrypt, PDO prepared statements with emulation off, server-side validation, CSRF, audit log. 151 cases in `npm run audit` |
| 18 | Error handling | **Done** | Loading, error and empty states on every async view; 401/403/404/409/422 from the API, with no SQL or paths in any response |
| 19 | Deployment | **Ready; hosting pending** | Runs from Apache at `http://localhost/pawsandfound/`, one origin for site and API. Host-agnostic: `npm run build:deploy` + `api/config.local.php`. The eighteen-step runbook is `docs/deployment-plan.md` §3. **Not yet on a public URL.** |
| 20 | Technical documentation | **Done** | `docs/` — ERD defence, database cheat sheet, role permissions, matching explanation, deployment plan, presentation defence, design system, feature status |

## Security checklist (guide page 3)

- [ ] Password hashing
- [ ] Role-based access **on the server** (the current guard is UI-only)
- [ ] Input validation server-side
- [ ] Prepared statements
- [ ] SQL-injection protection
- [ ] Basic XSS protection
- [ ] Session management

## Deliverable phases (guide pages 5–6)

| Phase | Contents | Status |
| --- | --- | --- |
| 1 — Proposal | Title, problem, users, features, roles, architecture, initial ERD, stack | Submitted |
| 2 — Database + Backend | Database, tables, relationships, CRUD, authentication, basic backend | **Next** |
| 3 — Frontend + API | Responsive UI, JavaScript, API, AJAX/Fetch, validation, search/filter | UI largely built; API pending |
| 4 — Security + Testing | Injection, auth, authorization, XSS, functional and usability testing | Not started |
| 5 — Final Presentation | 15–20 minute demonstration, presented as if to a real client | Not started |

## Other graded items

- **AI Usage Log** — `docs/ai-usage-log.md`. Columns: Date, AI Tool, Prompt,
  AI Output, What Student Changed, Reason. Keep it current.
- **Individual responsibilities** — assigned per member; every member must be
  able to explain the entire system.

## Bonus / advanced (optional)

Email notification · QR code · **Maps (already done)** · real-time notification ·
file upload · PDF report generation · PWA features · **accessibility features
(largely done)** · AI-powered feature.

Note: the guide lists an "AI-powered feature" as bonus only. Our matching engine
is deliberately **not** AI — it is an explainable weighted comparison
(`CLAUDE.md` §16), which is a defensible design choice rather than a gap.
