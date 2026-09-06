# Mock Data Guide

How the temporary data layer works, and the rules for adding to it.

_Last updated: Phase 11 — 2026-08-18_

## Why it exists

The production database is deliberately not built yet — the instructor may still
change the requirements (CLAUDE.md §8). So the frontend is developed against
mock data behind a service abstraction:

```
components / pages
        ↓  (only ever this direction)
src/services/*        ← the stable boundary
        ↓
src/services/mockDb   ← temporary; deleted when the backend arrives
        ↓
src/mock/*            ← seed data
```

**The one rule that makes this work:** nothing outside `src/services/` may
import from `src/mock/` or from `mockDb`. If a component imports mock data
directly, moving it to the API means rewriting that component.

## Using a service

```jsx
import { useCallback } from 'react'
import { useAsync } from '@/hooks/useAsync'
import { petService } from '@/services'

function RecentReports() {
  const load = useCallback(() => petService.getRecentReports(6), [])
  const { data: reports, error, isLoading } = useAsync(load)

  if (isLoading) return <LoadingSkeleton />
  if (error) return <p role="alert">{error.message}</p>
  if (reports.length === 0) return <EmptyState … />

  return reports.map((report) => <PetCard key={report.id} report={report} />)
}
```

Every service method is `async` even though the data is local. That is the only
reason for the `async` keyword: it means the call sites do not change when the
bodies become real network calls.

## Behaviour to know about

- **Treat anything a service returns as read-only.** Services hand back the
  stored objects directly, so assigning to one edits the mock database. Change
  data by calling a service method.
- **`userService.getCurrentUser()` returns `null` when signed out**, which is
  how a visitor arrives. Anything that decides "is this my report?" must handle
  null, or owner-only controls appear for people who are not signed in.
- **State is module-scoped.** Changes survive navigation and reset on a full
  page reload — a demo always starts from the same seed. `resetMockDb()` forces
  a reset.
- **Missing records throw `NotFoundError`** with `error.code === 'NOT_FOUND'`,
  so callers can distinguish "no such report" from a real failure.
- **Status history is appended, never replaced.** `updateReportStatus()` pushes
  onto `statusHistory`; `updateReport()` refuses to touch it. The case timeline
  on a report page is rendered straight from it.
- **A coordinator's decision is the only thing that closes a pairing.**
  Confirming marks both reports returned; ruling one out leaves both active so
  the search continues. Either way both reporters are told.
- **Notifications are raised by the services, not by pages.** Changing a
  report's status notifies its reporter when somebody else made the change;
  requesting verification notifies the other side of the pairing **and every
  active Pet Coordinator**; a moderation decision always tells the person who
  filed the report. Nobody is ever notified about something they did themselves.

## Data shapes

There is no database schema yet, so this is the reference for what each record
looks like. It describes the mock data only and is **not** a schema.

**Pet report** — `id`, `reportType` (`lost` | `found`), `status`, `petName`
(always `null` on a found report), `species`, `breed`, `sex`, `size`,
`primaryColor`, `secondaryColor`, `distinctiveMarkings`, `description`,
`incidentDate`, `incidentTime`, `location`, `condition` and `hasCollar` (found
reports only), `photos`, `reporterId`, `contactPreferences`, `statusHistory`,
`createdAt`, `updatedAt`.

- `location` — `label`, `city`, `province`, `lat`, `lng`, `precision`
  (`approximate` | `exact`)
- `photos[]` — `id`, `url`, `alt`, `isPrimary`
- `contactPreferences` — `allowPlatformContact`, `showPhone`, `showEmail`
- `statusHistory[]` — `id`, `status`, `note`, `actorId`, `createdAt`

**User** — `id`, `fullName`, `email`, `phone`, `role` (`user` | `staff` |
`admin`), `accountStatus` (`active` | `suspended`), `avatarUrl`,
`preferredLocation`, `notificationPreferences`, `createdAt`.

**Match suggestion** — `id`, `lostReportId`, `foundReportId`, `score`, `status`,
`signals[]` (`key`, `label`, `matched`, `weight`, `detail`), `reviewedByStaffId`,
`staffNotes` (internal, never public), `createdAt`, `updatedAt`.

**Notification** — `id`, `userId`, `type`, `title`, `body`, `reportId`,
`matchId`, `isRead`, `createdAt`.

**Moderation case** — `id`, `reportId`, `reportedByUserId`, `reason`, `details`,
`status` (`open` | `dismissed` | `actioned`), `resolvedByAdminId`,
`resolutionNote`, `createdAt`.

The allowed values for every code field live in `src/constants/index.js`.

## Available services

