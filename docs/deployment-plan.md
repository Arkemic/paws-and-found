# Paws&Found — deployment plan

**Written:** 25 September 2026 · ITS122P–AM5 · Group 3
**Why now:** the final presentation has to run from a real URL, on three
devices at once, against one database. That is a different problem from
`npm run dev`, and it has a few decisions in it that are painful to change
late.

Nothing here is deployed yet. This is the plan and the list of code changes it
needs.

---

## 1. The decision

**Shared cPanel hosting — Apache, PHP 8.2, MySQL, phpMyAdmin — with the built
site and the API on the same origin.**

### Why this and not something cleverer

The system is Apache + PHP + MySQL with `.htaccess` rewrites and a local
uploads folder. Shared cPanel hosting **is** that, which means the production
environment is the same shape as XAMPP and the deployment is a file copy plus a
database import. Nothing has to be rewritten, containerised or explained.

| Considered | Why not |
| --- | --- |
| Railway / Render / Fly.io | Container-based. PHP works, but it means a Dockerfile, a separate managed MySQL, and an ephemeral filesystem that would lose uploaded photographs on every restart. More moving parts to defend, and one of them eats our pet photos. |
| AWS / Google Cloud free tier | A card on file, IAM, security groups, and a bill if we forget to tear it down. Vastly more than this needs. |
| Vercel / Netlify | Static and serverless-JS hosts. They do not run PHP. Splitting frontend and backend across two origins would drag CORS and third-party-cookie problems into the one demonstration where a session has to work on three devices. |
| GitHub Pages | Static only. No PHP, no MySQL. |

### Same origin, and why it matters more than it sounds

The built site goes at the **domain root** and the API sits at **`/api`** under
it:

    https://<our-domain>/            →  index.html  (the React build)
    https://<our-domain>/assets/…    →  hashed JS and CSS
    https://<our-domain>/api/…       →  the PHP API
    https://<our-domain>/api/uploads/…  →  pet photographs

One origin means:

* **No CORS.** `send_cors_headers()` becomes dead weight in production; it
  exists for `npm run dev` only.
* **The session cookie just works.** No `SameSite=None`, no third-party-cookie
  blocking, and our existing `SameSite=Lax` stays as a real CSRF defence
  alongside the token.
* **One thing to type** into three devices.

This is the single most important deployment decision and it costs nothing to
take now.

### Paid or free

**Pay, and keep a free account as the rehearsal and the fallback.**

A month of entry-level shared hosting is roughly ₱100–300. The free hosts
(InfinityFree, AwardSpace and similar) do genuinely run PHP, MySQL and free
SSL, and Paws&Found is small enough for any of them — 32 reports, 10 accounts,
modest images.

The specific risk is not size, it is what free hosts do to *automated*
requests. Several of them answer a request that does not look like a browser
with an HTML interstitial — a JavaScript challenge or a "checking your
browser" page — instead of the response. For an ordinary page view that is
invisible. For a REST API it means `fetch` receives HTML where it expected
JSON, and our own `audit_cases.py` suite cannot run against the deployed site
at all. That is exactly the evidence we need on presentation day.

So: register the free account now and deploy to it first, because getting the
process right is worth doing on something that costs nothing. Then verify on
it, specifically:

* `https://<subdomain>/api/reports` returns **JSON**, not HTML, from `curl`;
* signing in works and survives a reload;
* the same account works on three devices at once.

If all three hold after a few days of use, keep it. If any of them wobbles,
move to the paid host — and find that out a week early rather than in front of
the person grading us.

