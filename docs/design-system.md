# Design System

**Official Paws&Found colour direction: Teal + Amber.** Approved by the team at
the Phase 2 design checkpoint; it replaces the neutral placeholder palette from
Phase 0.

_Last updated: Explore refinement pass — 2026-08-18_

## Intent

Paws&Found should feel trustworthy, reassuring, community-oriented and
approachable — built for someone who is stressed because their pet is missing.

**Teal is the brand:** reliability, safety, organisation.
**Amber is the accent:** warmth, urgency and emphasis, without alarm.

The interface stays light and restrained on an off-white canvas. Pet photographs
are meant to supply most of the visual richness once they exist.

It should not read as: a veterinary hospital, a pet store, a childish pet site,
an emergency-alert page, or a generic corporate SaaS dashboard.

## The one rule

**Never write raw Tailwind colours (`bg-teal-600`, `text-orange-400`,
`border-gray-200`) in a component.** Use the semantic tokens. Every colour is
defined once in `src/index.css`, which is what allows the whole application to
be recoloured from a single file.

If you need a colour that has no token, add the token — do not inline the hex.

## Palette

### Brand — teal

| Token | Hex | Use |
| --- | --- | --- |
| `brand` | `#157A78` | Primary buttons, links, navigation emphasis, focus ring |
| `brand-hover` | `#0E5D5B` | Hover and active states, strong teal text |
| `brand-soft` | `#E2F1EF` | Selected nav backgrounds, soft info panels, section bands |

### Accent — amber

| Token | Hex | Use |
| --- | --- | --- |
| `accent` | `#F4A340` | Lost-report action, secondary emphasis, attention that is not an error |
| `accent-hover` | `#D98A26` | Amber hover and active |
| `accent-soft` | `#FFF1D6` | Soft highlight backgrounds, possible-match emphasis |

Amber is **not** an error colour. Errors use `danger`.

### Neutrals

| Token | Hex | Use |
| --- | --- | --- |
| `surface` | `#FBF9F6` | Page canvas — warm off-white so cards lift off it |
| `surface-alt` | `#F4F9F7` | Alternating full-bleed section bands |
| `surface-muted` | `#EEF3F2` | Hover fills, disabled inputs |
| `surface-warm` | `#FCF8F0` | The footer — a warmer neutral than the body, so the page ends deliberately |
| `panel` | `#FFFFFF` | Cards, modals, forms, the nav bar |
| `border` | `#DDE6E4` | Card outlines, dividers |
| `border-strong` | `#C7D5D2` | Form controls |
| `fg` | `#21302F` | Headings and body |
| `fg-muted` | `#667573` | Metadata, descriptions, placeholders |
| `fg-subtle` | `#899694` | **Decorative only** — see accessibility below |
| `fg-inverted` | `#FFFFFF` | Text on brand/danger fills |

### Report type — Lost = amber, Found = teal

| Token | Hex | Use |
| --- | --- | --- |
| `lost` | `#9A620F` | LOST badge text |
| `lost-soft` | `#FFF1D6` | LOST badge background |
| `found` | `#0E5D5B` | FOUND badge text |
| `found-soft` | `#E2F1EF` | FOUND badge background |

These two are the **ink** used on soft backgrounds, so both are darker than the
brand values they derive from. The full-strength `accent` (`#F4A340`) and
`brand` (`#157A78`) remain the correct identity colours for fills and for map
markers in Phase 8.

### Report status

Type and status are separate concepts and must never share a visual treatment.
`ReportTypeBadge` is a filled badge; `StatusBadge` is a small dot plus text, so
the two can sit side by side without competing.

| Token | Hex | Status |
| --- | --- | --- |
| `status-active` | `#157A78` | Active — teal, not blue: blue carries no other meaning in this palette |
| `status-match` | `#D98A26` | Possible Match |
| `status-returned` | `#338A55` | Returned |
| `status-closed` | `#737B7A` | Closed |

Each also has a `-soft` variant for tinted backgrounds.

### Feedback

