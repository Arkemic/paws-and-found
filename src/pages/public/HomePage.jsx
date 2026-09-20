import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  Bird,
  Cat,
  ClipboardList,
  Dog,
  Eye,
  Handshake,
  Heart,
  Lock,
  MapPin,
  PawPrint,
  Rabbit,
  Scale,
  Search,
  SearchCheck,
  ShieldCheck,
  TriangleAlert,
} from 'lucide-react'
import heroImage from '@/assets/img-006-homepage-hero.jpg'
import reunionImage from '@/assets/img-015-reunion-home.jpg'
import emptyReportsImage from '@/assets/empty-no-reports.png'
import photoPlaceholder from '@/assets/pet-photo-placeholder.png'
import { Button, Container, EmptyState, LoadingSkeleton, Select } from '@/components/ui'
import { PatternVeil, WovenVeil } from '@/components/PatternVeil'
import { RadarOrnament, RouteOrnament } from '@/components/Ornament'
import { SectionCurve } from '@/components/SectionCurve'
import { PetCard } from '@/components/PetCard'
import { SectionHeading } from '@/components/SectionHeading'
import { REPORT_STATUSES, REPORT_TYPE_LABELS, speciesLabel } from '@/constants'
import { useAsync } from '@/hooks/useAsync'
import { categoryService, petService } from '@/services'
import { optionsFromLabels } from '@/utils/options'
import { formatDate } from '@/utils/date'
import { cn } from '@/utils/cn'

/**
 * Public homepage.
 *
 * This is the page a stranger lands on while their pet is missing, so it leads
 * with the two things they might need to do and proves the system works —
 * real recent reports, real reunions — rather than describing itself.
 *
 * The composition, top to bottom: an urgent line, one raised panel holding the
 * headline, the photograph, what the system promises and the search; a row of
 * species to jump straight into; then chapters that alternate between the warm
 * canvas, a pale teal band and a warm cream one. Everything on it is drawn from
 * the real reports — there are no invented numbers and no invented testimonials.
 */
export function HomePage() {
  return (
    <>
      <title>Paws&Found — Lost and Found Pets</title>

      {/* RootLayout pads <main>; the homepage runs its own full-bleed bands
          right up to the header and footer, so that padding is cancelled. */}
      <div className="-my-8 flex flex-col">
        {/* The richest environment on the site: two brand glows, the route
            pattern, and a search sweep running off the top-right corner. The
            hero panel is the foreground object standing on it. */}
        <div className="hero-ground relative isolate overflow-hidden pb-4">
          <PatternVeil />
          <RadarOrnament tone="teal" size={620} className="-top-40 -right-56 lg:-right-40" />
          <RouteOrnament tone="amber" size={420} className="-bottom-10 -left-32" />
          <UrgentLine />
          <Hero />
          <SpeciesRow />
          <SectionCurve to="surface" />
        </div>

        <RecentReports />
        <CommunityNumbers />
        <HowItWorks />
        <Reunions />
        <Safety />
        <ClosingCall />
      </div>
    </>
  )
}

/**
 * The first line on the page, for the person who arrived in a hurry: what to
 * do, and how long it takes. Above the headline because for them it matters
 * more than the headline does.
 */
function UrgentLine() {
  return (
    <Container className="pt-6 sm:pt-8">
      <p className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-sm text-fg-muted">
        <span className="inline-flex items-center gap-2 rounded-pill bg-accent-soft px-3 py-1 font-medium text-lost">
          <span className="size-1.5 rounded-full bg-accent-hover" aria-hidden="true" />
          Lost a pet today?
        </span>
        Filing a report takes a few minutes, and it starts being compared against found
        reports straight away.
        <Link to="/report/lost" className="font-medium text-brand hover:underline">
          Report a lost pet
        </Link>
      </p>
    </Container>
  )
}

