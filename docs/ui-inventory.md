# UI Inventory

**Check this file before creating any reusable component.** It exists to prevent
the classic drift into `PetCard` + `PetListingCard` + `AnimalCard` +
`ReportCard` + `LostPetCard` that are all the same thing (CLAUDE.md §17).

If what you need is close to something below, extend that component with a prop
rather than forking it. If you add a component, add its row here in the same
commit.

_Last updated: pagination — 2026-09-06_

Colours, shape tokens and the accessibility rules live in
[design-system.md](design-system.md). Components must use semantic tokens, never
raw Tailwind colours.

## Built

| Component | File | Notes |
| --- | --- | --- |
| `Button` | `components/ui/Button.jsx` | Variants `primary` (teal) `secondary` `ghost` `accent` (amber) `danger`; sizes `sm` `md` `lg`; `isLoading`, `fullWidth`. `as={Link}` renders a button-shaped link. Defaults to `type="button"`. |
| `PetCard` | `components/PetCard.jsx` | **The** card for a report, everywhere one appears. The photo leads, with the type badge and relative date overlaid on it; name, species/breed, city and status below. Whole card clickable via a stretched link. Falls back to a paw placeholder. |
| `ReportTypeBadge` | `components/ReportTypeBadge.jsx` | LOST (amber) / FOUND (teal), each with its own icon and the word. |
| `StatusBadge` | `components/StatusBadge.jsx` | Dot + label for the four statuses. Deliberately quieter than the type badge so the two can sit together. |
| `Input` | `components/ui/Input.jsx` | Text input with label, hint, error. Any `<input>` type. |
| `Textarea` | `components/ui/Textarea.jsx` | Same contract as `Input`, plus `rows`. |
| `Checkbox` | `components/ui/Checkbox.jsx` | Label beside the box, optional hint. Does not use `Field` — that one stacks label above control. |
| `Select` | `components/ui/Select.jsx` | Native select with a drawn chevron — `appearance-none` strips the native arrow, so it has to be replaced or the control looks like a text input. Build options with `optionsFromLabels()` from `@/utils/options`. Takes `hideLabel` for use inside a table row. Has no `size` prop — anything unrecognised lands on the native `<select>`, where `size` means something else entirely. |
| `Field` | `components/ui/Field.jsx` | Label + hint + error wrapper used by the three controls above. Use directly only when wrapping a control that does not exist here yet. `hideLabel` keeps the label for screen readers but hides it — for a control in a table cell, where the column header already says what it is. The hint renders **below** the control, not above: with it above, a hinted field pushed its own input box down and two fields side by side in a grid row stopped lining up. |
| `controlClasses`, `describedBy` | `components/ui/formControl.js` | Shared control styling and the `aria-describedby` builder, used by Input/Textarea/Select. They sit in their own file because a component file must export components only — otherwise Fast Refresh breaks and the lint fails. |
| `Card` + `CardHeader` `CardBody` `CardFooter` | `components/ui/Card.jsx` | Generic surface. Compose it — do not create new card components for each context. |
| `Modal` | `components/ui/Modal.jsx` | Native `<dialog>`: focus trap, Escape, inert background. Parent owns `isOpen`. Carries `m-auto` deliberately — the browser centres a dialog with `margin: auto` and Tailwind's reset zeroes it, which pins the dialog to the top-left. Do not remove it. |
| `Container` | `components/ui/Container.jsx` | Page width + gutters. Widths `page` (1280) `wizard` (800) `form` (672) `prose` (720). |
| `EmptyState` | `components/ui/EmptyState.jsx` | Icon + title + description + action, for any list with nothing in it. |
| `LoadingSkeleton` | `components/ui/LoadingSkeleton.jsx` | Pulsing placeholder bars. Pass `lines` and a sizing `className`. |
| `NavDropdown` + `NavDropdownItem` | `components/NavDropdown.jsx` | The header's disclosure menus — "Report" and the account control. Opens on click (never hover, which is unusable on touch), closes on Escape, on an outside click, and after a link inside is followed. `children` is a function receiving `close`. |
| `Navbar` | `components/Navbar.jsx` | Sticky top navigation, 72px, in four groups: brand · public links · the role's workspace · account and demo controls. `Report Lost` and `Report Found` share one `Report` menu. The workspace is a bordered control rather than a sixth link, and the demo selector sits behind a divider under a muted "Demo:" so it cannot be mistaken for an account control. Collapses behind a menu button below `xl` — check the fit against the *staff* view, which carries the most. |
| `Sidebar` | `components/Sidebar.jsx` | Workspace navigation. A scrolling row on mobile, a column from `lg`. |
| `Footer` | `components/Footer.jsx` | Four link columns grouped by intent, plus the demo-data disclaimer. |
| `SectionHeading` | `components/SectionHeading.jsx` | The `h2` that opens a section on a public page, with optional description and an action opposite. Was local to the homepage until About and Help needed the same thing. |
| `PageHeader` | `components/PageHeader.jsx` | Breadcrumb, `h1`, description, actions — **and the document title**. Optional `icon` and `eyebrow` put an icon medallion and a role line beside the heading; the staff and admin workspaces use both, public pages use neither because they lead with an image instead. Every page should render one. The report detail page is the one exception: it composes `Breadcrumb` + `h1` + `<title>` itself so the type and status badges can sit directly under the name. |
| `Breadcrumb` | `components/Breadcrumb.jsx` | Takes `{ label, to }[]`; the last item is the current page. |
| `RequireAccess` | `components/RequireAccess.jsx` | Route guard: signed out → `/login`, wrong role → `/unauthorized`. UI coherence only, not security. |
| `FilterPanel` | `components/FilterPanel.jsx` | Explore's filter controls. Stateless — the page owns the values, so the desktop sidebar and the mobile dialog cannot drift apart. |
| `ActiveFilters` | `components/ActiveFilters.jsx` | Removable chips for every applied filter. |
| `FlagReportDialog` | `components/FlagReportDialog.jsx` | "Report this listing" — creates a moderation case. Requires sign-in. |
| `DemoRoleSelector` | `components/DemoRoleSelector.jsx` | **Development only.** Delete when real authentication lands. |
| `ReportForm` | `components/report-form/ReportForm.jsx` | The lost/found wizard. One component for both types **and** for editing — pass `reportType` to create, or `report` to edit. Steps, validation and the value↔service mapping live in `reportFormModel.js`. |
| `Avatar` | `components/Avatar.jsx` | A person drawn from their initials, on one of five tints picked from the name so the same person is the same colour everywhere. Decoration only — `aria-hidden`, and the name is always beside it. Used where the staff and admin workspaces list people. There are no profile photographs and none are planned. |
| `StatTile` | `components/StatTile.jsx` | One number plus its label on a dashboard. The tile itself stays plain — no sparkline or trend arrow inside it; charts are separate components below. **Staff and admin only** — the customer dashboard shows cases, not counts. Pass `emphasis` for the one or two numbers that mean someone has to act; if every tile is emphasised, none is. |
| `BreakdownBars` | `components/BreakdownBars.jsx` | A labelled list of proportion bars — "where reports stand", "most reported animals". Takes `rows` of `{key, label, value, barClassName}` and an optional `total`. The bar is `aria-hidden`; the number beside it is the real value. Used by both the staff and administrator dashboards, which is why the status colours live in `REPORT_STATUS_BARS` in constants rather than in either page. |
| `MonthlyReportsChart` | `components/MonthlyReportsChart.jsx` | Reports filed per month, lost beside found, over six months. Plain elements, no charting library (CLAUDE.md §15). Bars are measured against the tallest single value so the two series stay comparable. Carries an `sr-only` table of the same figures — the drawing alone is not readable. |
| `Pagination` | `components/Pagination.jsx` | Numbered page links for a paged list — previous, page numbers, next. Renders nothing when everything fits on one page. Shows every page up to seven, then windows to first/last/current±1 with an ellipsis. `nav` with its own label, `aria-current` on the current page, and Previous/Next keep their words for screen readers when the viewport hides them. |
| `MatchCard` + `MatchActions` | `components/MatchCard.jsx` | The evidence comparison: two large photographs side by side with the score between them, then every signal ticked or crossed — matched **and** unmatched. Used by the customer dashboard, My Matches, the report detail page, the staff match queue and verification, so all five show a coordinator and a reporter the same thing. Never claims two reports are the same animal. |
| `ReportMap` + `KeepMapSized` | `components/ReportMap.jsx` | Leaflet map of one or many reports, with popups. `showApproximateArea` draws the privacy circle. Always include `KeepMapSized` in a new map, or tiles go missing after a resize. |
| `LocationPicker` | `components/LocationPicker.jsx` | Click-to-drop pin for the report form. Optional by design. |
| `mapSetup` | `components/mapSetup.js` | Marker icons, tile layer and OSM attribution. Not components — icons are built here so the palette stays in one place. |
| `LazyMaps` | `components/LazyMaps.jsx` | **Import maps from here.** Wraps the map components in `lazy` + `Suspense` so Leaflet stays out of the initial bundle. |
| `Timeline` | `components/Timeline.jsx` | A report's `statusHistory`, oldest first, with actor names. |
| `VerificationPanel` | in `pages/staff/StaffVerificationPage.jsx` | Coordinator decision panel. Local to that page — it is the only place a pairing is decided. |
| ~~`PhaseNotice`~~ | *deleted* | Every route is now built, so the placeholder component is gone. |

## Planned

Do not build these ahead of the phase that needs them.

| Component | Phase | Purpose |
| --- | --- | --- |
| `Toast` | when something needs it | Not built in Phase 3: the report wizard confirms with a full success screen, so there was nothing for a toast to say. |

## Conventions

- Components in `components/ui/` are presentational: no service calls, no
  routing, no business rules. Components that know what a *pet report* is go in
  `components/` alongside them, not in `ui/`.
- Every component accepts `className` and applies it **last**, so a caller can
  override spacing without a wrapper div.
- Use the semantic colour tokens (`text-fg-muted`, `border-border`) rather than
  raw Tailwind colours, so the design checkpoints can repaint the app from
  `src/index.css` alone.
- Anything conveyed by colour must also be conveyed by text or shape.
- A component file must export **only components**. Constants and helper
  functions belong in a sibling `.js` module (see `formControl.js`), otherwise
  Fast Refresh stops working and `react-refresh/only-export-components` fails
  the lint.
