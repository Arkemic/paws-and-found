# Paws&Found

Web-Based Community System for Lost and Found Pets — an academic project for
Web Systems and Technologies 2.

Community members report lost and found pets, search structured listings, review
possible matches, and coordinate verification with a Pet Coordinator until the
pet is reunited with its owner.

## Status

**The application runs on a real MySQL database through a PHP REST API we
wrote.** All twelve frontend phases are complete, a full visual redesign pass
followed, and the mock data layer has been replaced with live data.

**The whole community-member journey works end to end.** Browse or search 32
reports, open a report's full case page, file a lost or found report, then track
it from your dashboard — edit it, mark it returned, close it, manage your
profile, and flag a listing for moderation.

**Matching works and explains itself.** Lost and found reports are compared
attribute by attribute and scored, and every point in a score is shown back to
the user. There is no AI in it — species, location, breed, colour, size, date
and distinguishing features, with species and location acting as gates.

**The case workflow closes the loop.** A possible match can be sent for
verification; confirming it marks both reports returned, records the change on
each report's timeline, and notifies both people — in one database transaction.

**Both staff workspaces are live.** Pet Coordinators get verification requests,
a report queue, a match queue and a side-by-side comparison view.
Administrators get accounts and roles, record oversight, pet category
management, and a moderation queue with the four approved decisions.

**Maps work.** Explore has a list/map toggle, each report shows its approximate
area, and reporters can drop a pin when filing. Leaflet + OpenStreetMap.

Still on mock data: category management and photo upload. See
[`docs/feature-status.md`](docs/feature-status.md) for the current picture.

## Getting started

You need **XAMPP** (Apache + MySQL + PHP 8.2) and **Node.js 20+**.

### 1. Database

Start Apache and MySQL from the XAMPP Control Panel, then create and fill the
database:

```bash
mysql -u root -P 3307 -h 127.0.0.1 -e "CREATE DATABASE IF NOT EXISTS pawsandfound"
```

```bash
mysql -u root -P 3307 -h 127.0.0.1 pawsandfound -e "source database/schema.sql"
```

```bash
mysql -u root -P 3307 -h 127.0.0.1 pawsandfound -e "source database/seed.sql"
```

> **Check your MySQL port first.** The machine this was built on runs XAMPP's
> MariaDB on **3307**, because a separate MySQL 8.0 Windows service already held
> 3306. Most XAMPP installations use the default **3306** — if yours does, drop
> the `-P 3307` from the commands above and change `DB_PORT` in
> [`api/config.php`](api/config.php) to `3306`. The XAMPP Control Panel shows the
> port next to MySQL when it is running.
>
> `mysql` returns exit code 0 even when a statement fails, so read the output
> rather than trusting the exit code.

### 2. API

Put the project where Apache can serve it — typically `C:\xampp\htdocs\` — so
that `http://localhost/PawsAndFound/api/` responds. Visiting it should return a
short JSON index listing the endpoints.

### 3. Frontend

```bash
npm install
```

```bash
npm run dev
```

Open `http://localhost:5173`. Vite proxies `/api` to Apache, so both servers
must be running.

### Signing in

Every seeded account uses the password **`demo1234`**.

| Role | Email |
| --- | --- |
| Customer/User | `maria.santos@example.com` |
| Pet Coordinator | `patricia.lim@example.com` |
| Administrator | `grace.bautista@example.com` |

The demo role selector in the navigation bar switches between them quickly.

| Script | Does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | ESLint over the project |

## Stack

React 19 · Vite 8 · JavaScript · Tailwind CSS 4 · React Router 7 · Lucide icons ·
Leaflet + OpenStreetMap

## How the code is organised

```
src/
├── components/ui/   Reusable presentational primitives
├── pages/           One component per route, grouped by area
├── layouts/         RootLayout (nav + footer), WorkspaceLayout (sidebar)
├── services/        THE DATA BOUNDARY — all reads and writes go through here
├── mock/            The source the database seed is generated from
├── hooks/           Shared React hooks
├── utils/           Small helpers
├── constants/       Roles, statuses, species, moderation reasons
└── assets/          Hero, logo, empty-state and placeholder images

api/                 The PHP REST API — flat files, no framework
├── index.php        Front controller; dispatches on the first path segment
├── config.php       Database, allowed origins, page sizes
├── db.php           One PDO connection
├── helpers.php      JSON responses, sessions, require_login / require_role
└── auth · reports · matches · users · notifications · categories · moderation

database/
├── schema.sql       11 tables, keys and constraints
└── seed.sql         Generated — do not hand-edit

scripts/gen-seed.mjs  Turns src/mock/ into database/seed.sql
```

The structure does not grow beyond this without team approval. See CLAUDE.md §15.

## Important constraints

All data access goes through `src/services/` — that boundary is the reason
swapping mock data for the real API did not require rewriting the UI.
**Components must never import from `src/mock/` directly.**

`src/mock/` is no longer what the app reads. It is now the *source the seed is
generated from*: `node scripts/gen-seed.mjs` turns it into
`database/seed.sql`. Change the mock, regenerate, re-import.

Every SQL statement in `api/` uses a **prepared statement** with bound
parameters, and PDO runs with `ATTR_EMULATE_PREPARES => false` so MySQL itself
does the binding. A consequence worth knowing: each named placeholder may appear
only **once** per statement — reusing `:q` across several columns fails with
`HY093 Invalid parameter number`. Give them distinct names rather than
re-enabling emulation, which would weaken the guarantee.

The visual identity is **Teal + Amber**, defined once as semantic tokens in
`src/index.css` and documented in [`docs/design-system.md`](docs/design-system.md).
Components must use those tokens — never raw Tailwind colours like
`bg-teal-600` — so the whole app can be recoloured from one file.

Full rules for contributors and for AI assistance are in
[`CLAUDE.md`](CLAUDE.md). Read it before making changes.

## Documentation

| File | Contents |
| --- | --- |
| [`CLAUDE.md`](CLAUDE.md) | Master project context and development rules |
| [`docs/roadmap.md`](docs/roadmap.md) | The 12 development phases |
| [`docs/feature-status.md`](docs/feature-status.md) | What is actually built |
| [`docs/page-inventory.md`](docs/page-inventory.md) | Every route and who can reach it |
| [`docs/design-system.md`](docs/design-system.md) | Approved palette, shape tokens, accessibility rules |
| [`docs/ui-inventory.md`](docs/ui-inventory.md) | Reusable components — check before creating one |
| [`docs/mock-data-guide.md`](docs/mock-data-guide.md) | How the temporary data layer works |
| [`docs/image-requirements.md`](docs/image-requirements.md) | Visual assets still needed |
| [`docs/img-005-pet-photos.md`](docs/img-005-pet-photos.md) | Shot list for the 24 demo pet photos |

## Demo data

All seeded people, pets and incidents are fictional. Emails use `example.com`
and phone numbers use an invented block. Locations are real Philippine
barangays, but coordinates are barangay-level approximations and do not point at
any residence.