Whoever we pick must be confirmed to have: **PHP 8.1+**, **MySQL 5.7+ or
MariaDB 10.4+**, **phpMyAdmin**, **`.htaccess` with `mod_rewrite`**, **free
SSL (Let's Encrypt)**, and **at least ~1 GB** of storage.

Have the free account registered as a **fallback** before the day, even if
unused.

---

## 2. What the code needs before it can go anywhere

**Done, 25 September 2026.** All six are in and verified; the list below now
describes what exists rather than what is wanted. Deploying is a file copy plus
one config file.

### 2.1 `vite.config.js` — the base path  ·  **done**

    npm run build           ->  /pawsandfound/   (local Apache, and the a11y run)
    npm run build:deploy    ->  /               (a deployed host)

`build:deploy` is a four-line Node script rather than
`VITE_BASE=/ npm run build`, because in Git Bash on Windows that does not work:
MSYS rewrites the bare `/` into the Git installation path and the build comes
out asking for `/Program Files/Git/assets/…`. Verified both ways — the symptom
is a blank page with four 404s, which is a miserable thing to meet on
deployment day.

`src/services/api.js` already derives the API path from
`import.meta.env.BASE_URL`, so nothing else changes.

### 2.2 `public/.htaccess` — `RewriteBase`  ·  **documented, one line to change**

    RewriteBase /pawsandfound/      ->      RewriteBase /

It must match the base the site was built with. **These two disagreeing is the
most likely way a first deploy fails**, so the file now says so directly above
the line, with both settings written out.

### 2.3 `api/config.php` — credentials  ·  **done**

`config.php` now reads `api/config.local.php` first when one exists, and every
default below it steps aside for whatever that file defined. Nothing else in
the API changed — the constants have the same names and the same meanings.

`api/config.example.php` is the tracked template; `api/config.local.php` is in
`.gitignore` and must stay there. Verified both ways: the API works with no
local file, and picks the file up when there is one.

The hosted database gets **its own user**, not `root`, with rights on the
`pawsandfound` schema only.

### 2.4 Session cookies and `Secure`  ·  **done**

Set from how the request actually arrived, not from a constant — a Secure
cookie is never sent back over plain HTTP, so hard-coding it true breaks every
sign-in on a laptop, and hard-coding it false ships the session cookie
unprotected on the deployed site.

`request_is_https()` also accepts `X-Forwarded-Proto`, because shared hosts
routinely terminate TLS at a proxy and hand plain HTTP to PHP — without it the
cookie would be left insecure on a site that is plainly padlocked in the
browser.

### 2.5 Errors must not be displayed in production  ·  **done**

`config.php` switches on `APP_ENV`: production turns `display_errors` off and
`log_errors` on; development turns them the other way. A warning printed into
a JSON response breaks the JSON *and* puts our file paths on somebody's
screen, and many shared hosts leave `display_errors` on by default.

`api/index.php` already caught `PDOException`; this closes the gap for
everything that is not one.

### 2.6 The uploads folder

`api/uploads/` must exist and be writable (755, or 775 if the host needs it),
and `api/uploads/.htaccess` **must** be uploaded with it — it is what stops an
uploaded file being executed. It is tracked in git and excluded from
`.gitignore`'s upload rule, so it will be in the archive; the thing to check is
that the FTP client did not skip it for being a dotfile.

Photographs uploaded during the demonstration live only on the server. They are
not in git and not in the backup unless we take one.

---

## 3. The deployment itself

Roughly 45 minutes the first time, 5 minutes for every redeploy after.

**Database**
1. In cPanel, create the database, create a user, grant it all privileges on
   that database. Note all three values.
2. phpMyAdmin → import `database/schema.sql`, then `database/seed.sql`.
   `schema.sql` opens with `CREATE DATABASE IF NOT EXISTS pawsandfound` and
   `USE pawsandfound` — on a host where the database is named
   `username_pawsandfound`, both lines have to be removed or edited first, and
   the import run against the already-selected database.
3. Verify: 15 tables, and `SELECT COUNT(*) FROM pet_reports` returns **32**.

**API**
4. Upload `api/` to `public_html/api/`.
5. Create `api/config.local.php` with the host's database name, user, password,
   `localhost` as the host and `3306` as the port. Never 3307 — that is a
   quirk of one laptop.
6. Verify: `https://<domain>/api/reports` returns JSON.

**Frontend**
7. `npm run build:deploy`
8. Upload the contents of `dist/` — not the folder — into `public_html/`,
   including `.htaccess` with `RewriteBase /`.
9. Verify: the homepage loads, Explore lists reports, a report detail opens.

**HTTPS**
10. cPanel → SSL/TLS Status → run AutoSSL, or install the free Let's Encrypt
    certificate. Then force HTTPS (cPanel has a toggle, or add the redirect to
    `.htaccess`).
11. Verify: `http://` redirects to `https://`, and signing in then reloading
    keeps you signed in — that proves the `Secure` cookie is being set and
    returned.

**Then the eight tests**
12. Run the multi-device tests (A–H) from the hardening brief against the live
    URL, on three real devices. Not on one laptop with three tabs — tabs share
    a cookie jar, which is the one thing the test is not about.

---

## 4. Presentation-day runbook

**The night before**
* Export the database from phpMyAdmin (structure **and** data) and keep the
  `.sql` file on two machines.
* Download `api/uploads/` if any demonstration photographs were uploaded to it.
* Confirm the certificate is valid and not expiring.
* Open the URL on all three devices and sign in on each.
* Screenshot the working system, as proof it worked if the venue's network
  does not.

**Resetting to a known state**
Re-import `database/seed.sql` through phpMyAdmin. It clears and reinserts in
dependency order, including `audit_logs`, `login_attempts` and
`privacy_consents`, so the system comes back to exactly 32 reports, 10
accounts, an empty audit log and no lock counters. There is deliberately **no
web endpoint that does this** — a public reset button is a public delete
button.

**If the site is down on the day**
1. XAMPP on a laptop, with the other two devices joined to a phone hotspot and
   pointed at that laptop's LAN address. Requires `ALLOWED_ORIGINS` to have
   been widened beforehand, and the cookie `Secure` flag resolves to false over
   plain HTTP, so it still works.
2. Failing that, the screenshots and a local walkthrough.

Decide which of us owns the hotspot before the day, not during it.

---

## 5. What is likely to go wrong, and what it looks like

| Symptom | Cause |
| --- | --- |
| Blank page, 404s on `/assets/…` | `VITE_BASE` and `RewriteBase` disagree. |
| Homepage loads, every API call 404s | `api/` not uploaded, or the API's own `.htaccess` missing, or `mod_rewrite` off. |
| API returns HTML, not JSON | PHP error being displayed — §2.5 was skipped. |
| "The server could not complete that request" | Database credentials wrong in `config.local.php`. The real reason is in the host's error log. |
| Signed in, then signed out on reload | Cookie not coming back: mixed HTTP/HTTPS, or `Secure` set while serving over HTTP. |
| Photographs upload but do not display | `api/uploads/` not writable, or its `.htaccess` blocked the file type. |
| Everything works alone, breaks on a second device | Two databases, or two deployments. There must be exactly one of each. |

---

## 6. Who does what

| Task | Owner |
| --- | --- |
| Choose and buy the hosting | Kyle (PM) |
| Database creation, import, credentials | Dominic (Database/API) |
| API upload and `config.local.php` | Heinz (Backend) |
| Frontend build and upload | Calvin (Frontend) |
| HTTPS, then the eight multi-device tests | Francezka (QA/Security) |

Deploy **at least a week** before the presentation. The first deployment always
finds something, and finding it the night before is how a working system fails
in front of an examiner.

---

## 7. Open questions

1. **Which host, and who pays?** Needs deciding first; everything else waits on
   the credentials.
2. **Domain name.** A free subdomain from the host is fine and free. A `.com`
   is roughly ₱600/year and looks better on the title slide. Not a technical
   decision.
3. **Does the demonstration data go live?** Recommended yes — the system is
   unconvincing with an empty database, and every person and pet in it is
   fictional. The seeded accounts share one weak password, so the live site
   must not be shared beyond the class while they exist.
