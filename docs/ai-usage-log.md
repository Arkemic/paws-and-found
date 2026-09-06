# AI Usage Log

Required by the Final Project guide (ITS122P – AM2, page 5). Its stated purpose:

> This prevents the project from becoming simply "copy the AI-generated website."

Columns are the ones the guide asks for: **Date · AI Tool · Prompt · AI Output ·
What Student Changed · Reason**.

## Team

| Member | Responsibility |
| --- | --- |
| Austria, Kyle Michael V. | Project Manager / System Analyst |
| Espiritu, Francezka Avery | Frontend Developer |
| Citra, Dominic S. | *to be assigned* |
| Velasco, Calvin Kristian C. | *to be assigned* |
| Zaulda, Heinz Myjie P. | *to be assigned* |

Outstanding roles from the guide: Backend Developer, Database/API Developer,
QA/Security/UI/Documentation.

## How to keep this log

Add a row **when the AI output was changed, rejected, or corrected** — those are
the rows that carry evidence. Routine accepted output does not need a row of its
own; summarise it (see the Phase summary rows).

Keep the prompt column short but real. Paste the substance, not the whole
message.

> **Dates below are reconstructed** from document timestamps in `docs/` and from
> the development history. They are accurate to the working session, not to the
> hour. Kyle should correct any he knows more precisely before submission.
> Everything in the *What Student Changed* and *Reason* columns is a real
> decision that was made and is visible in the code.

---

## Log

### Architecture and process

| # | Date | AI Tool | Prompt | AI Output | What Student Changed | Reason |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | 2026-08-18 | Claude (Claude Code) | "Start Phase 0" — build the project foundation and architecture | 53 files including a service layer with a simulated 180 ms network delay, deep-cloning of all mock data, a custom `NotFoundError` hierarchy, and a `generateMatchesForReport()` stub for a feature seven phases away | **Rejected most of it.** Removed the artificial latency, the cloning, the error hierarchy and the future-phase stub. Wrote a permanent rule into `CLAUDE.md` §15 (Student-Scale Engineering Rule) banning repositories, factories, providers, adapters, event systems and future-phase code | The output was professional-engineering habit, not a student project. Every part of the system has to be explainable by a member during the defence. Rule added so the AI could not reintroduce it later |
| 2 | 2026-08-18 | Claude (Claude Code) | Phase 2 design checkpoint — asked the AI to propose a visual direction | Offered to generate a colour system | **Overrode it.** Team supplied the exact Teal + Amber palette with fixed hex values (`#157A78`, `#F4A340`, etc.), the Lost = amber / Found = teal rule, and a "do not do" list | Visual identity is the team's decision, not the AI's (`CLAUDE.md` §11). Fixing the hexes up front stopped the AI drifting the palette between pages |
| 3 | 2026-08-18 | Claude (Claude Code) | Roadmap of 12 build phases | AI proposed implementing several phases at once | **Restricted it to one phase per instruction**, with an end-of-phase report required each time, including a "Possibly Over-Engineered" section | Keeps the work reviewable. The over-engineering section repeatedly caught things worth deleting |
| 4 | 2026-08-18 → 08-19 | Claude (Claude Code) | Repeated requests to design the database | AI deferred every time, citing `CLAUDE.md` §8 | **Deliberately kept the database unbuilt** until the instructor specified the stack | The proposal ERD was a draft. Building a Supabase/PostgreSQL schema first would have been thrown away — the requirement turned out to be MySQL |

### Correctness and logic

