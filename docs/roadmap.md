# Paws&Found — Development Roadmap

Read [../CLAUDE.md](../CLAUDE.md) first. Read only the phase you have been asked to
implement. **Do not begin a later phase automatically.**

Development is frontend-first and deliberately decoupled from the database, because
the instructor may still change the backend requirements. All data access goes
through the service layer described in CLAUDE.md §9.

```text
PHASE 0   Project foundation
PHASE 1   Navigation / routing
          ↓ DESIGN CHECKPOINT ↓
PHASE 2   Homepage
          ↓ DESIGN CHECKPOINT ↓
PHASE 3   Lost/found forms
          ↓ DESIGN CHECKPOINT ↓
PHASE 4   Search / explore
PHASE 5   Pet detail
          ↓ DESIGN CHECKPOINT ↓
PHASE 6   User dashboard
PHASE 7   Smart matching
PHASE 8   Maps
PHASE 9   Notifications / status
PHASE 10  Staff workspace
PHASE 11  Admin workspace
PHASE 12  QA / polish
──────────────────────────────────
DATABASE / SUPABASE INTEGRATION — wait for instructor instructions
```

---

## PHASE 0 — Project Foundation & Development Rules

**Goal:** establish architecture and rules before any screens exist.

### Structure to create

```text
/
├── src/
│   ├── components/
│   ├── pages/
│   ├── layouts/
│   ├── features/
│   ├── services/
│   ├── mock/
│   ├── hooks/
│   ├── utils/
│   ├── constants/
│   ├── types/
│   └── assets/
├── public/
├── docs/
│   ├── page-inventory.md
│   ├── image-requirements.md
│   ├── feature-status.md
│   ├── mock-data-guide.md
│   ├── ui-inventory.md
│   └── roadmap.md
└── CLAUDE.md
```

### Setup

React, Vite, JavaScript, Tailwind CSS, React Router, Lucide icons. Leaflet
dependencies may be installed, but mapping is **not** implemented in this phase.

### Service interfaces

Create `petService`, `userService`, `matchService`, `notificationService`,
`moderationService` — reading from `src/mock/` only.

### `docs/feature-status.md`

```text
FEATURE STATUS
[ ] Authentication      [ ] Matching
[ ] Lost Report         [ ] Verification
[ ] Found Report        [ ] Notifications
[ ] Search              [ ] User Dashboard
[ ] Filters             [ ] Staff Dashboard
[ ] Map                 [ ] Admin Dashboard
```

### Do not design heavily yet

Establish only: spacing system, typography scale, container sizes, responsive
breakpoints, basic buttons, inputs, cards, modal/dialog structure — all with
**neutral placeholder styling**. Final aesthetic is directed by the team later.

---

## PHASE 1 — Site Structure, Navigation & Routing

**Goal:** the whole skeleton, so everyone knows where things live. Implement the
routes; do not deeply design the pages.

**Public:** `/` `/explore` `/report/lost` `/report/found` `/pet/:id` `/about`
`/help` `/login` `/register`

**User:** `/dashboard` `/dashboard/reports` `/dashboard/matches`
`/dashboard/notifications` `/dashboard/profile`

**Staff:** `/staff` `/staff/reports` `/staff/matches` `/staff/verification`

**Admin:** `/admin` `/admin/users` `/admin/reports` `/admin/categories`
`/admin/moderation`

**Build:** top nav, desktop nav, mobile nav, footer, role-aware navigation
placeholders, breadcrumb, page shells, loading state, empty state, 404,
unauthorized page.

**Temporary role switching** — a dev-only "Demo Role Selector" (Customer / Staff /
Administrator). Real auth determines role later.

**Acceptance:** every route loads, is responsive, shares a consistent layout,
produces no console errors, supports mobile navigation, and sets a page title.

---

## PHASE 2 — Homepage & Public Discovery

**Design together before full implementation.**

Candidate composition (to be approved first): Hero → Lost/Found CTA → Recently
Reported Pets → How It Works → Map Preview → Reunion/success section → Community
safety & help → Footer.

Primary actions must be immediately obvious: **REPORT A LOST PET**, **I FOUND A
PET**, **SEARCH PETS**.

Report cards eventually show photo, Lost/Found status, pet name if known, species,
breed, general location, date, report status — without becoming overloaded.

**Implement:** mock report cards, report-type indicators, responsive card grid,
clickable detail links, empty/loading states, one reusable `PetCard`.

---

## PHASE 3 — Lost & Found Reporting Workflow

Both flows fully functional in the frontend, sharing components with fields adapted
per report type.

**Lost report** — type auto-set to LOST. Pet info: name, species, breed, sex, size,
primary color, secondary color, distinctive markings. Incident: date lost,
approximate time, last-seen location, description. Photos: upload placeholder,
preview, remove, choose primary. Contact preferences: allow platform contact,
display phone?, display email? (privacy behavior finalized later).

**Found report** — same shape, different wording: date found, location found,
temporary condition/status, collar?, distinctive markings, description.
**Do not require a pet name.**

**Flow:** Pet Details → Location & Date → Photos → Review → Submit

**Validation:** required fields, valid date, sensible character limits, at least one
useful characteristic, file type/size placeholders, required location.

**Submission:** `petService.createReport()` → success screen → route to
`/dashboard/reports`.