| Token | Hex | Use |
| --- | --- | --- |
| `danger` / `danger-hover` / `danger-soft` | `#C24141` / `#A63535` / `#FBEAEA` | Destructive actions, suspension, deletion, validation errors |
| `success` / `success-soft` | `#338A55` / `#E4F2EA` | Successful recovery, positive confirmations |

Do not overuse danger red.

## Shape and elevation

| Token | Value | Use |
| --- | --- | --- |
| `rounded-card` | 16px | Cards, modals, panels |
| `rounded-control` | 10px | Buttons, inputs, small badges |
| `rounded-pill` | full | Chips and status pills |
| `shadow-card` | soft, 8px | Default card lift |
| `shadow-raised` | soft, 24px | Hover, and elements floating over an image |

Shadows are neutral and restrained — a card lifts off the canvas, it does not
float. No coloured or glowing shadows. Avoid glassmorphism, neon, large
gradients and excessive animation.

## Type scale

Body copy is **`text-base` (16px)**. `text-sm` is for metadata only — it was
overused early on and made the whole interface read as annotations.

| Role | Class | Size |
| --- | --- | --- |
| Hero headline | `text-4xl` → `sm:text-5xl` | 36 → 48px |
| Page title (`PageHeader`) | `text-3xl` | 30px |
| Section heading | `text-2xl` → `sm:text-3xl` | 24 → 30px |
| Card heading | `text-lg` | 18px |
| Body | `text-base` | 16px |
| Metadata | `text-sm` | 14px |

## Control sizes

| Size | Height | Use |
| --- | --- | --- |
| `sm` | 36px | Dense rows, table actions |
| `md` | 44px | Default. Matches input height. |
| `lg` | 52px | Primary calls to action |

WCAG 2.2 AA only requires a 24x24 target; 44px is the comfortable size on a
phone and stops the interface reading as a dense admin tool. Inputs, selects and
textareas share `min-h-11` so a control and a button line up side by side.

## Page composition

Public pages alternate between `surface` and full-bleed `surface-alt` bands so a
long page reads as distinct chapters rather than one scroll of white cards.
A page that runs its own full-bleed sections cancels `RootLayout`'s padding
with `-my-8` — the homepage, About and Help do this. A section that can be
jumped to from an in-page link needs `scroll-mt-24`, or the sticky 72px navbar
covers its heading on arrival.

**The desktop navigation collapses below `xl`, not `lg`.** A signed-in
coordinator carries seven links plus a name plus the demo selector; at 1024 that
needs about 1080px of a 1009px container. The breakpoint has moved twice for
this reason — check it against the *staff* view, never the signed-out one.

**Detail pages** use a 70/30 grid — `lg:grid-cols-[minmax(0,1fr)_22rem]` — with
the supporting rail sticky (`lg:sticky lg:top-24 lg:self-start`). A sticky rail
must also cap its height (`lg:max-h-[calc(100dvh-7rem)] lg:overflow-y-auto`);
without it, a rail taller than the viewport puts its last card permanently below
the fold with no way to reach it. Both collapse to one column below `lg`.

**A long list is one panel of divided rows, not a stack of panels.** Cards
separated by gaps make the eye stop at every item; a notification list, a
recent-activity feed and a case queue are all read straight down. Group headings
(Today / This week / Earlier) carry the structure instead of borders.

**Footer links carry a resting underline.** In a muted colour on a muted
ground they read as text, not links. They keep `fg-muted` with a hairline
`border-strong` underline and turn `brand` on hover, which is what makes them
look clickable before the cursor arrives.

**Type on a tinted band uses full-strength `fg`.** `fg-muted` on the Explore
header band measures 4.31:1, and no usable tint strength reaches AA — lightening
`brand-soft` to 30% still only gets to 4.47. Darken the ink instead of the
surface.

**Every page sits on a faintly warm ground.** The `page-ground` utility on the
app shell carries the same amber/teal atmosphere at about a third of the
homepage's strength, fixed so it does not scroll. Home layers `hero-ground` on
top for its stronger opening; the functional pages get only the hint, so they
stay calm and data-focused while still belonging to the same surface.