| # | Date | AI Tool | Prompt | AI Output | What Student Changed | Reason |
| --- | --- | --- | --- | --- | --- | --- |
| 5 | 2026-08-18 | Claude (Claude Code) | "Start Phase 7" — build the possible-match scoring | Weighted scoring with a minimum score of 50 and no mandatory fields. It matched a Shih Tzu lost in Makati City against a Chihuahua found in **Cagayan de Oro — 783 km away — at 50%** | **Made species and location mandatory gates** (a mismatch on either blocks the match regardless of score), raised the threshold from 50 to **65**, capped distance at 15 km and date gap at 14 days, and added size words to the stop-word list because they were being counted twice | A matching system that suggests a pet 783 km away is worse than no matching at all. The gates are the reason the feature is defensible |
| 6 | 2026-08-18 | Claude (Claude Code) | Build the homepage "recent reports" section | Used `getRecentReports()`, which returned every report | **Filtered to Active and Possible Match only.** A report removed by an administrator for being a scam was appearing publicly on the homepage | Moderation has to actually remove content, or the admin workspace is decorative |
| 7 | 2026-08-19 | Claude (Claude Code) | Build a fullscreen photo lightbox for the report page | Used the native `<dialog>` but intercepted the `cancel` event with `preventDefault()` before closing | **Changed to sync from the native `close` event instead.** The original would have left the dialog and the React state disagreeing, so the lightbox could fail to reopen | Found by testing rather than by reading. Escape must close it reliably |

### Accessibility and correctness of the interface

| # | Date | AI Tool | Prompt | AI Output | What Student Changed | Reason |
| --- | --- | --- | --- | --- | --- | --- |
| 8 | 2026-08-18 | Claude (Claude Code) | Build the shared form controls | `<select>` styled with `appearance-none`, which strips the native dropdown arrow, with no replacement | **Added a drawn chevron to `Select`.** Until then every dropdown in the application was visually indistinguishable from a text input | Broke the affordance on every form in the project — report wizard, filters, admin |
| 9 | 2026-08-19 | Claude (Claude Code) | "Do an accessibility and consistency pass" | AI computed contrast ratios for every colour pair and found **five failures it had shipped in earlier phases** | **Fixed all five.** Form hint text was on a decorative token at 3.06:1 — on *every* input in the app; table headers 4.30:1; suspended pill 4.38:1; active pill 3.71:1. Added a `success-ink` token (`#286F43`) for ink on soft green | WCAG AA requires 4.5:1 for normal text. The hint-text failure had been present since Phase 0 |
| 10 | 2026-08-19 | Claude (Claude Code) | "Make the header have more presence" | Increased navigation text from 14 px to 16 px | **Moved the navigation collapse breakpoint from `lg` to `xl`.** The larger text made the header need 1084 px inside a 1009 px container at 1024 px wide, signed in as a coordinator — the page scrolled sideways | Caught by measuring the *staff* view, which has an extra nav link. The signed-out view fitted fine and would have hidden the bug |
| 11 | 2026-08-19 | Claude (Claude Code) | Rebuild the admin users list as a compact table | Table wrapper used `overflow-hidden` for rounded corners | **Changed to `overflow-x-auto` and folded the Status column into the User cell.** At 390 px the table was 410 px wide and the action buttons were clipped — unreachable on a phone | `overflow-hidden` silently truncates. The buttons were not just cramped, they could not be pressed |
| 12 | 2026-08-19 | Claude (Claude Code) | Rebuild the report detail page with a sticky sidebar | Sticky rail with a fixed top offset | **Added a height cap with internal scrolling.** For the report owner the rail is 798 px tall; on a 720 px viewport its last card sat permanently below the fold with no way to scroll to it | Only appears in the owner's view, which has an extra card. Found by testing signed in as the reporter |

### Data, assets and performance