/** What the page can say about itself, counted from the real reports. */
const loadHeroStats = async () => {
  const reports = await petService.getReports()
  return {
    total: reports.length,
    reunited: reports.filter((report) => report.status === REPORT_STATUSES.RETURNED).length,
    cities: new Set(reports.map((report) => report.location.city)).size,
    species: new Set(reports.map((report) => report.species)).size,
  }
}

/** Three things the system actually does, over the photograph. */
const PROMISES = [
  {
    icon: Scale,
    title: 'Every match explains itself',
    body: 'You see which details lined up and which did not.',
  },
  {
    icon: ShieldCheck,
    title: 'A coordinator checks first',
    body: 'Ownership is verified before a handover is arranged.',
  },
  {
    icon: Lock,
    title: 'Your details stay private',
    body: 'Contact information is never on a public report.',
  },
]

/**
 * One raised panel holding the whole opening: the headline and the two things
 * you might have come to do on the left, the photograph filling the right, and
 * the search across the bottom.
 *
 * It is one object rather than text beside an image — which is what lets the
 * page have a foreground standing on a background instead of two columns.
 */
function Hero() {
  return (
    <section className="pt-6 pb-8 sm:pt-8">
      <Container>
        <div className="overflow-hidden rounded-[1.75rem] border border-border/70 bg-panel/80 shadow-raised backdrop-blur-sm">
          <div className="grid lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
            <div className="flex flex-col items-start gap-6 p-6 sm:p-10 lg:py-14">
              <h1 className="text-[2.75rem] leading-[1.04] font-semibold tracking-tight text-balance text-fg sm:text-[3.5rem] xl:text-[3.85rem]">
                Every lost pet has someone looking for them.
              </h1>

              <p className="max-w-lg text-lg leading-relaxed text-fg-muted">
                Lost and found reports in one place, compared on the details that identify
                a pet — so the search stops depending on who saw which post.
              </p>

              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Button as={Link} to="/report/lost" variant="accent" size="lg">
                  <TriangleAlert size={18} aria-hidden="true" />
                  Report a lost pet
                </Button>
                <Button as={Link} to="/report/found" variant="primary" size="lg">
                  <PawPrint size={18} aria-hidden="true" />
                  I found a pet
                </Button>
              </div>
            </div>

            {/* IMG-006, filling its half of the panel and bleeding to the
                edges. The subjects are centred in the frame, so the crop keeps
                both animals in view at every width. */}
            <div className="relative sm:min-h-[26rem] lg:min-h-full">
              <img
                src={heroImage}
                alt="A tan Aspin sitting beside its owner, who is holding a tabby cat, on the tiled porch of a Philippine home"
                // Framed left of centre: the dog is the left two-thirds of the
                // source, and a centre crop in a tall column put the tiled
                // floor between the animals in the middle of the panel.
                className="h-72 w-full object-cover object-[38%_45%] sm:absolute sm:inset-0 sm:h-full"
                fetchPriority="high"
              />
            </div>
          </div>

          {/* What the system promises, on a strip of its own between the
              photograph and the search. It used to float over the picture,
              where it covered the dog — the photograph is the point of this
              panel, so nothing sits on top of it. */}
          <ul className="grid gap-x-6 gap-y-4 border-t border-border/70 bg-panel/70 px-6 py-5 sm:px-10 md:grid-cols-3">
            {PROMISES.map((promise) => {
              const Icon = promise.icon

              return (
                <li key={promise.title} className="flex items-start gap-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-control bg-brand-soft text-brand">
                    <Icon size={17} aria-hidden="true" />
                  </span>
                  <span className="flex min-w-0 flex-col">
                    <span className="text-sm font-semibold text-fg">{promise.title}</span>
                    <span className="text-sm text-fg-muted">{promise.body}</span>
                  </span>
                </li>
              )
            })}
          </ul>

          {/* The search sits inside the panel, along its bottom edge: looking
              is the third thing somebody might have come to do, and it belongs
              with the other two rather than in a section of its own. */}
          <SearchBand />
        </div>
      </Container>
    </section>
  )
}

