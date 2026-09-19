import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  ArrowRight,
  Check,
  CircleCheck,
  Hourglass,
  HeartHandshake,
  Heart,
  Info,
  Maximize2,
  X,
} from 'lucide-react'
import photoPlaceholder from '@/assets/pet-photo-placeholder.png'
import { Button, EmptyState, LoadingSkeleton } from '@/components/ui'
import { PageHeader } from '@/components/PageHeader'
import { PhotoLightbox } from '@/components/PhotoLightbox'
import { ReportTypeBadge } from '@/components/ReportTypeBadge'
import {
  MATCH_STATUSES,
  PET_SIZE_LABELS,
  REPORT_TYPES,
  speciesLabel,
} from '@/constants'
import { useAsync } from '@/hooks/useAsync'
import { matchService, petService, userService } from '@/services'
import { cn } from '@/utils/cn'
import { formatDate, formatShortDate } from '@/utils/date'

/**
 * The three stages a pairing moves through, from the owner's side. Built from
 * the stored match statuses — nothing new is stored:
 *
 *   Needs attention  suggested                          — waiting on you
 *   Under review     verification_requested, under_review — with a coordinator
 *   Confirmed        confirmed                           — reunited
 *
 * Rejected and dismissed pairings are already left out by the service.
 */
const GROUPS = [
  { id: 'attention', label: 'Needs attention', statuses: [MATCH_STATUSES.SUGGESTED] },
  {
    id: 'review',
    label: 'Under review',
    statuses: [MATCH_STATUSES.VERIFICATION_REQUESTED, MATCH_STATUSES.UNDER_REVIEW],
  },
  { id: 'confirmed', label: 'Confirmed', statuses: [MATCH_STATUSES.CONFIRMED] },
]

const groupOf = (match) => GROUPS.find((group) => group.statuses.includes(match.status))?.id

async function loadMatches() {
  const user = await userService.getCurrentUser()
  const suggestions = await matchService.getSuggestionsForUser(user.id)

  // Each suggestion names two reports; fetch them once each.
  const reportIds = [
    ...new Set(suggestions.flatMap((item) => [item.lostReportId, item.foundReportId])),
  ]
  const reports = await Promise.all(reportIds.map((id) => petService.getReportById(id)))
  const byId = Object.fromEntries(reports.map((report) => [report.id, report]))

  return { user, suggestions, byId }
}

