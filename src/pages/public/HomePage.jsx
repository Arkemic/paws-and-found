import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  ClipboardList,
  Eye,
  Handshake,
  Heart,
  Lock,
  MapPin,
  PawPrint,
  Search,
  SearchCheck,
  ShieldCheck,
  TriangleAlert,
} from 'lucide-react'
import heroImage from '@/assets/img-006-homepage-hero.jpg'
import emptyReportsImage from '@/assets/empty-no-reports.png'
import photoPlaceholder from '@/assets/pet-photo-placeholder.png'
import { Button, Container, EmptyState, LoadingSkeleton, Select } from '@/components/ui'
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
 * Sections alternate between the warm canvas and a soft teal band so the page
 * reads as distinct chapters instead of one long scroll of white cards.
 */
export function HomePage() {
  return (
    <>
      <title>Paws&Found — Lost and Found Pets</title>

      {/* RootLayout pads <main>; the homepage runs its own full-bleed bands
          right up to the header and footer, so that padding is cancelled. */}
      <div className="-my-8 flex flex-col">
        {/* Hero and search share one tinted ground; everything below returns
            to the plain canvas so the photographs carry the page. */}
        <div className="hero-ground">
          <Hero />
          <SearchBand />
        </div>

        <RecentReports />
        <HowItWorks />
        <Reunions />
        <Safety />
      </div>
    </>
  )
}

const loadHeroStats = async () => {
  const reports = await petService.getReports()
  return {
    total: reports.length,
    reunited: reports.filter((report) => report.status === REPORT_STATUSES.RETURNED).length,
  }
}

function Hero() {
  const { data: stats } = useAsync(loadHeroStats)

  return (
    <section className="pt-10 pb-14 sm:pt-14 sm:pb-20">
      <Container className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
        <div className="flex flex-col items-start gap-6">
          <h1 className="text-4xl leading-[1.08] font-semibold tracking-tight text-balance text-fg sm:text-5xl">
            Every lost pet has someone looking for them.
          </h1>

          <p className="max-w-xl text-lg leading-relaxed text-fg-muted">
            Paws&amp;Found brings lost and found reports into one place, so the search stops
            depending on who saw which post. Describe the pet, and the system looks for
            reports that could be the same animal.
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
            <Button as={Link} to="/explore" variant="secondary" size="lg">
              <Search size={18} aria-hidden="true" />
              Search pets
            </Button>
          </div>

          <p className="flex items-center gap-2 text-sm text-fg-muted">
            <Lock size={14} className="shrink-0 text-fg-subtle" aria-hidden="true" />
            Your contact details stay private unless you choose to share them.
          </p>
        </div>

        {/* IMG-006. The subjects are centred in the frame, so the default
            centre crop keeps both animals in view at every width. */}
        <div className="relative">
          {/* A 4:3 frame on a 1.599 source trims about 7% from each side —
              floor and railing, well clear of both animals. */}
          <div className="aspect-4/3 overflow-hidden rounded-card bg-surface-muted">
            <img
              src={heroImage}
              alt="A tan Aspin sitting beside its owner, who is holding a tabby cat, on the tiled porch of a Philippine home"
              className="size-full object-cover"
              fetchPriority="high"
            />
          </div>

          {stats && (
            <div className="absolute right-3 -bottom-6 w-64 rounded-card border border-border bg-panel p-5 shadow-raised sm:right-6">
              <p className="flex items-center gap-2 font-semibold text-fg">
                <span className="flex size-9 items-center justify-center rounded-control bg-brand-soft text-brand">
                  <PawPrint size={18} aria-hidden="true" />
                </span>
                {stats.total} community reports
              </p>
              <p className="mt-1.5 text-fg-muted">
                {stats.reunited} pets already back with their owners.
              </p>
            </div>
          )}
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
    <section className="pb-12 sm:pb-16">
      <Container>
        {/* Sits on the pale band rather than a white card, so it reads as part
            of the hero rather than a form lifted from inside the app. */}
        <form
          onSubmit={submit}
          className="rounded-card border border-border bg-panel p-6 shadow-raised sm:p-8"
        >
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
      </Container>
    </section>
  )
}

const loadRecentReports = () => petService.getRecentReports(4)

function RecentReports() {
  const { data: reports, error, isLoading } = useAsync(loadRecentReports)

  return (
    <section className="pb-16 sm:pb-24">
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

        {!isLoading && !error && reports?.length > 0 && (
          <ul className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
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
    <section className="bg-surface-alt py-12 sm:py-14">
      <Container className="flex flex-col gap-8">
        <SectionHeading
          title="How Paws&Found works"
          description="Four steps from a missing pet to a confirmed reunion."
          centered
        />

        <ol className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
          {STEPS.map((step, index) => {
            const Icon = step.icon

            return (
              <li key={step.title} className="relative flex flex-col items-center text-center">
                {/* Connector, desktop only. Decorative. */}
                {index < STEPS.length - 1 && (
                  <span
                    aria-hidden="true"
                    className="absolute top-10 left-[calc(50%+2.75rem)] hidden h-0.5 w-[calc(100%-5.5rem)] border-t-2 border-dotted border-border-strong lg:block"
                  />
                )}

                <span className="relative z-10 flex size-20 items-center justify-center rounded-full border border-border bg-panel text-brand shadow-card">
                  <Icon size={32} aria-hidden="true" />
                </span>

                <h3 className="mt-4 flex items-center gap-2 text-lg font-semibold text-fg">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-brand text-xs text-fg-inverted">
                    {index + 1}
                  </span>
                  {step.title}
                </h3>

                <p className="mt-1.5 max-w-56 text-fg-muted">{step.body}</p>
              </li>
            )
          })}
        </ol>
      </Container>
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
    <section className="py-14 sm:py-20">
      <Container className="flex flex-col gap-8">
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

        {/* One story told properly, then the others. The photographs are the
            point of this section — a reunion shown at thumbnail size is just
            another row of data. */}
        <ul className="grid gap-5 lg:grid-cols-2">
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
    </section>
  )
}

/**
 * One reunion. The featured variant leads with a large photograph above the
 * story; the others put a smaller one alongside it.
 */
function ReunionStory({ report, featured = false }) {
  const photo = report.photos.find((p) => p.isPrimary) ?? report.photos[0]
  const heading = report.petName ?? speciesLabel(report.species)
  const days = daysToReunion(report)

  return (
    <Link
      to={`/pet/${report.id}`}
      className={cn(
        'group flex h-full overflow-hidden rounded-card border border-border bg-panel shadow-card transition-shadow hover:shadow-raised',
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
          {heading} is home
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
    <section className="bg-surface-alt py-14 sm:py-16">
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