**The homepage hero sits on a tinted ground, not the flat canvas.** The
`hero-ground` utility layers two radial gradients — amber at 10% behind the
headline, teal at 7.5% behind the photograph — over the warm off-white. It is
applied to a wrapper around the hero and search only, so it cannot bleed into
the reports section, where the photographs need the plain canvas. Keep both
below about 12%: the page should read as warmer without anyone noticing a
gradient.

**Table wrappers use `overflow-x-auto`, never `overflow-hidden`.** Both round
the corners, but `overflow-hidden` silently clips a table that does not fit and
the clipped controls cannot be reached at all. The admin user table did exactly
that at 390px until the Status column was folded into the User cell.

**Staff and admin lists are tables, not stacks of cards.** A coordinator
scanning two dozen reports needs rows they can compare down a column. Secondary
columns drop out at narrow widths (`hidden md:table-cell` and friends) and the
ones that matter most fold into the always-visible column, so the table never
scrolls sideways. Public-facing lists keep using `PetCard` — that audience is
browsing, not processing.

**A match is evidence, not a listing.** Wherever two reports are compared, the
photographs get real size side by side with the score between them, and every
signal is listed with a tick or a cross — including the ones that disagree. This
is the screen that distinguishes Paws&Found from a bulletin board, so it is the
one place the interface spends vertical space deliberately.

**Destructive actions do not sit next to constructive ones.** "Not the same pet"
is pushed to the opposite end of the row from "Confirm match".

**No chart library.** A proportional bar is a `div` with a percentage width and
a status colour. Four numbers do not justify a dependency the team has to
defend.

**The customer dashboard has no counter row.** Counters belong to the staff and
admin workspaces, where someone is managing a queue they cannot see all of. An
owner with two open cases does not need to be told they have two — they need to
see the two. The customer dashboard leads with a greeting and the two report
actions, then shows the cases themselves.

**Short facts are chips, not definition rows.** A stack of label/value pairs
reads as a form and buries the one attribute a reader is looking for. Each chip
carries its label in an `sr-only` span so screen readers still get the pair.

Container widths: `page` 1280px · **`wizard` 800px** · `form` 672px ·
`prose` 720px. The report wizard uses `wizard`; `form` is for short single
-column forms such as sign-in.

## Using colour with restraint

Do not paint everything teal or amber.

- **Primary actions** are teal: *Search Pets*, *Submit Report*, *Continue*.
- **Amber** is used where it carries meaning: *Report a Lost Pet*, possible-match
  emphasis. `<Button variant="accent">`.
- **Cards** are white with a subtle border and restrained coloured accents.
  Do not build fully teal or fully amber content cards without a functional
  reason.

## Maps

Built in Phase 8 with Leaflet and OpenStreetMap. Markers are `divIcon`s whose
colours come from the tokens above, so the map cannot drift from the palette —
see `src/components/mapSetup.js`.

| Marker | Colour |
| --- | --- |
| Lost report | `accent` (amber) |
| Found report | `brand` (teal) |
| Returned | `status-returned` (green) |

Colour is never the only signal: every popup names the report type in words,
and the map is always paired with a list view.

**Privacy:** a report's coordinates are barangay-level and marked
`precision: 'approximate'`. The detail page draws a 400 m circle around the pin
so the imprecision is visible rather than implied, and the report form tells
people to pin an area rather than their own front door.

## Accessibility

**Colour is never the only signal.** Every report type and status carries an
icon and/or explicit text, so a colour-blind reader — or a greyscale printout —
loses nothing.

Measured contrast against WCAG AA (4.5:1 for normal text). Re-measured in full
at the Phase 12 pass — every pair below is computed from the tokens in
`src/index.css`, not estimated.