| # | Date | AI Tool | Prompt | AI Output | What Student Changed | Reason |
| --- | --- | --- | --- | --- | --- | --- |
| 13 | 2026-08-18 | Claude (Claude Code) | Team supplied 24 generated pet photographs | AI wired them in at the supplied size — **58 MB total**, which made the Explore page (24 images at once) unusable on a phone | **Converted to 800×600 JPEG — 58 MB down to 2.2 MB.** Later re-exported at 1200×900 (4.2 MB) when measurement showed the detail-page gallery was upscaling an 800 px source to 903 px | Performance against quality. The second pass was a deliberate trade the team approved |
| 14 | 2026-08-19 | Claude (Claude Code) | "Compare the current site to this mockup and make the hero image larger" | AI had previously narrowed the hero text column, which pushed the headline onto three lines and the description onto four | **Rebalanced to equal columns, reverted the headline to 48 px, and made the photo taller (4:3) instead of wider.** Tightened the description from 207 to 191 characters so three lines hold at 1280 px too | The AI's earlier change caused the regression the team spotted. The fix had to give the photo size back *without* stealing width from the text |
| 15 | 2026-08-19 | Claude (Claude Code) | Team supplied the Explore header illustration (IMG-008) | AI had planned a 320×208 cut-out slot in the corner | **Rewired it as the entire band.** The supplied artwork is one 3:1 image with the wave and the clear text area built in. Measured the artwork and capped the text block at 50 % of the width, because past that the illustration darkens and muted text falls to 4.31:1 | The AI's assumption about the asset was wrong. The 50 % cap is a measured constraint, not a guess |
| 16 | 2026-08-19 | Claude (Claude Code) | Team supplied Facebook and Instagram icons | Supplied as 829 KB and 954 KB PNGs with a mottled teal disc baked in | **Extracted the white glyph and dropped the supplied disc — 829 KB → 1.1 KB and 954 KB → 4.0 KB.** Also made them non-links, since the project has no real social accounts | The baked disc would not have matched the flat brand teal, and linking to a page that does not exist misleads the user |

### Database (Phase 2)

| # | Date | AI Tool | Prompt | AI Output | What Student Changed | Reason |
| --- | --- | --- | --- | --- | --- | --- |
| 19 | 2026-08-19 | Claude (Claude Code) | "Let's proceed with the MySQL schema" — using the group's draft ERD as the starting point | An 11-table schema. It deviated from the draft ERD in four ways: species moved onto `pet_reports` as NOT NULL, `breed_id` made nullable, three tables added (`match_signals`, `notifications`, `moderation_cases`), and `password` renamed `password_hash` | **Reviewed and approved as proposed** (Kyle, 2026-08-19). All four deviations accepted; each is argued in comments inside `database/schema.sql` | The draft reached species only through the breed, and breed was mandatory. A found pet with an unknown breed could not have recorded its species — which the matching algorithm requires as a gate |
| 20 | 2026-08-19 | Claude (Claude Code) | "Where do I place this?" / "Still doesn't work?" — import kept failing with error 2002 | AI first gave a Bash-style command using `<` redirection, which PowerShell does not support, then assumed the default port 3306 | **Corrected by reading the XAMPP Control Panel:** this installation runs MariaDB on **port 3307**, because a separate MySQL 8.0 Windows service holds 3306. Import succeeded with `-P 3307` | The AI's first two suggestions were both wrong for this environment. The port is now recorded at the top of `schema.sql` so the next person does not lose the same hour |

| 21 | 2026-08-19 | Claude (Claude Code) | "Let's proceed" — generate seed data from the existing mock files | A Node generator (`scripts/gen-seed.mjs`) that loads the mock ES modules and emits `database/seed.sql`. First version numbered rows by **array position** | **Changed to derive ids from the mock id itself.** `report-009` had been appended to the end of the array, so position numbering turned it into `report_id 24` — the scam report would have been impossible to cross-reference between the two datasets. Now `report-009` is `report_id 9` | Debugging across a JavaScript fixture and a SQL table is hard enough without the primary keys disagreeing |
| 22 | 2026-08-19 | Claude (Claude Code) | Re-running the seed to verify it | Second run failed: `Duplicate entry '13'` on the two breeds the seed adds, because it does not delete the breeds `schema.sql` owns | **Changed to `INSERT IGNORE`** so the file is genuinely re-runnable. Also noted that MySQL returned **exit code 0 despite the error** — the client continues after failures, so exit status alone cannot be used to verify an import | A seed file that only works on a virgin database is a trap for whoever resets their data next |

### API (Phase 2 / 3)