export function MyMatchesPage() {
  const { data, error, isLoading, reload } = useAsync(loadMatches)
  const [busyId, setBusyId] = useState(null)
  const [chosenTab, setChosenTab] = useState(null)
  const { hash } = useLocation()

  // The Overview links each match here as /dashboard/matches#match-3. The
  // router does not scroll to a fragment itself, and the card does not exist
  // until the data has loaded, so this waits for both.
  useEffect(() => {
    if (!data || !hash) return
    document.getElementById(hash.slice(1))?.scrollIntoView({ block: 'start' })
  }, [data, hash])

  const header = (
    <PageHeader
      title="Possible matches"
      description="Reports that share characteristics with yours. A possible match is a suggestion, not a confirmation."
      breadcrumb={[{ label: 'My dashboard', to: '/dashboard' }, { label: 'Possible matches' }]}
    />
  )

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        {header}
        <LoadingSkeleton lines={6} />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col gap-6">
        {header}
        <p role="alert" className="text-sm text-danger">
          Your matches could not be loaded: {error.message}
        </p>
      </div>
    )
  }

  const { user, suggestions, byId } = data

  if (suggestions.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        {header}
        <EmptyState
          icon={Heart}
          title="No possible matches yet"
          description="When a report is filed that shares enough characteristics with one of yours, it will appear here with an explanation of what lines up."
          action={
            <Button as={Link} to="/dashboard/reports" variant="secondary">
              See my reports
            </Button>
          }
        />
      </div>
    )
  }

  const grouped = Object.fromEntries(
    GROUPS.map((group) => [group.id, suggestions.filter((match) => groupOf(match) === group.id)]),
  )
  // Which tab is showing: the one you picked; else the one holding a match a
  // link pointed at; else the first stage with anything in it.
  const linked = hash.startsWith('#match-')
    ? suggestions.find((match) => `#match-${match.id}` === hash)
    : null
  const tab =
    chosenTab ??
    (linked && groupOf(linked)) ??
    GROUPS.find((group) => grouped[group.id].length > 0).id
  const visible = grouped[tab]

  const act = async (suggestion, action) => {
    setBusyId(suggestion.id)
    try {
      await action(suggestion)
      reload()
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {header}

      {/* The stages, with their counts — "1 under review", "1 confirmed" — as
          the tabs themselves, so the summary and the filter are one control. */}
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Match stage">
        {GROUPS.map((group) => {
          const count = grouped[group.id].length
          const selected = tab === group.id

          return (
            <button
              key={group.id}
              type="button"
              role="tab"
              id={`stage-${group.id}`}
              aria-selected={selected}
              aria-controls="matches-panel"
              onClick={() => setChosenTab(group.id)}
              className={cn(
                'inline-flex items-center gap-2 rounded-pill border px-3.5 py-1.5 text-sm transition-colors',
                selected
                  ? 'border-brand-soft bg-brand-soft font-medium text-brand-hover'
                  : 'border-border-strong bg-panel text-fg-muted hover:text-fg',
              )}
            >
              {group.label}
              <span
                className={cn(
                  'min-w-5 rounded-pill px-1.5 text-center text-xs font-semibold tabular-nums',
                  selected ? 'bg-panel text-brand-hover' : 'bg-surface-muted text-fg-muted',
                )}
              >
                {count}
              </span>
            </button>
          )
        })}
      </div>

      <div id="matches-panel" role="tabpanel" aria-labelledby={`stage-${tab}`}>
        {visible.length === 0 ? (
          <StageEmptyState stage={tab} />
        ) : (
          <ul className="flex flex-col gap-6">
            {visible.map((suggestion) => (
              <li key={suggestion.id} id={`match-${suggestion.id}`} className="scroll-mt-24">
                <OwnerMatchCard
                  match={suggestion}
                  lost={byId[suggestion.lostReportId]}
                  found={byId[suggestion.foundReportId]}
                  userId={user.id}
                  isBusy={busyId === suggestion.id}
                  onRequestVerification={() =>
                    act(suggestion, (match) => matchService.requestVerification(match, user.id))
                  }
                  onDismiss={() => act(suggestion, matchService.dismissMatch)}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

/**
 * One pairing, as the owner sees it: who is paired with whom and where it
 * stands first, then the two photographs, the score, the evidence, and what
 * happens next. The coordinator's version of this comparison is MatchCard,
 * which is left as it is.
 */
function OwnerMatchCard({ match, lost, found, userId, isBusy, onRequestVerification, onDismiss }) {
  const aligned = match.signals.filter((signal) => signal.matched).length
  const isConfirmed = match.status === MATCH_STATUSES.CONFIRMED
  const iAmFinder = Number(found.reporterId) === Number(userId)

  return (
    <article className="overflow-hidden rounded-card border border-border bg-panel shadow-card">
      {/* 1. What this is and where it stands. */}
      <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-border px-5 py-4">
        <h2 className="text-lg font-semibold text-fg">
          {sideName(lost)}
          <span className="text-fg-muted" aria-hidden="true">
            {' '}
            ↔{' '}
          </span>
          <span className="sr-only"> and </span>
          {sideName(found)}
        </h2>
        <StageBadge status={match.status} />
      </header>

      <div className="flex flex-col gap-6 p-5">
        {/* 2. The comparison. Three columns from `md`; on a phone it stacks as
            lost, score, found — each side keeps its LOST / FOUND badge. */}
        <div className="grid items-center gap-5 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
          <PairSide report={lost} />

          <div className="flex flex-col items-center gap-1 text-center md:w-40">
            <span className="text-3xl font-semibold text-fg tabular-nums">{match.score}%</span>
            <span className="text-sm font-medium text-fg">compatibility score</span>
            <span className="text-sm text-fg-muted">
              {aligned} of {match.signals.length} characteristics align
            </span>
            <span
              className={cn(
                'mt-1 rounded-pill px-2.5 py-0.5 text-xs font-medium',
                isConfirmed ? 'bg-success-soft text-success-ink' : 'bg-accent-soft text-lost',
              )}
            >
              {isConfirmed ? 'Confirmed match' : 'Possible match'}
            </span>
          </div>

          <PairSide report={found} />
        </div>

        {/* 3. The evidence. */}
        <Evidence match={match} lost={lost} found={found} />

        {/* 4. Where it stands, and what — if anything — to do. */}
        <StagePanel
          match={match}
          iAmFinder={iAmFinder}
          isBusy={isBusy}
          onRequestVerification={onRequestVerification}
          onDismiss={onDismiss}
        />
      </div>
    </article>
  )
}

function PairSide({ report }) {
  const [isOpen, setIsOpen] = useState(false)
  const photo = report.photos.find((item) => item.isPrimary) ?? report.photos[0]
  const alt = photo?.alt || `Photo of ${sideName(report).toLowerCase()}`
  const isFound = report.reportType === REPORT_TYPES.FOUND

  return (
    <div className="flex min-w-0 flex-col gap-3">
      <div className="relative">
        {/* Capped at 320px so the evidence is reachable without scrolling a
            whole screen. The full, uncropped frame is one click away — markings
            are what identify a pet, and a crop can hide them. */}
        {photo ? (
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="block w-full cursor-zoom-in rounded-card"
          >
            <img
              src={photo.url}
              alt={alt}
              className="h-56 w-full rounded-card bg-surface-muted object-cover sm:h-72 lg:h-80"
              loading="lazy"
            />
            <span className="sr-only">View full photo</span>
          </button>
        ) : (
          <img
            src={photoPlaceholder}
            alt="No photo was provided for this report"
            className="h-56 w-full rounded-card bg-surface-muted object-contain sm:h-72 lg:h-80"
          />
        )}
        {photo && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute top-3 right-3 flex size-8 items-center justify-center rounded-control bg-panel/90 text-fg shadow-card"
          >
            <Maximize2 size={15} />
          </span>
        )}
      </div>

      <div className="flex min-w-0 flex-col gap-1">
        <ReportTypeBadge reportType={report.reportType} size="sm" className="self-start" />
        <Link to={`/pet/${report.id}`} className="font-semibold text-fg hover:underline">
          {sideName(report)}
        </Link>
        <p className="text-sm text-fg-muted">
          {[speciesLabel(report.species), report.breed].filter(Boolean).join(' · ')}
        </p>
        <p className="text-sm text-fg-muted">
          {report.location.city} · {isFound ? 'Found' : 'Last seen'} {formatDate(report.incidentDate)}
        </p>
      </div>

      {photo && (
        <PhotoLightbox isOpen={isOpen} onClose={() => setIsOpen(false)} src={photo.url} alt={alt} />
      )}
    </div>
  )
}

/**
 * The seven characteristics as one scannable list: the category, a check or a
 * cross with the word for it, the two values side by side where there are
 * values to show, and the engine's own explanation underneath. Nothing is
 * recalculated here — `matched` and `detail` are the stored signal.
 */
const EVIDENCE_ORDER = ['species', 'breed', 'size', 'color', 'location', 'date', 'characteristics']

function Evidence({ match, lost, found }) {
  const signals = [...match.signals].sort(
    (a, b) => EVIDENCE_ORDER.indexOf(a.key) - EVIDENCE_ORDER.indexOf(b.key),
  )

  return (
    <section aria-label="Comparison evidence" className="flex flex-col gap-2">
      <h3 className="text-sm font-semibold text-fg">Why these were paired</h3>
      <ul className="divide-y divide-border rounded-card border border-border">
        {signals.map((signal) => {
          const values = compareValues(signal.key, lost, found)

          return (
            <li
              key={signal.key}
              className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-0.5 px-4 py-2.5 sm:grid-cols-[auto_11rem_minmax(0,1fr)]"
            >
              <span
                className={cn(
                  'mt-0.5 flex size-5 items-center justify-center rounded-full',
                  signal.matched ? 'bg-success-soft text-success-ink' : 'bg-danger-soft text-danger',
                )}
              >
                {signal.matched ? (
                  <Check size={12} strokeWidth={3} aria-hidden="true" />
                ) : (
                  <X size={12} strokeWidth={3} aria-hidden="true" />
                )}
              </span>

              <span className="text-sm">
                <span className="font-medium text-fg">{signal.label}</span>
                <span
                  className={cn(
                    'block text-xs',
                    signal.matched ? 'text-success-ink' : 'text-danger',
                  )}
                >
                  {signal.matched ? 'Aligns' : 'Does not align'}
                </span>
              </span>

              <span className="col-start-2 text-sm sm:col-start-3">
                {values && (
                  <span className="block font-medium text-fg">
                    {values[0]}
                    <span className="text-fg-muted" aria-hidden="true">
                      {' '}
                      ↔{' '}
                    </span>
                    <span className="sr-only"> compared with </span>
                    {values[1]}
                  </span>
                )}
                <span className="text-fg-muted">{signal.detail}</span>
              </span>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

/** The two values being compared, where the reports carry them. */
function compareValues(key, lost, found) {
  const pair = (fn) => [fn(lost) || '—', fn(found) || '—']
  switch (key) {
    case 'species':
      return pair((r) => speciesLabel(r.species))
    case 'breed':
      return pair((r) => r.breed)
    case 'size':
      return pair((r) => PET_SIZE_LABELS[r.size])
    case 'color':
      return pair((r) => [r.primaryColor, r.secondaryColor].filter(Boolean).join(' / '))
    case 'location':
      return pair((r) => r.location.city)
    case 'date':
      return pair((r) => formatShortDate(r.incidentDate))
    default:
      return null
  }
}

function StageBadge({ status }) {
  const styles = {
    [MATCH_STATUSES.SUGGESTED]: ['bg-accent-soft text-lost', 'Needs your review'],
    [MATCH_STATUSES.VERIFICATION_REQUESTED]: ['bg-brand-soft text-brand-hover', 'Verification requested'],
    [MATCH_STATUSES.UNDER_REVIEW]: ['bg-brand-soft text-brand-hover', 'More information requested'],
    [MATCH_STATUSES.CONFIRMED]: ['bg-success-soft text-success-ink', 'Confirmed · Reunited'],
  }
  const [style, label] = styles[status] ?? ['bg-surface-muted text-fg-muted', status]

  return (
    <span className={cn('rounded-pill px-3 py-1 text-sm font-medium', style)}>{label}</span>
  )
}

/**
 * What happens next. An open pairing keeps the reminder that a match is only a
 * suggestion; a confirmed one replaces it — saying "not a confirmation" beside
 * "Confirmed" contradicted itself.
 */
function StagePanel({ match, iAmFinder, isBusy, onRequestVerification, onDismiss }) {
  const suggestionNote = (
    <p className="rounded-control bg-accent-soft px-3 py-2 text-sm text-fg">
      This is a suggestion, not a confirmation. A Pet Coordinator helps verify ownership before any
      handover is arranged.
    </p>
  )

  if (match.status === MATCH_STATUSES.CONFIRMED) {
    return (
      <StatusStrip tone="success" icon={HeartHandshake} title="Reunited successfully">
        Ownership was verified and this case has been confirmed.
      </StatusStrip>
    )
  }

  if (match.status === MATCH_STATUSES.VERIFICATION_REQUESTED) {
    return (
      <div className="flex flex-col gap-3">
        <StatusStrip tone="info" icon={Hourglass} title="Verification requested">
          A Pet Coordinator is reviewing this pairing. You will be notified when its status
          changes.
        </StatusStrip>
        {suggestionNote}
      </div>
    )
  }

  if (match.status === MATCH_STATUSES.UNDER_REVIEW) {
    return (
      <div className="flex flex-col gap-3">
        <StatusStrip tone="info" icon={Info} title="A Pet Coordinator asked for more information">
          Their note is in your{' '}
          <Link to="/dashboard/notifications" className="font-medium underline">
            notifications
          </Link>
          . The pairing stays under review until they decide.
        </StatusStrip>
        {suggestionNote}
      </div>
    )
  }

  // Suggested: the one stage where the owner decides what happens next.
  return (
    <div className="flex flex-col gap-3">
      {suggestionNote}
      <div className="flex flex-wrap gap-2">
        <Button onClick={onRequestVerification} isLoading={isBusy}>
          {iAmFinder ? 'This could be the same pet' : 'This could be my pet'}
          <ArrowRight size={16} aria-hidden="true" />
        </Button>
        <Button variant="ghost" onClick={onDismiss} disabled={isBusy}>
          {iAmFinder ? 'Not the same pet' : 'Not my pet'}
        </Button>
      </div>
    </div>
  )
}

function StatusStrip({ tone, icon: Icon, title, children }) {
  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-card border px-4 py-3',
        tone === 'success' ? 'border-success/30 bg-success-soft' : 'border-brand/25 bg-brand-soft',
      )}
    >
      <Icon
        size={20}
        className={cn('mt-0.5 shrink-0', tone === 'success' ? 'text-success-ink' : 'text-brand-hover')}
        aria-hidden="true"
      />
      <div className="flex flex-col gap-0.5">
        <p className={cn('font-semibold', tone === 'success' ? 'text-success-ink' : 'text-brand-hover')}>
          {title}
        </p>
        <p className="text-sm text-fg">{children}</p>
      </div>
    </div>
  )
}

function StageEmptyState({ stage }) {
  const copy = {
    attention: {
      icon: CircleCheck,
      title: 'Nothing needs your review',
      description:
        'New suggestions appear here when a report lines up with one of yours. You decide whether to ask a Pet Coordinator to verify them.',
    },
    review: {
      icon: Hourglass,
      title: 'Nothing is being verified right now',
      description:
        'When you ask for a pairing to be verified, it waits here while a Pet Coordinator reviews it.',
    },
    confirmed: {
      icon: HeartHandshake,
      title: 'No confirmed matches yet',
      description: 'Pairings a Pet Coordinator confirms — pets back home — are kept here.',
    },
  }[stage]

  return <EmptyState icon={copy.icon} title={copy.title} description={copy.description} />
}

function sideName(report) {
  return (
    report.petName ??
    `${report.reportType === REPORT_TYPES.FOUND ? 'Found' : 'Lost'} ${speciesLabel(report.species).toLowerCase()}`
  )
}
