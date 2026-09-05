# Page Inventory

Every route the application will have, who can reach it, and which phase builds
it. Phase 1 creates the shells for all of them; later phases fill them in.

Keep this in step with the router — if a route exists in code and not here, one
of the two is wrong.

_Last updated: Phase 1 — 2026-08-17. Every route below exists and loads._

**Status key:** `Shell` — route, layout, title and breadcrumb are in place, contents
come in the phase named. `Built` — the page is finished for now.

## Public

| Route | Page | Access | Contents from | Status |
| --- | --- | --- | --- | --- |
| `/` | Homepage | Everyone | — | Built |
| `/explore` | Explore / search results | Everyone | — | Built |
| `/report/lost` | Report a lost pet | **Signed in** | — | Built |
| `/report/found` | Report a found pet | **Signed in** | — | Built |
| `/pet/:id` | Pet report detail | Everyone | — | Built |
| `/about` | About Paws&Found | Everyone | — | Built |
| `/help` | Help & community safety | Everyone | — | Built |
| `/login` | Sign in | Everyone | Real auth after backend | Shell (does not submit) |
| `/register` | Create an account | Everyone | Real auth after backend | Shell (does not submit) |

## Customer / User

| Route | Page | Access | Contents from | Status |
| --- | --- | --- | --- | --- |
| `/dashboard` | Overview | User | — | Built |
| `/dashboard/reports` | My reports | User | — | Built |
| `/dashboard/reports/:id/edit` | Edit a report | Owner only | — | Built |
| `/dashboard/matches` | Possible matches | User | — | Built |
| `/dashboard/notifications` | Notification centre | User | — | Built |
| `/dashboard/profile` | Profile & preferences | User | — | Built |

## Staff / Pet Coordinator

| Route | Page | Access | Contents from | Status |
| --- | --- | --- | --- | --- |
| `/staff` | Staff overview | Staff | — | Built |
| `/staff/reports` | Report queue | Staff | — | Built |
| `/staff/matches` | Match queue | Staff | — | Built |
| `/staff/verification` | Verification workspace | Staff | — | Built |
| `/staff/notifications` | Notification centre | Staff | — | Built |

## Administrator

| Route | Page | Access | Contents from | Status |
| --- | --- | --- | --- | --- |
| `/admin` | Admin overview | Admin | — | Built |
| `/admin/users` | User management | Admin | — | Built |
| `/admin/reports` | Record oversight | Admin | — | Built |
| `/admin/categories` | Pet categories | Admin | — | Built |
| `/admin/moderation` | Moderation queue | Admin | — | Built |

## System

| Route | Page | Access | Contents from | Status |
| --- | --- | --- | --- | --- |
| `*` | 404 — page not found | Everyone | — | Built |
| `/unauthorized` | No access for this role | Everyone | — | Built |

## Notes

- Access is enforced in the UI only. There is no real authentication yet, and
  route guards are not a security boundary — real enforcement arrives with the
  backend (CLAUDE.md §8).
- **Visitors arrive signed out.** Browsing is public — homepage, Explore, a
  report, About and Help. Filing a report and every workspace require signing
  in; those routes redirect to `/login` and return you to where you were headed
  once you do.
- Each role reaches only its own workspace: a user cannot open `/staff`, and
  staff cannot open `/admin`. Wrong-role routes redirect to `/unauthorized`.
  Switch account with the demo role selector, or the development sign-in panel
  on `/login`.
- Every page sets its document title through `PageHeader`. A page that does not
  render a `PageHeader` will keep the previous page's title.