/** Lucide has a face for the species we actually carry; anything else gets a paw. */
const SPECIES_ICONS = { dog: Dog, cat: Cat, bird: Bird, rabbit: Rabbit }

/**
 * Straight into Explore, filtered. The reference shops open with a row of
 * departments; the equivalent here is the animal somebody is looking for.
 */
function SpeciesRow() {
  const { data: categories } = useAsync(loadActiveCategories)
  if (!categories) return null

  // Dogs and cats first, because that is most of what gets reported, and
  // "Other" left out: it is the catch-all on the report form, not somewhere
  // anybody sets out to browse.
  const order = ['dog', 'cat']
  const shown = categories
    .filter((category) => category.id !== 'other')
    .sort((a, b) => {
      const rank = (id) => (order.indexOf(id) === -1 ? order.length : order.indexOf(id))
      return rank(a.id) - rank(b.id) || a.label.localeCompare(b.label)
    })

  return (
    <Container className="pb-10 sm:pb-14">
      <ul className="flex flex-wrap items-center gap-2.5 sm:gap-3">
        <li>
          <Link
            to="/explore"
            className="inline-flex items-center gap-2 rounded-pill border border-border-strong bg-panel px-4 py-2 text-sm font-medium text-fg shadow-card transition-colors hover:bg-surface-muted"
          >
            <Search size={15} className="text-brand" aria-hidden="true" />
            All reports
          </Link>
        </li>
        {shown.map((category) => {
          const Icon = SPECIES_ICONS[category.id] ?? PawPrint

          return (
            <li key={category.id}>
              <Link
                to={`/explore?species=${category.id}`}
                className="inline-flex items-center gap-2 rounded-pill border border-border-strong bg-panel px-4 py-2 text-sm font-medium text-fg shadow-card transition-colors hover:bg-surface-muted"
              >
                <Icon size={15} className="text-brand" aria-hidden="true" />
                {category.label}
              </Link>
            </li>
          )
        })}
      </ul>
    </Container>
  )
}

/**
 * The numbers, counted from the reports themselves rather than written into
 * the page — if the seed changes, these change with it.
 */
function CommunityNumbers() {
  const { data: stats } = useAsync(loadHeroStats)
  if (!stats) return null

  const figures = [
    { value: stats.total, label: 'reports filed', icon: ClipboardList },
    { value: stats.reunited, label: 'pets back home', icon: Heart },
    { value: stats.cities, label: 'cities covered', icon: MapPin },
    { value: stats.species, label: 'kinds of animal', icon: PawPrint },
  ]

  return (
    <section className="pb-16 sm:pb-20">
      <Container>
        <ul className="grid grid-cols-2 gap-3 rounded-card bg-sunken/70 p-4 sm:gap-4 sm:p-6 lg:grid-cols-4">
          {figures.map((figure) => {
            const Icon = figure.icon

            return (
              <li
                key={figure.label}
                className="flex items-center gap-3.5 rounded-card border border-border bg-panel px-4 py-4 shadow-card"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-control bg-brand-soft text-brand">
                  <Icon size={19} aria-hidden="true" />
                </span>
                <span className="flex min-w-0 flex-col">
                  <span className="text-[1.75rem] leading-none font-semibold text-fg tabular-nums">
                    {figure.value}
                  </span>
                  <span className="mt-1 text-sm text-fg-muted">{figure.label}</span>
                </span>
              </li>
            )
          })}
        </ul>
      </Container>
    </section>
  )
}