---

## PHASE 4 — Search, Filtering & Explore

**Filters:** report type (Lost/Found), species (Dog/Cat/Bird/Other), breed, primary
color, size, location, date range, status.

**Sorting:** newest, oldest, nearest, potential match score (later).

Filters update results without a full page reload.

**Desktop:** filter sidebar + results. **Mobile:** filter button → bottom
sheet/drawer.

**Implement:** search bar, filters, clear filters, active filter chips, result
counter, sorting, pagination or load-more, no-result state, skeleton loading.

**Mock dataset:** 20–30 realistic demo reports — dogs, cats, birds, several
Philippine locations, both report types, mixed statuses. No real private
individuals.

---

## PHASE 5 — Pet Report Detail Page

Route `/pet/:id`. The central case-information page.

**Contains:** primary photo, LOST/FOUND badge, pet information (breed, color, size,
sex, distinctive characteristics), incident information (date, approximate
location), map, report status, reporter information with privacy-safe contact
controls, possible matches, report/flag button.

**Privacy:** do not expose unnecessarily precise personal information. Claimant
verification details stay private.

**Actions by role** — any user: Save, Share, Suggest Match, Contact, Report.
Report owner: Edit, Update Status, Close Report. Staff: Review, Flag, Verify Match.

---

## PHASE 6 — User Account & Dashboard

Authentication remains simulated.

**Overview:** my active reports, possible matches, notifications, recovered pets.

**My Reports:** active list, lost/found indicators, status, edit, archive, view
matches.

**Profile:** full name, avatar, contact information, preferred location,
notification preferences — not connected to production storage.

**Build:** desktop sidebar, responsive mobile dashboard, statistics cards, activity
history, empty states, mock notifications, mock reports.

---

## PHASE 7 — Smart Matching System UI & Mock Logic

No AI. A transparent, configurable score — starting weights (revisable):

| Signal | Weight |
| --- | --- |
| Species match | 25 |
| Location proximity | 20 |
| Breed match | 15 |
| Color similarity | 15 |
| Size match | 10 |
| Date proximity | 10 |
| Other characteristics | 5 |

Example presentation:

```text
Possible Match — 87%
Lost:  Milo, brown Shih Tzu, Makati, August 10
Found: Brown Shih Tzu, Makati, August 11
Matched: ✓ Breed  ✓ Color  ✓ Size  ✓ Location
```

**Never** say "this is your pet" — only "Possible Match".

**Implement:** comparison card, match percentage, matched and unmatched attributes,
links to both reports, request verification, reject/dismiss suggestion, save
suggestion.

---

## PHASE 8 — Map & Location Experience

Leaflet + OpenStreetMap.

**Explore map:** lost and found cases with distinct marker treatments; zoom, pan,
marker popup, click through to report, report-type indicator, search area, optional
radius filter.

**Report form:** search address or drop a pin. Show approximate public positions
rather than exact residences.

**View toggle:** LIST | MAP (or split view).

**Handle:** missing coordinates, map load errors, mobile map height, marker
clustering if needed later.

---

## PHASE 9 — Notifications & Report Status Workflow

**Statuses:** Active, Possible Match, Returned, Closed. Keep extensible.

**Notification triggers:** possible match discovered, staff reviewed report, match
verification requested, match accepted, report marked returned, report
rejected/flagged, report updated.

**Notification center:** unread/read, timestamp, type icon, linked report, mark as
read, mark all read.

**Report history timeline** (prepares for future `status_logs`):

```text
Aug 10  Report created
Aug 11  Possible match identified
Aug 11  Pet Coordinator reviewed match
Aug 12  Pet returned
```

---

## PHASE 10 — Staff / Pet Coordinator Workspace

**Dashboard:** pending reports, possible matches, verification requests, recently
updated cases, returned pets.

**Report queue filters:** New, Pending Review, Possible Match, Verification,
Returned, Closed.

**Verification workspace:** side-by-side Lost | Found showing photos,
characteristics, location, date, match score, submitted proof/notes.

**Actions:** Confirm Possible Match, Request More Information, Reject Match, Update
Status, Contact Users.

Staff must not have full system administration powers.

---

## PHASE 11 — Administrator Workspace

**Dashboard:** users, active reports, reported posts, categories, recently closed
cases.

**User management:** list, role display, status, search, filter, account status
action.

**Pet categories:** Dog, Cat, Bird, Rabbit, Other. Breed management later if
required.

**Moderation queue** — flag reasons: false report, spam, harassment, inappropriate
content, scam, duplicate, other. Actions: Dismiss, Warn User, Remove Report,
Suspend User. All mocked.

---

## PHASE 12 — Final Frontend Integration, QA & Polish

Only after every workflow exists.

**Functional testing:** guest browsing, mock register/login, submit lost report,
submit found report, search and filter, view pet, possible match, match
verification, user dashboard, staff dashboard, admin dashboard, notifications,
status changes.

**Responsive testing:** 1920, 1366, 768, 390.

**Accessibility:** keyboard navigation, labels, form errors, alt text, focus states,
button names, heading order, contrast.

**Cleanup:** remove unused imports, clear console errors, remove duplicate
components, extract repeated UI, verify routing, verify no secrets, check mobile
overflow, run lint, document known limitations.