| Combination | Ratio | |
| --- | --- | --- |
| `fg` on `panel` | 13.74 | pass |
| `fg` on `surface-muted` (table headers) | 12.26 | pass |
| `fg` on `accent-soft` | 12.30 | pass |
| `brand` fill + white text | 5.14 | pass |
| `accent` fill + `fg` text | 6.65 | pass |
| `fg-muted` on `panel` | 4.82 | pass |
| `fg-muted` on `surface` | 4.59 | pass |
| `fg-muted` on `surface-alt` | 4.53 | pass |
| `brand` link on `surface` | 4.89 | pass |
| `brand-hover` on `brand-soft` (score dial, active tab) | 6.60 | pass |
| `danger-hover` on `danger-soft` (suspended pill) | 5.68 | pass |
| `danger` on `panel` | 5.09 | pass |
| `success-ink` on `success-soft` (active pill) | 5.28 | pass |
| LOST badge (`lost` on `lost-soft`) | 4.56 | pass |
| FOUND badge (`found` on `found-soft`) | 6.60 | pass |
| `lost` on `accent-soft` (urgent attention row) | 4.56 | pass |

Non-text and decorative, against the 3:1 requirement for UI components:

| Combination | Ratio | |
| --- | --- | --- |
| `success` on `success-soft` (✓ icon) | 3.71 | pass |
| `danger` on `danger-soft` (✕ icon) | 4.38 | pass |
| `fg-subtle` on `panel` (icons, dividers) | 3.06 | pass |

**Five failures found and fixed at the Phase 12 pass**, all of which had shipped
in earlier phases:

- **Form hint text** used `fg-subtle` (3.06:1) — on every `Input`, `Select` and
  `Textarea` in the application. Now `fg-muted`.
- **Table header labels** were `fg-muted` on `surface-muted` (4.30:1). Now `fg`;
  the sorted column is marked by weight and the arrow rather than by colour.
- **The "Suspended" pill** was `danger` on `danger-soft` (4.38:1). Now
  `danger-hover`.
- **The "Active"/"Available" pills** were `status-returned` on its soft
  background (3.71:1). A new `success-ink` token (`#286F43`) was added for ink on
  a soft green ground, the same way `lost` and `found` work.
- **Two stray labels** — the map's "Approximate area only." and a coordinator
  timestamp — were on `fg-subtle`. Now `fg-muted`.

`surface-alt` was originally `#F2F7F5`; at that value `fg-muted` on the section
bands measured **4.45:1**, just under AA. It was lightened to `#F4F9F7` (4.53:1).
Any future change to a background colour must be re-measured against `fg-muted`,
which is the tightest pairing in the palette.

### Target size

The bar is WCAG 2.2 AA (2.5.8): a 24x24 CSS pixel target, or enough spacing that
24px circles centred on adjacent targets do not intersect.

Footer links, breadcrumb links and the notification row actions were 19-20px
tall and tightly stacked; they carry `py-1` now. Table row links and sortable
headers are also ~20px but are 48-69px apart, so they pass on the spacing
exception and were left compact deliberately — padding them would undo the
density the queues were rebuilt for.

`PetCard`'s heading link measures 21px, but the card uses a stretched link
(`after:absolute after:inset-0`), so the real target is the whole 442x487 card.
Measure the hit area, not the text box.

**Two deliberate deviations from the approved palette**, both to reach AA:

- The LOST badge ink was darkened from `#D98A26` to `#9A620F`. At the specified
  value it measured **2.47:1** — the most important label on a card was also the
  least readable.
- The FOUND badge ink uses Dark Teal `#0E5D5B` rather than Primary Teal
  `#157A78`, which measured 4.42:1 on the soft teal background.

Both keep the amber/teal identity. The undarkened values are still used for
fills, where they pass.

**Never put white text on `accent`** — amber with white measures 2.07:1. Amber
fills take `fg` (dark) text.

**`fg-subtle` (3.06:1) is decorative only**: icons, dividers, ornament. Anything
a person needs to read uses `fg-muted` or darker.

## Not decided yet

- **Dark mode** — deliberately skipped. It doubles the palette to maintain
  without improving the lost-pet workflow. Tokens are centralised, so it stays
  addable later.
- **Typography** beyond the system stack and Tailwind's default scale.
- **Logo / brand mark** (IMG-002) — should be generated from this palette so the
  imagery and the interface read as one project.