/** The last thing on the page is the first thing somebody came to do. */
function ClosingCall() {
  return (
    <section className="relative isolate overflow-hidden bg-brand px-0 py-14 text-fg-inverted sm:py-16">
      <RouteOrnament tone="teal" size={560} className="-top-16 -right-32 opacity-40" />
      <Container className="flex flex-col items-start gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-xl">
          <h2 className="text-[1.75rem] leading-tight font-semibold text-balance sm:text-[2rem]">
            A report is the fastest thing you can do right now.
          </h2>
          <p className="mt-2 text-[1.0625rem] text-fg-inverted">
            Lost or found, it goes into the same place and starts being compared against
            everything else that has been reported.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button as={Link} to="/report/lost" variant="accent" size="lg">
            <TriangleAlert size={18} aria-hidden="true" />
            Report a lost pet
          </Button>
          <Button
            as={Link}
            to="/report/found"
            size="lg"
            className="border border-white/70 bg-white/10 text-fg-inverted hover:bg-white/20"
          >
            <PawPrint size={18} aria-hidden="true" />
            I found a pet
          </Button>
        </div>
      </Container>
    </section>
  )
}

const loadActiveCategories = () => categoryService.getActiveCategories()

/**
 * Quick search.
 *
 * Hands off to Explore through the URL rather than duplicating the filter
 * logic, so there is still one search implementation and the result is
 * shareable.
 */
function SearchBand() {
  const navigate = useNavigate()
  const { data: categories } = useAsync(loadActiveCategories)
  const [species, setSpecies] = useState('')
  const [city, setCity] = useState('')
  const [type, setType] = useState('')

  const submit = (event) => {
    event.preventDefault()

    const params = new URLSearchParams()
    if (species) params.set('species', species)
    if (city.trim()) params.set('city', city.trim())
    if (type) params.set('type', type)

    navigate(`/explore${params.toString() ? `?${params}` : ''}`)
  }

  return (
    // Inside the hero panel now, along its bottom edge, so looking for a pet
    // sits with reporting one instead of in a section of its own.
    <div className="border-t border-border/70 bg-surface/70">
      <form onSubmit={submit} className="p-6 sm:p-8">
        <div className="flex items-center gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand">
            <SearchCheck size={20} aria-hidden="true" />
          </span>
          <h2 className="text-xl font-semibold text-fg">Find or report a pet near you</h2>
        </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_1fr_1fr_auto] lg:items-end">
            <Select
              label="Species"
              value={species}
              onChange={(event) => setSpecies(event.target.value)}
              options={[
                { value: '', label: 'All species' },
                ...(categories ?? []).map((c) => ({ value: c.id, label: c.label })),
              ]}
            />

            <div className="flex flex-col gap-1.5">
              <label htmlFor="home-city" className="text-sm font-medium text-fg">
                Location
              </label>
              <div className="relative">
                <MapPin
                  size={17}
                  className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-fg-subtle"
                  aria-hidden="true"
                />
                <input
                  id="home-city"
                  value={city}
                  onChange={(event) => setCity(event.target.value)}
                  placeholder="City or barangay"
                  className="h-11 w-full rounded-control border border-border-strong bg-panel pr-3 pl-10 text-base text-fg placeholder:text-fg-muted"
                />
              </div>
            </div>

            <Select
              label="Type"
              value={type}
              onChange={(event) => setType(event.target.value)}
              options={[
                { value: '', label: 'Lost & found' },
                ...optionsFromLabels(REPORT_TYPE_LABELS),
              ]}
            />

            <Button type="submit" size="lg" className="lg:mb-0.5 lg:min-w-38">
              <Search size={18} aria-hidden="true" />
              Search
            </Button>
          </div>
      </form>
    </div>
  )
}

const loadRecentReports = () => petService.getRecentReports(4)