| Service | Covers |
| --- | --- |
| `petService` | Lost/found reports: list, get, create, update, change status |
| `userService` | Users, profile updates, admin role/status actions, the simulated session |
| `matchService` | Match suggestions and the matching algorithm: list, get by report/user, generate suggestions, request verification, confirm, reject, request more information |
| `notificationService` | List, unread count, mark read, create |
| `moderationService` | Flags against reports; the four administrator decisions (dismiss, warn, remove, suspend) |
| `categoryService` | Pet categories: list, usage counts, add, rename, activate, delete-if-unused |

## Rules for adding demo data

Realistic, clearly fictional, and varied (CLAUDE.md §19).

**Never** use `Test User`, `Pet 1`, `Sample Dog`, or lorem ipsum.

- Realistic pet names and believable Philippine locations (barangay + city +
  province).
- Descriptions that read like a real person wrote them under stress.
- Plausible dates relative to the demo date, in ISO format.
- Emails on `example.com`; phone numbers in the invented `+63 917 010 01xx`
  block. No real people.
- Coordinates are barangay-level and marked `precision: 'approximate'` — never
  point at a real residence.

### Spread to maintain

The set is 24 reports. When adding more, keep:

- both report types, with more lost than found;
- dogs and cats dominant, with a few birds/rabbits/other;
- several cities across Luzon, Visayas and Mindanao — not all Metro Manila;
- all four statuses represented, including at least one `returned` and one
  `closed`;
- at least two lost/found pairs that genuinely could be the same animal, so the
  matching demo has something to find.

### Photos

Every seeded report carries a real photograph from `src/assets/`, with alt text
that describes what is actually in it. The shot list is
`docs/img-005-pet-photos.md`.

`report-009` is the exception and has no photo at all — it is the scam report,
and "no photo, no distinguishing details" is part of why it was flagged.
Components still handle a missing photo, because a report filed through the form
may not have one.

Reports created through the form are different: their photos carry a
`blob:` object URL from `URL.createObjectURL`. **Nothing is uploaded anywhere.**
Those URLs live only in the current tab, so a submitted report's photo disappears
on reload — which is consistent, because the mock database resets then too.
Real storage arrives with the backend.

## Match scoring contract

A match's `score` **equals the sum of the `weight` of every signal where
`matched === true`.** Provisional weights, not yet approved:

| Signal | Weight |
| --- | --- |
| Species | 25 |
| Location proximity | 20 |
| Breed | 15 |
| Colour | 15 |
| Size | 10 |
| Date proximity | 10 |
| Other characteristics | 5 |

Hand-written seeds must stay arithmetically consistent with this, or the
comparison UI will look broken.

The live algorithm is in [`src/services/matchScoring.js`](../src/services/matchScoring.js)
and is the place to change any of this. Two rules beyond the score itself:

- **Species and location are gates.** A pair is not suggested unless both
  match, whatever the total. No amount of agreement elsewhere makes a cat the
  same animal as a dog, or a pet found 800 km away the one that went missing
  here.
- **Minimum score 65.** With the two gates contributing 45, a suggestion needs
  at least 20 further points of agreement.

Suggestions are computed on demand and never stored, so changing a weight
immediately changes what everyone sees. They only become records when a user
acts on one.

## Seeded records

| Data | Count | Notable |
| --- | --- | --- |
| Users | 10 | 7 users, 2 staff, 1 admin; one account suspended |
| Pet reports | 24 | 14 lost, 10 found; all four statuses; 15 cities across Luzon, Visayas and Mindanao; dogs, cats, birds and a rabbit |
| Matches | 3 | 85 (verification requested), 75 (suggested), 100 (confirmed → reunion) |
| Notifications | 8 | Mixed read/unread across four users |
| Moderation cases | 2 | One open, one actioned |

**The demo storyline:** `report-001` (Milo, lost brown Shih Tzu, Makati) and
`report-002` (found brown Shih Tzu, Makati, next day) are linked by `match-001`,
which is awaiting verification. `report-007` / `report-010` / `match-003` are
the completed version of the same story, ending in a reunion.

**The algorithm's test case:** `report-011` (Nala, lost cream Labrador, Quezon
City) and `report-012` (found cream Labrador, Quezon City, next day) describe the
same dog and have **no match record on purpose**. The algorithm finds them at
**100%**, all seven signals agreeing. Do not link them by hand — they are the
proof the matching works.

A second, weaker case worth knowing: Maria's `report-018` (Simba, Golden
Retriever, Taguig) is suggested against `report-012` at **65%** — same species,
about 10 km apart, same size, plausible timing, but a different breed and
colour. It is a good demonstration of why a possible match is only ever a
suggestion.