| # | Date | AI Tool | Prompt | AI Output | What Student Changed | Reason |
| --- | --- | --- | --- | --- | --- | --- |
| 23 | 2026-08-29 | Claude (Claude Code) | Build the PHP REST API; the team wants to read and understand it rather than have it written around them | Eight flat files — front controller, config, PDO connection, helpers, auth, reports, categories — with no framework | **Accepted the structure**, on the condition that it stays flat and framework-free so every member can trace a request end to end at the defence (`CLAUDE.md` §15) | A framework would hide exactly the parts being graded: routing, sessions, prepared statements |
| 24 | 2026-08-29 | Claude (Claude Code) | Test the search endpoint | The search filter reused the placeholder `:q` across seven columns, and the colour filter reused `:colour` twice. Both returned **HTTP 500 — `SQLSTATE[HY093]: Invalid parameter number`** | **Fixed to one placeholder per column.** With `PDO::ATTR_EMULATE_PREPARES => false` MySQL prepares statements natively, and a native statement binds each named marker exactly once — reusing one is an error rather than a convenience | Emulation could have been switched back on to make the original work, but that would have PDO build the query string itself. Keeping native prepares is the stronger guarantee against injection, so the code changed instead of the setting |

| 25 | 2026-08-29 | Claude (Claude Code) | Switch the frontend from mock data to the live API | Switched the read paths. Three faults surfaced only when it ran: (a) mock matches hold ids like `'report-001'`, which the API answered with 404; (b) `getDemoAccounts()` returns an object keyed by role, but the new sign-in code called `.find()` on it; (c) on every page load `App` called `setCurrentUser(null)`, which now **logged the user out on the server** | **All three fixed.** The remaining match reads were moved to the API so ids agree; the lookup uses `Object.values()`; and `App` now asks `/auth/me` who is signed in instead of assuming nobody, holding the render until the answer arrives | The third was the serious one — with a real session, "assume signed out until told otherwise" destroys the session on every refresh. It only appeared because the switch was tested in the browser rather than by reading the diff |
| 26 | 2026-08-29 | Claude (Claude Code) | Make the detail page work against the API | The page called `userService.getUserById(report.reporterId)` to get the reporter's name and contact details | **Changed to use the reporter the API already returns.** The API decides which contact details may be published; a second lookup would have fetched the unfiltered user row and routed around the privacy rule | Privacy has to be enforced where the data is, not where it is displayed (`CLAUDE.md` §14) |