function RecentReports() {
  const { data: reports, error, isLoading } = useAsync(loadRecentReports)

  return (
    <section className="pb-16 sm:pb-24">
      {/* A sunken well behind the grid: the canvas dips, the cards stay white,
          and the group reads as one collection without another card around it. */}
      <Container className="flex flex-col gap-6">
        <SectionHeading
          title="Recently reported"
          description="The newest lost and found reports from the community."
          action={
            <Link
              to="/explore"
              className="inline-flex items-center gap-1.5 font-medium text-brand hover:text-brand-hover hover:underline"
            >
              View all reports
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          }
        />

        {isLoading && (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4" aria-busy="true">
            <span className="sr-only">Loading recent reports…</span>
            {Array.from({ length: 4 }, (_, index) => (
              <div key={index} className="rounded-card border border-border bg-panel p-4">
                <LoadingSkeleton className="mb-4 aspect-4/3 w-full" />
                <LoadingSkeleton lines={3} />
              </div>
            ))}
          </div>
        )}

        {error && (
          <p role="alert" className="text-danger">
            Recent reports could not be loaded: {error.message}
          </p>
        )}

        {!isLoading && !error && reports?.length === 0 && (
          <EmptyState
            illustration={emptyReportsImage}
            title="No reports yet"
            description="When someone files a lost or found report, it will appear here."
            action={
              <Button as={Link} to="/report/lost" variant="accent">
                Report a lost pet
              </Button>
            }
          />
        )}

        {/* A sunken well behind the grid: the canvas dips, the cards stay
            white, and the group reads as one collection without another card
            drawn around it. */}
        {!isLoading && !error && reports?.length > 0 && (
          <ul className="grid gap-5 rounded-card bg-sunken/70 p-4 sm:grid-cols-2 sm:p-5 xl:grid-cols-4">
            {reports.map((report) => (
              <li key={report.id} className="flex">
                <PetCard report={report} className="w-full" />
              </li>
            ))}
          </ul>
        )}
      </Container>
    </section>
  )
}

const STEPS = [
  {
    icon: ClipboardList,
    title: 'File a report',
    body: 'Share the species, breed, colour, size and markings, plus the date and area.',
  },
  {
    icon: SearchCheck,
    title: 'Get possible matches',
    body: 'Lost and found reports are compared on characteristics and location to find leads.',
  },
  {
    icon: ShieldCheck,
    title: 'Verify with a coordinator',
    body: 'A Pet Coordinator reviews both reports and helps confirm ownership securely.',
  },
  {
    icon: Handshake,
    title: 'Bring them home',
    body: 'Once verified, both reports are closed and another reunion story begins.',
  },
]

function HowItWorks() {
  return (
    // A compact band: the four steps are a reference, not the reason anyone
    // came. The padding was spending more height than the content did.
    <section className="relative isolate overflow-hidden bg-surface-alt py-12 sm:py-16">
      {/* The one band where the routes should be legible: this section is the
          search journey, so the pattern comes closer and the four steps are
          joined by a route rather than a dotted rule. */}
      <PatternVeil scale="near" fade={false} className="opacity-90" />
      <RadarOrnament tone="teal" size={460} className="-bottom-40 -left-40" />
      <Container className="flex flex-col gap-8">
        <SectionHeading
          title="How Paws&Found works"
          description="Four steps from a missing pet to a confirmed reunion."
          centered
        />

        <div className="relative">
          {/* The journey itself, drawn once across the row: a route that dips
              and rises between the four stops rather than three straight
              rules. Desktop only — stacked steps have nothing to connect. */}
          <svg
            aria-hidden="true"
            viewBox="0 0 1200 120"
            preserveAspectRatio="none"
            className="pointer-events-none absolute top-6 left-0 hidden h-20 w-full lg:block"
          >
            <path
              d="M150 44C300 44 330 92 450 92s180-64 300-64 180 56 300 56"
              fill="none"
              stroke="#0e5d5b"
              strokeOpacity="0.2"
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray="2 9"
            />
          </svg>

          <ol className="relative grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
          {STEPS.map((step) => {
            const Icon = step.icon

            return (
              <li key={step.title} className="relative flex flex-col items-center text-center">

                <span className="relative z-10 flex size-20 items-center justify-center rounded-full border border-border bg-panel text-brand shadow-card">
                  <Icon size={32} aria-hidden="true" />
                </span>

                <h3 className="mt-4 flex items-center gap-2 text-lg font-semibold text-fg">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-brand text-xs text-fg-inverted">
                    {STEPS.indexOf(step) + 1}
                  </span>
                  {step.title}
                </h3>

                <p className="mt-1.5 max-w-56 text-fg-muted">{step.body}</p>
              </li>
            )
          })}
          </ol>
        </div>
      </Container>

      <SectionCurve to="warm-band" flip />
    </section>
  )
}

