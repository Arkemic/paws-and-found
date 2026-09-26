# What the mock defence tells us, and what it means here

**ITS122P–AM5 · Group 3** · 26 September 2026 · **audit only, no code changed**

Previous students sat the instructor's mock presentation with a dental
appointment system and wrote down what she asked them. Their features are not
our features. What transfers is the **pattern of what she tests**, which reads
as six questions:

1. Can the user reach an invalid state?
2. Can the user misunderstand what the system just did?
3. Can somebody reach what they should not?
4. Are prerequisites enforced before consequential actions?
5. Does one action correctly affect everything related to it?
6. Does the system recover from mistakes?

Priority below is **not** "how sophisticated does this sound". It is:

```
how easily can she trigger it  ×  how wrong is the result  ×  how risky is the fix
```

`has_collar` scored maximum on the first two and minimum on the third, which is
why it was fixed first. An entropy-based password meter scores near zero on the
first and is therefore near the bottom, however impressive it reads.

---

## Master table

| # | Instructor lesson | Paws&Found equivalent | Status | Priority | Demo risk | Recommendation |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Lock after failed logins; admin restores | Three-attempt lock, admin unlock | **A** Already | — | LOW | Leave alone |
| 2 | Active/inactive visual hierarchy | Staff decision buttons | **B** Partial | Medium | **MEDIUM** | Semantic hierarchy + consequence lines |
| 3 | Content order matches the decision | Wizards, verification, detail | **A** Already | — | LOW | Leave alone |
| 4 | Consent must be informed | `privacy_consents`, unchecked box | **B** Partial | Low | LOW | Already strong; do not force scroll |
| 5 | Obvious safe exit | Register, login, wizard | **C** Missing | **High** | **MEDIUM** | Add Cancel / Back to home |
| 6 | Bot & abuse protection | Login lock only | **B** Partial | Medium | LOW | Rate-limit registration; CAPTCHA only if hosted |
| 7 | Password rules visible up front | "At least 8 characters" hint | **B** Partial | Low | LOW | Add show/hide + live checklist |
| 8 | Verify the email is real | Not modelled at all | **C** Missing | **High** | **MEDIUM** | Needs SMTP; decide after hosting |
| 9 | Forgot / reset password | Absent | **C** Missing | **High** | **HIGH** | Same SMTP decision |
| 10 | Collect only what is needed | Phone optional, no addresses | **A** Already | — | LOW | Leave alone |
| 11 | Structured address | City/province/barangay label + approx. point | **B** Partial | Low | LOW | Deliberate; explain, don't change |
| 12 | Dependent fields | `has_collar` fixed; rest verified | **A** Already | — | LOW | Control test now guards it |
| 13 | Draft reports | Absent | **D** Missing | Medium | LOW | Group C at best |
| 14 | View mode vs edit mode | Profile is always editable | **C** Missing | Medium | **MEDIUM** | Profile only |
| 15 | Prerequisites before big actions | Consent yes; no email verification | **B** Partial | Medium | LOW | Depends on 8 |
| 16 | Record why | Only `request_information` requires it | **B** Partial | Medium | **MEDIUM** | Require on reject / suspend / close |
| 17 | Limit repeated actions | State machine yes; no cooldowns | **B** Partial | Low | LOW | Covered by 18 |
| 18 | Concurrent conflicting actions | **Read-then-write window** | **C** Missing | **High** | LOW | Small surgical fix |
| 19 | Queues and filters | Explore rich; staff/admin thinner | **B** Partial | Low | LOW | Only if time |
| 20 | Safety notes where the risk is | Policy pages only | **C** Missing | Medium | **MEDIUM** | Four short lines |
| 21 | Idle session timeout | **Nothing configured** | **C** Missing | Medium | LOW | Absolute cap, not a short idle |
| 22 | Staff decision semantics | Correct; unevenly communicated | **B** Partial | **High** | **MEDIUM** | Same as 2 |
| 23 | Form contracts | 8 contract cases exist | **B** Partial | **High** | **MEDIUM** | **One latent bug found — see below** |
| 24 | Must not be localhost-only | Ready, not hosted | **C** Missing | **High** | **HIGH** | The single largest item |

---

## The finding this audit exists for

### `contactPreferences.showPhone` is the collar bug again

Same shape, not yet triggered.

**Stored authoritatively.** `pet_reports` has `show_phone`, `show_email` and
`allow_platform_contact`, written at `api/reports.php:215-217`.

**Never returned.** `shape_report_row()` (`reports.php:1032-1034`) returns:

```php
'accepts_messages' => (bool) $row['allow_platform_contact'],
'phone' => $row['show_phone'] ? $row['reporter_phone'] : null,
'email' => $row['show_email'] ? $row['reporter_email'] : null,
```

The *preference* is used to mask the value and is then thrown away.