| 27 | 2026-08-30 | Claude (Claude Code) | Build the match decision endpoints | One `PATCH /matches/{id}` taking an action, with a table saying which roles may take each one. Confirming runs the whole cascade — both reports to `returned`, a history entry each, a notification each — inside one transaction | **Kept the transaction boundary.** A half-applied confirmation would leave one pet reunited and the other still missing, which is worse than the operation failing outright | The cascade is the moment the workflow pays off. It has to be all-or-nothing |
| 28 | 2026-08-30 | Claude (Claude Code) | Test who may decide a pairing | A test appeared to show an uninvolved user dismissing a match — an authorisation hole | **Checked the data before believing the test.** Liza Ocampo *is* the finder on that pairing, so dismissing it was correct. Re-ran with a genuinely uninvolved account, which was refused with 403 | The test premise was wrong, not the code. Worth recording because the instinct on seeing a failing security test is to change the code |
| 29 | 2026-08-30 | Claude (Claude Code) | Clean up test data between runs | Ran `DELETE FROM notifications WHERE notification_id > 11`, assuming the seeded rows were ids 1–11 | **Wiped every notification.** Auto-increment had moved well past 11 after repeated re-imports, so the condition matched everything. Restored by re-running `seed.sql` | Never identify seed rows by guessing at an auto-increment range. Re-running the seed file is the reliable reset, and it is why the file was made re-runnable |
| 30 | 2026-08-30 | Claude (Claude Code) | "Fix /admin and /admin/moderation" — both pages showed *No such endpoint. "undefined" was not found* | Diagnosed it as leftover mock data rather than a routing fault: `moderationService` still held ids like `'report-009'` and passed them to the now-live `petService.getReportById`, producing `/api/reports/report-009` | **Accepted the diagnosis and built the missing endpoint** (`api/moderation.php`) instead of translating the ids. The `moderation_cases` table already existed and was seeded; only the API was missing | The same class of bug was fixed for matches during the switch-over and simply not carried through to moderation. Patching the ids would have left the decisions unsaved |
| 31 | 2026-08-30 | Claude (Claude Code) | Same task — how much should one moderation decision do? | Four decisions (dismiss, warn, remove, remove-and-suspend) in one `PATCH`, each closing the case, applying its consequence and notifying the report's owner inside a single transaction | **Kept, and tested the destructive path end to end** — report `possible_match` → `closed`, a status-log row carrying the administrator's note, the account suspended, two notifications. Data restored afterwards by re-running `seed.sql` | A suspension that applied without a case recording why would be indefensible at a demonstration. `409` on an already-decided case was added so a double-click cannot re-punish someone |
| 32 | 2026-08-30 | Claude (Claude Code) | "Is it intentional that the pop-up is on the top left and not the centre?" | Traced it to Tailwind's reset setting `margin: 0` on every element, which cancels the `margin: auto` the browser uses to centre a native `<dialog>` | **Accepted; added `m-auto`.** The first attempt also added `overflow-y-auto`, which produced a stray horizontal scrollbar — a box with `auto` on one axis promotes `visible` on the other to `auto` — so `overflow-x-hidden` went with it | Not a Paws&Found bug so much as a collision between a framework reset and a platform default. Worth recording: it had been wrong on every dialog since Phase 3 and nobody had opened one |
| 33 | 2026-08-30 | Claude (Claude Code) | "The species and breed text fields are not aligned" | Found the cause in the shared `Field` wrapper: the hint rendered *above* the control, so a hinted field pushed its own input box a line lower than its unhinted neighbour in the same grid row | **Moved the hint below the control** rather than adding a hint to Species to pad it out. One change in one file fixed every form in the project | The reported symptom was two fields; the cause was every field. `aria-describedby` was already doing the accessibility work, so the move costs nothing there |
| 34 | 2026-08-30 | Claude (Claude Code) | "Let's have a next batch of pets to find, the data is becoming outdated" | Eight new reports dated 18–29 August, including a deliberate lost/found pair two days and one barangay apart in Davao City, plus the 95% pairing between them | **Kept, but filed with no photographs.** `CLAUDE.md` §18 forbids generating imagery without approval, so the reports carry `photos: []`, fall back to the placeholder, and the eight images are specified in `docs/image-requirements.md` as IMG-011 | The alternative — reusing existing pet photographs — would have put the same animal on two different reports and broken the matching demonstration it was meant to strengthen |
| 35 | 2026-08-30 | Claude (Claude Code) | "The staff workspace and administration are just pure text — make it personalised" | An `Avatar` drawn from initials, pet photographs in the coordinator's queue rows, and an icon medallion plus a role eyebrow on every workspace heading | **Kept. No invented faces.** Profile photographs are not in scope, and generating them would put fabricated faces on fabricated people; initials on a tinted disc give the same human presence with nothing invented | The queue rows were the bigger win: every row said "A lost and a found report share enough details to be compared", so the photographs are the only thing distinguishing one case from another |