/**
 * Real reunions, from the seed data.
 *
 * Deliberately not invented testimonials: these are reports that actually
 * reached `returned`, with their own photographs, so the section cannot drift
 * away from what the system did.
 */
const loadReunions = async () => {
  const reports = await petService.getReports({ status: REPORT_STATUSES.RETURNED, limit: 3 })
  return reports
}

function Reunions() {
  const { data: reunions, isLoading } = useAsync(loadReunions)

  if (isLoading || !reunions || reunions.length === 0) return null

  const [featured, ...rest] = reunions

  return (
    <section className="reunion-ground relative isolate overflow-hidden bg-warm-band py-14 sm:py-20">
      <WovenVeil />
      <RouteOrnament tone="amber" size={520} className="-right-40 -bottom-16 rotate-6" />
      <Container className="flex flex-col gap-8">
        {/* IMG-015 opens the chapter: what the cases below actually end in.
            It sits slightly proud of the section's rhythm on wide screens —
            the one place a photograph is allowed to break the grid — and
            stacks above the text on a phone. */}
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:gap-10">
          <img
            src={reunionImage}
            alt="A dog back home, lying on the floor while somebody kneels beside it."
            width="1400"
            height="1050"
            loading="lazy"
            decoding="async"
            className="w-full rounded-card object-cover shadow-raised lg:-my-6 lg:w-1/2 lg:max-w-md xl:max-w-lg"
          />

          <div className="min-w-0 flex-1">
            <SectionHeading
              title={
                <span className="inline-flex items-center gap-2.5">
                  <Heart size={26} className="shrink-0 text-success" aria-hidden="true" />
                  Reunited
                </span>
              }
              description="Cases that ended the way everybody wanted."
              action={
                <Link
                  to="/explore?status=returned"
                  className="inline-flex items-center gap-1.5 font-medium text-brand hover:text-brand-hover hover:underline"
                >
                  See all reunions
                  <ArrowRight size={16} aria-hidden="true" />
                </Link>
              }
            />

            {/* One line of context so the column beside the photograph is not
                simply empty: it also says what a reunion here actually is. */}
            <p className="mt-4 max-w-prose text-fg-muted">
              Every one of these began as two separate reports — a lost pet and a found one —
              that the system paired on their characteristics and a Pet Coordinator verified
              before anybody met.
            </p>
          </div>
        </div>

        {/* One story told properly, then the others. The photographs are the
            point of this section — a reunion shown at thumbnail size is just
            another row of data. */}
        <ul className="grid gap-5 lg:grid-cols-[1.25fr_1fr]">
          <li className="lg:row-span-2">
            <ReunionStory report={featured} featured />
          </li>
          {rest.map((report) => (
            <li key={report.id}>
              <ReunionStory report={report} />
            </li>
          ))}
        </ul>
      </Container>
      <SectionCurve to="surface-alt" />
    </section>
  )
}

/**
 * One reunion. The featured variant leads with a large photograph above the
 * story; the others put a smaller one alongside it.
 */
