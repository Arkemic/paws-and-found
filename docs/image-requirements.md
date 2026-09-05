# Image Requirements

Every visual asset the interface needs.

**The rule (CLAUDE.md §18):** do not generate, download, or permanently select
imagery without explicit approval. When implementation needs an image that does
not exist, add a row here, render a neutral placeholder, and carry on — never
change a layout just because an asset is missing.

**Status values:** `Needed` · `Approved` (brief agreed) · `In progress` ·
`Delivered` (file in `src/assets/` and wired up)

_Last updated: second report batch and workspace design pass — 2026-08-30_

## Delivered

Assets in `src/assets/` and wired up.

| ID | File | Used by | Status |
| --- | --- | --- | --- |
| IMG-001 | ~~`pawsfound-hero-aspin-tilapia.png`~~ | Superseded by IMG-006; file deleted | Retired |
| IMG-002 | `pawsfound-logo-mark.png` | Navbar brand; copied to `public/favicon.png` | Delivered |
| IMG-003 | `empty-no-reports.png` | `EmptyState` illustration, homepage and Explore | Delivered |
| IMG-004 | `pet-photo-placeholder.png` | `PetCard`, when a report has no photo | Delivered |
| IMG-005 | `pet-0NN-*.jpg` (24 files) | Every seeded report | Delivered |
| IMG-006 | `img-006-homepage-hero.jpg` | Homepage hero | Delivered |
| IMG-007 | `img-007-about-intro.jpg` | About — "Why Paws&Found exists" | Delivered |
| IMG-008 | `img-008-explore-header-illustration.jpg` | Explore — the whole header band | Delivered |

IMG-006 was replaced with a second version in the homepage refinement pass. The
first had its subjects hard right of frame, which only worked when text shared
the photograph; the layout puts the image in its own column, so that left third
was wasted. The replacement centres the dog and cat, is 1586x992 (ratio 1.599,
so the `aspect-16/10` frame crops nothing), and uses the default centre object
position. The filename is unchanged — there is one canonical hero asset.

The logo is a transparent PNG. IMG-001 was the original homepage hero; IMG-006
replaced it in the redesign and the file has been deleted.

## Still needed

| ID | File | Used by | Priority | Status |
| --- | --- | --- | --- | --- |
| IMG-011 | `pet-025-chico.jpg` … `pet-032-dog.jpg` (8 files) | The second batch of seeded reports | High | Needed |
| IMG-012 | `img-012-help-header-illustration.jpg` | Help — the header band, matching IMG-008 | Low | Needed |

### IMG-011 — the second batch of pet photographs

Eight reports were added on 2026-08-30 so the demonstration does not open on a
page where the newest case is a fortnight old. They currently render the neutral
placeholder (IMG-004), which is correct behaviour but leaves eight paw prints in
a row on Explore.

Same treatment as IMG-005: **800x600 JPEG, quality 82**, and the rule from §18
still applies — these should look like a phone photograph of a Philippine street
or house, not a studio portrait. No identifiable people.

| File | Report | Subject |
| --- | --- | --- |
| `pet-025-chico.jpg` | 025 lost | Medium brown-and-white aspin, **white blaze down the muzzle, white front socks, kink at the tail tip** |
| `pet-026-dog.jpg` | 026 found | **The same dog as 025**, different setting and angle — this pair is the fresh matching demo, so the markings must read as the same animal without being the same photograph |
| `pet-027-pilo.jpg` | 027 lost | Small orange tabby, white chest and chin, notch in the right ear |
| `pet-028-cat.jpg` | 028 found | Small long-haired grey-and-white cat, bushy tail, thin blue collar with no tag |
| `pet-029-sabel.jpg` | 029 lost | Medium tricolour beagle, white tail tip, red collar with a small brass bell |
| `pet-030-rabbit.jpg` | 030 found | Small white lop-eared rabbit, grey ears, grey patch over one eye, in a cage |
| `pet-031-tuna.jpg` | 031 lost | Medium cream Persian, flat face, one watering eye, coat shaved along the back |
| `pet-032-dog.jpg` | 032 found | Small white-and-grey shih tzu, badly matted coat, visibly been outdoors a while |