| 36 | 2026-09-06 | Claude (Claude Code) | Set the project up on a second computer and confirm it runs | Reported the environment working, then checked `docs/feature-status.md`'s claim that authentication was `[x]` **Real** | **Rejected the project's own documentation.** The session layer was real, but `LoginPage.jsx` shipped `<Button disabled>Sign in</Button>` and never called `POST /auth/login` — the only way in was the demo role selector. Registration was an inert button with **no API endpoint at all**. The status file was corrected | "Login/logout" is mandatory in the guide (page 3). The backend had been built and the frontend never connected to it, and the status file recorded the half that was finished. Caught by trying to sign in, not by reading the file |
| 37 | 2026-09-06 | Claude (Claude Code) | Wire sign-in and registration to the API | A `POST /auth/register` that validated input, hashed with `password_hash`, and checked for a duplicate email with a `SELECT` before inserting | **Dropped the pre-check and let the unique index decide**, catching SQLSTATE 23000 and answering 409. A check-then-insert leaves a gap where two people registering the same address at the same moment both pass | The database already guarantees it via `uq_users_email`. Asking twice is slower and still wrong |
| 38 | 2026-09-06 | Claude (Claude Code) | Same task — what should the register endpoint accept? | The first draft read the whole request body into the insert | **The role is now never read from the request**, and is hard-coded to `'user'` in the SQL. Tested by registering with `"role":"admin"` in the body: the account was created as `user` | Left as it was, anyone who could read the network tab could register themselves an administrator account. This is the single most damaging thing a public registration form can get wrong |
| 39 | 2026-09-06 | Claude (Claude Code) | Load the database from `README.md`'s own instructions | The documented `mysql` commands, which omit `--default-character-set=utf8mb4` | **Found the seed data silently corrupted** — every curly apostrophe stored as `ÔÇÖ`, because the Windows client read the UTF-8 file in the console code page. Reloaded with the flag and corrected the README | Nothing errored. It would have reached the demonstration as mangled text on the report pages, and every team member on Windows would have hit it |
| 40 | 2026-09-06 | Claude (Claude Code) | Build the dashboard charts the guide requires | A first plan that fetched the report list and counted it in JavaScript, reusing what the page already loads | **Moved the counting into SQL** as `GET /reports/stats` — three `GROUP BY` queries. The list endpoint is paginated, so counting its rows would have reported on one page rather than on the table; the admin "Active reports" tile had that fault already and now reads the database count | It agreed only because 32 reports fit inside one 50-row page. It would have started under-reporting silently at 51, which is the worst kind of wrong number on a dashboard |
| 41 | 2026-09-06 | Claude (Claude Code) | Same task — how to draw the charts | Suggested adding a charting library | **Rejected; drawn with plain elements and CSS.** Six months of two numbers does not justify a dependency, and `CLAUDE.md` §15 asks for the simplest implementation a member can explain at the defence | A library would also have brought its own colour scale, which would have collided with the teal/amber tokens the team approved |
| 42 | 2026-09-06 | Claude (Claude Code) | Same task — the staff page already had a bar breakdown | The first version added a second, near-identical bar list to the administrator page | **Extracted one `BreakdownBars` component** used by both, with the status colours moved to `REPORT_STATUS_BARS` in constants. `CLAUDE.md` §17 exists precisely to stop this | Two copies would have drifted — most likely into colouring the same status differently on two dashboards |
| 43 | 2026-09-06 | Claude (Claude Code) | Same task — accessibility of a chart | The drawing alone, with no text alternative | **Added an `sr-only` table of the same figures** and marked the drawing `aria-hidden`, plus each month's total as visible text above its bars | A chart that exists only as coloured boxes is unreadable to a screen reader. The existing `StatusBreakdown` had already solved this by putting the number next to the bar; the monthly chart has twelve values and needed the table instead |

### Where the student corrected the AI's reasoning

| # | Date | AI Tool | Prompt | AI Output | What Student Changed | Reason |
| --- | --- | --- | --- | --- | --- | --- |
| 17 | 2026-08-19 | Claude (Claude Code) | "The page is too small on desktop — raise the container to 1240–1280 px" | AI measured before changing anything and reported the container was **already 1280 px** | **Kept the container unchanged** and fixed internal scale instead — type, image sizes, section density | The stated fix would have made the page *narrower*. The perception was real but the diagnosis was not; measuring first avoided a wrong change |
| 18 | 2026-08-19 | Claude (Claude Code) | "Increase the header height to 64–68 px" (asked twice) | AI reported the header was already 81 px, and that the same message also called it "slightly too short" | **Kept the height and fixed the horizontal crowding instead** — group spacing, a divider, and separating the demo-role control from the account name | The instruction conflicted with itself. Shrinking the header would have worsened the crowding actually being described |

---

## Summary of accepted output

Not every phase needed correction. The following were largely accepted as
generated and reviewed rather than rewritten, and are recorded here so the log
reflects the whole project rather than only the disputes:

- Routing and layout shell (Phase 1)
- Report wizard structure — Pet details → Location & date → Photos → Review (Phase 3)
- Explore filtering, sorting and empty states (Phase 4)
- Leaflet map integration and code-splitting (Phase 8)
- Notification centre and status history (Phase 9)
- Staff and administrator workspaces (Phases 10–11)

All were reviewed against `CLAUDE.md` §15 before being kept, and several were
trimmed at the end-of-phase "Possibly Over-Engineered" review.

## Still to record

- Pagination controls in the interface (the API already supports paging)
- Deployment
- Technical documentation