function ReunionStory({ report, featured = false }) {
  const photo = report.photos.find((p) => p.isPrimary) ?? report.photos[0]
  // A found pet often has no name, and two unnamed cats both read "Cat is
  // home", which looks like the same story told twice. The city separates
  // them, and it is the next thing anybody wants to know anyway.
  const heading = report.petName
    ? `${report.petName} is home`
    : `A ${speciesLabel(report.species).toLowerCase()} in ${report.location.city} is home`
  const days = daysToReunion(report)

  return (
    <Link
      to={`/pet/${report.id}`}
      className={cn(
        'card-interactive group flex h-full overflow-hidden rounded-card border border-border bg-panel shadow-card',
        featured ? 'flex-col' : 'flex-row',
      )}
    >
      <img
        src={photo?.url ?? photoPlaceholder}
        alt=""
        className={cn(
          'shrink-0 bg-surface-muted object-cover',
          featured ? 'aspect-16/10 w-full' : 'aspect-square w-2/5',
        )}
        loading="lazy"
      />

      <div className={cn('flex min-w-0 flex-col gap-2', featured ? 'p-6' : 'p-5')}>
        <p
          className={cn(
            'flex items-center gap-2 font-semibold text-fg',
            featured ? 'text-2xl' : 'text-lg',
          )}
        >
          <Heart
            size={featured ? 20 : 16}
            className="shrink-0 text-success"
            aria-hidden="true"
          />
          {heading}
        </p>

        <p className={cn('text-fg-muted', featured ? 'text-base' : 'text-sm')}>
          Reported {REPORT_TYPE_LABELS[report.reportType].toLowerCase()} in{' '}
          {report.location.city} on {formatDate(report.incidentDate)}, and reunited after a
          coordinator confirmed the match.
        </p>

        <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1 pt-2">
          {days !== null && (
            <span className="rounded-pill bg-success-soft px-2.5 py-0.5 text-sm font-medium text-success-ink">
              Reunited in {days} {days === 1 ? 'day' : 'days'}
            </span>
          )}
          <span className="inline-flex items-center gap-1 text-sm font-medium text-brand group-hover:underline">
            Read {report.petName ? `${report.petName}'s` : 'the'} story
            <ArrowRight size={14} aria-hidden="true" />
          </span>
        </div>
      </div>
    </Link>
  )
}

/**
 * How long the case took, from the report date to the entry that marked it
 * returned. Read straight off `statusHistory`, so it cannot disagree with the
 * timeline on the report itself.
 */
function daysToReunion(report) {
  const returned = report.statusHistory.find(
    (entry) => entry.status === REPORT_STATUSES.RETURNED,
  )
  if (!returned) return null

  const ms = new Date(returned.createdAt) - new Date(report.incidentDate)
  if (Number.isNaN(ms) || ms < 0) return null
  return Math.max(1, Math.round(ms / 86400000))
}

const SAFETY = [
  {
    icon: Lock,
    title: 'Keep one detail private',
    body: 'Hold back one detail you did not publish. It is the simplest way to check a claimant is really the owner.',
  },
  {
    icon: MapPin,
    title: 'Meet somewhere public',
    body: 'Arrange handovers in daylight, in a public place, and bring someone with you.',
  },
  {
    icon: Eye,
    title: 'Trust your instincts',
    body: 'If something feels off, stop and contact a Pet Coordinator rather than pressing ahead.',
  },
]

function Safety() {
  return (
    // The closing band: the page eases into the footer rather than stopping
    // at a hairline.
    <section className="closing-ground relative isolate overflow-hidden bg-surface-alt py-14 sm:py-16">
      <PatternVeil />
      <RadarOrnament tone="teal" size={560} className="-top-28 -right-44" />
      <Container className="flex flex-col gap-8">
        <SectionHeading
          title="Helping is easier when everyone stays safe"
          description="A few simple precautions keep this working for the people who need it."
        />

        <ul className="grid gap-5 md:grid-cols-3">
          {SAFETY.map((point) => {
            const Icon = point.icon

            return (
              <li
                key={point.title}
                className="rounded-card border border-border bg-panel p-7 shadow-card"
              >
                <span className="flex size-13 items-center justify-center rounded-control bg-brand-soft text-brand">
                  <Icon size={24} aria-hidden="true" />
                </span>
                <h3 className="mt-5 text-xl font-semibold text-fg">{point.title}</h3>
                <p className="mt-2 text-fg-muted">{point.body}</p>
              </li>
            )
          })}
        </ul>

        <Link
          to="/help"
          className="inline-flex items-center gap-1.5 self-start font-medium text-brand hover:text-brand-hover hover:underline"
        >
          Read the full safety guidance
          <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </Container>
    </section>
  )
}

/** Shared section heading, so every band on the page lines up the same way. */