**So the UI infers it.** `petService.js:52`:

```js
showPhone: Boolean(row.reporter?.phone),
```

**Where the inference breaks:** the phone number is **optional at
registration** (`RegisterPage.jsx:115`, *"Optional. Never shown on a report
unless you choose to share it."*). For an account with no phone:

```
stored show_phone = 1
→ API returns phone: null   (there is no number to return)
→ Boolean(null) = false
→ the edit form shows "do not show my phone"
→ saving writes show_phone = 0
```

A stored preference is silently flipped by an edit the user never made to that
field. Exactly the collar round trip: **authoritative value → not returned → UI
guesses → guess wrong → overwritten on save.**

`showEmail` does not have this problem: an account always has an email, so the
inference happens to hold. `allow_platform_contact` is returned properly and is
correct.

**Fix:** return `show_phone` / `show_email` on the report and read them directly
— one line in the SELECT projection, one in `fromApi`, plus two contract cases.
**LOW implementation risk, LOW demo risk** (she would have to register without a
phone, file a report, then edit it), but it is a data-integrity defect of a class
we have now agreed to distrust.

---

## Group A — fix before public hosting

Correctness and data integrity only. Nothing here is cosmetic.

### A1. `showPhone` round trip
Above. Schema: no. API: yes, one projection. Frontend: yes, one line.

### A2. State changes are read-then-write, not atomic

`api/matches.php` reads the pairing at **line 73** and opens its transaction at
**line 131** — fifty-eight lines apart, and the read is *outside* the
transaction. The update itself is unconditional:

```php
'UPDATE match_claims SET match_status = :status … WHERE match_id = :id'
```

`api/reports.php:371` is the same shape:

```php
'UPDATE pet_reports SET status = :status WHERE report_id = :id'
```

The 409 guards (`matches.php:99`, `REPORT_TRANSITIONS` in `reports.php`) are
real and correct — they just cannot see a change that lands between the read and
the write. Two coordinators confirming and rejecting the same pairing within the
same moment both pass the guard.

**Fix:** make the update carry the expectation and check it worked —

```php
… WHERE match_id = :id AND match_status = :expected
if ($statement->rowCount() === 0) json_error('That pairing has already been decided.', 409);
```

Schema: no. API: yes, three statements. Frontend: no.
**Implementation risk LOW. Demo risk LOW** — she would need two devices and
precise timing. It is in Group A because it is a correctness defect that is
cheap to close, not because she is likely to find it.

### A3. No absolute session lifetime

Nothing in `api/` sets `gc_maxlifetime` or a cookie lifetime; PHP's defaults
apply, and there is no absolute cap. An administrator session left open stays
open.

**Fix:** an absolute lifetime stored in the session and checked in
`current_user()`. **Not a short idle timeout** — somebody composing a lost-pet
description must not lose it.

Schema: no. API: yes, one check. Frontend: optional warning.

---

## Group B — before the final presentation

### B1. Public hosting  ·  the largest single item
`deployment-plan.md` §3 is the eighteen-step runbook; `npm run verify:deploy`
is the preflight. Blocked only on an account. **Demo risk HIGH** because "it
must not be localhost-only" is an expectation, not a preference.

### B2. Staff decision hierarchy and consequences  (lessons 2 + 22)

The three actions are semantically correct — `MATCH_ACTIONS` at
`matches.php:30`, role guards at `:85` and `:89`, the finality check at `:99`,
and confirming closes **both** reports inside one transaction — but they read
as three equivalent buttons.

What each actually does, which is what should be on screen:

| Action | Who | Result |
| --- | --- | --- |
| **Confirm match** | Staff | Closes **both** reports as returned, notifies both reporters. Irreversible |
| **Request more information** | Staff | Keeps the case open. **Already requires a note** (`:105`) |
| **Not the same pet** | Staff | Rejects the pairing; reports stay independently active |

**Fix:** primary / secondary / destructive treatment, and one line of
consequence under each. No redesign.

### B3. An obvious way out  (lesson 5)

Registration, login and the wizard have **no Cancel or Back to home**.
`ReportForm.jsx:256` has "Back", which moves a step backwards; at step one there
is nothing. Browser Back is the only exit.

Somebody halfway through a report who changes their mind has no marked door.
**Cheap, visible, and she may well try it.**

### B4. Reasons for consequential actions  (lesson 16)

Only `request_information` requires one. Recommended additions:

| Action | Reason | Where it belongs |
| --- | --- | --- |
| Not the same pet | Required, structured + Other | `match_claims.staff_notes` + `audit_logs.detail` |
| Suspend an account | Required, free text | `audit_logs.detail` (the row already exists) |
| Close a report | Required, structured | `status_logs.note` (the column already exists) |
| Unlock | Optional | `audit_logs.detail` |

**No schema change** — every column needed is already there.

### B5. Safety notes where the risk is  (lesson 20)

All guidance lives on `/help` and `/privacy`. Four short contextual lines:

* location step — *"An approximate area. Never your home address."*
* contact preferences — *"Only what you switch on appears on the report."*
* verification — *"Do not post proof of ownership publicly."*
* before a handover — *"Somewhere public, in daylight, with somebody else."*

Frontend only. Reads as care rather than decoration.

### B6. View mode / edit mode on the profile  (lesson 14)

`ProfilePage.jsx` renders live inputs with a Save button and no view state. A
stray keystroke edits a real account field. Worth doing **for the profile
only** — reports already edit through a deliberate route, and admin tables
already confirm before anything destructive.

---

## Group C — if time allows

* **Password UX** (7) — show/hide and a live checklist against the *real* rule
  (8–72 characters, `auth.php:256`). The frontend hint already matches the
  backend, which is the part that usually goes wrong. **No strength meter.**
* **Registration rate limiting** (6) — `login_attempts` protects sign-in;
  nothing protects sign-up. Worth a per-IP limit once hosted. **CAPTCHA only if
  the hosted site is actually abused** — it is a bot challenge, a different
  problem from rate limiting, and it adds a third-party dependency to a
  demonstration.
* **Staff and admin filters** (19) — Explore is rich; the queues are thinner.
  Only add filters that match a real task.
* **Additional contract tests** (23) — coordinates, optional nulls, dates and
  contact preferences, once A1 lands.

---

## Group D — do not implement

| | Why |
| --- | --- |
| Draft reports (13) | A new status touching Explore, matching, notifications, staff queues and the state machine, to solve a problem nobody has reported. High risk, low demo value |
| Forced scroll before consent (4) | We already have better: an unchecked box, the notice in a **new tab** so nothing is lost (`RegisterPage.jsx:150`), and a versioned row in `privacy_consents`. Forcing a scroll measures scrolling, not reading |
| Exact addresses (11) | The opposite of the design. Barangay-level approximation is a defence point, not a gap |
| Password strength meter (7) | An unexplained "Medium" tells nobody what to do. A checklist does |
| Everything dental | Pregnancy rules, service durations, appointment slots, doctor schedules, reschedule limits |

---

## Top 10 live-demo failure scenarios

Ordered by **how easily she can trigger it**, which is the only ordering that
matters on the day.

| # | What she does | Should happen | Happens now | |
| --- | --- | --- | --- | --- |
| 1 | Opens the site on her phone | It loads | **Nothing — localhost only** | **FAIL** |
| 2 | Found report, collar **No**, submit, reopen | Shows No | Shows No | **PASS** *(fixed today)* |
| 3 | Clicks into registration, changes her mind | A visible way out | Browser Back only | **FAIL** |
| 4 | "What if the user forgets their password?" | A reset flow | Nothing — an administrator edits the database | **FAIL** |
| 5 | Registers with a made-up email | Verification, or an honest answer | Account works immediately | **FAIL** *(answerable)* |
| 6 | Three wrong passwords, then the right one elsewhere | Refused; admin unlocks | Exactly that | **PASS** |
| 7 | Types `/admin` as a customer, then calls `/api/users` | Refused twice | 403 both | **PASS** |
| 8 | Changes a role while the account is open elsewhere | Next request is a customer | Exactly that | **PASS** |
| 9 | "Which of these three buttons is dangerous?" | Obvious from the screen | Three equivalent buttons | **WEAK** |
| 10 | Registers with no phone, files a report, edits it | Preference kept | **Silently switched off** | **FAIL** *(A1)* |

Six pass. Of the failures, **1, 3 and 10 are the ones she can reach without
being told where to look.**

---

## What a host must provide  (lesson 24)

From `deployment-architecture-audit.md`, now with the email question added:

| | |
| --- | --- |
| PHP | 8.1+, `pdo_mysql`, `gd`/`getimagesize` |
| Database | MySQL 5.7+ / MariaDB 10.4+ |
| Routing | `.htaccess` + `mod_rewrite`, or equivalent |
| Storage | **Writable, persistent** `api/uploads/` |
| Sessions | Ordinary file-backed sessions on one server |
| HTTPS | Free certificate |
| Config | A file outside the repository (`api/config.local.php`) |
| **SMTP** | **Only if items 8 and 9 are built.** Decide after hosting |
| Remote MySQL | Only to run `npm run audit` from a laptop |

Everything except the last two is ordinary shared hosting.

---

## What this audit did not change

No application code. No schema. No UI. The only fix made today was
`has_collar`, committed separately as `fda2d9c` before this audit began.

**Recommended order:** A1 → A2 → A3 → hosting → B2 → B3 → B4 → B5 → B6, with
items 8 and 9 decided once there is a host and we know whether it can send mail.