When the files land in `src/assets/`, add the `photos` entries to reports 025-032
in `src/mock/petReports.js`, re-run `node scripts/gen-seed.mjs`, and re-import
`database/seed.sql`.

### IMG-012 — a Help header band

Optional. The Help page currently leads with the logo mark as artwork, which
works but makes it the only public page without a photograph or an
illustration of its own. If it is ever produced it should be the same 3:1 flat
vector band as IMG-008, with the left half kept light for type — see the notes
below, which apply unchanged.

## IMG-008 — the one illustrated asset

Every other asset is a photograph; IMG-008 is flat vector-style artwork, and it
is **the entire band**, not a cut-out pasted onto a coloured panel. The
cream-to-teal wave, the leaves, the hearts and the two animals are one 3:1
image (2172x724) with the left half deliberately left clear for type.

Three things follow, and any replacement has to respect them:

- **The left half must stay light.** Measured against `fg-muted`, the artwork is
  AA-safe out to 60% of the width on the title row and 50% on the description
  row. Past that it darkens into the teal wave. The text block is capped at half
  the band for this reason, and the band's description uses full-strength `fg`
  rather than `fg-muted`, because the mobile fallback tint cannot reach AA at
  any usable strength.
- **It only composes wide.** `object-cover` in a band narrower than three times
  its height crops horizontally, and the cat is the first thing lost. The image
  is therefore shown from `md` up; below that the band keeps its tint and the
  type has it to itself.
- **Vertical crop is fine.** At 1216x272 the band shows source rows 119-605,
  which keeps both animals, the hearts and the leaves whole.

Introducing it makes Explore the only illustrated page in a photograph-led
system. About and Help will eventually look unfinished beside it unless they
get the same treatment — a decision for the team, not a defect.

## Placeholder behaviour

Seeded reports carry `photos[].url === null` and real `alt` text. `PetCard`
falls back to IMG-004 and announces it as "No photo was provided for this
report" — the report's own alt text is not reused for a generic placeholder,
because it would describe a pet the image does not show.

Reports created through the form carry a `blob:` object URL instead, and do
render the reporter's own photo and description.

## Note on file size

IMG-006 was supplied as a 2.1 MB PNG and converted the same way: 1600px wide
JPEG, **214 KB**. Its frame is `aspect-16/10`, matching the source ratio exactly
so nothing is cropped — the cat sits near the right edge and a 4:3 frame was
taking 8% off each side.

The 24 pet photographs were supplied as 1448x1086 PNGs totalling **58 MB** —
enough to make the Explore page, which shows all 24 at once, unusable on a
phone. They were resized to 800x600 and converted to progressive JPEG at
quality 82: **58 MB down to 2.2 MB**, no visible loss at the sizes they are
displayed. IMG-007 arrived as a 2.3 MB 1254x1254 PNG and was converted the same way:
800x800 JPEG, **117 KB**. It is displayed at 384px, so the source is a 2.1x
retina target — and it is capped at that width, because between `sm` and `lg`
an uncapped `w-full` stretched it to 903px and upscaled it past its own source.

The 24 original PNGs have since been moved out of `src/assets/`, along with the
unused `img-006-homepage-hero.png` original (2.1 MB) and the retired IMG-001
hero (1.7 MB). `src/assets/` is now **3.2 MB**. The originals have been deleted at the team's request; the files in `src/assets/` are now the only copies.

Three brand PNGs remain unoptimised: `pawsfound-logo-mark.png` (564 KB),
`pet-photo-placeholder.png` (800 KB) and `empty-no-reports.png` (1.3 MB). The
logo needs transparency so it has to stay PNG, but resizing would cut most of
the weight. Not done without approval, since it alters supplied files.
