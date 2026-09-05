import { Link } from 'react-router-dom'
import { ArrowRight, Check, X } from 'lucide-react'
import photoPlaceholder from '@/assets/pet-photo-placeholder.png'
import { Button, Card, CardBody, CardFooter, CardHeader } from '@/components/ui'
import { ReportTypeBadge } from './ReportTypeBadge'
import { MATCH_STATUSES, MATCH_STATUS_LABELS, speciesLabel } from '@/constants'
import { formatDate } from '@/utils/date'
import { cn } from '@/utils/cn'

/**
 * Side-by-side comparison of a lost report and a found report.
 *
 * The wording rule matters here more than anywhere else in the app
 * (CLAUDE.md §6.5): this is a **possible** match. It never claims the two are
 * the same animal, and the signal list shows what does *not* agree just as
 * plainly as what does — a user deciding whether to pursue a lead needs both.
 *
 * @param {Object} props
 * @param {Object} props.match       Stored match or generated suggestion.
 * @param {Object} props.lostReport
 * @param {Object} props.foundReport
 * @param {React.ReactNode} [props.actions]
 */
export function MatchCard({ match, lostReport, foundReport, actions }) {
  const matchedSignals = match.signals.filter((signal) => signal.matched)
  const unmatchedSignals = match.signals.filter((signal) => !signal.matched)

  return (
    <Card>
      <CardHeader
        titleAs="h3"
        title="Possible match"
        action={
          !match.isSuggestion && (
            <span className="text-sm text-fg-muted">{MATCH_STATUS_LABELS[match.status]}</span>
          )
        }
      />

      <CardBody className="flex flex-col gap-6">
        {/* The comparison is the point of this component, so the photographs
            get real size and the score sits between them. Small thumbnails
            made a coordinator open both reports in new tabs to do the actual
            comparing. */}
        <div className="grid items-center gap-4 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:gap-5">
          <ReportSide report={lostReport} />

          <div className="flex flex-col items-center gap-1 justify-self-center">
            <span className="flex size-20 items-center justify-center rounded-full border-2 border-brand bg-brand-soft text-2xl font-semibold text-brand-hover">
              {match.score}%
            </span>
            <span className="text-sm text-fg-muted">possible match</span>
          </div>

          <ReportSide report={foundReport} />
        </div>

        <div className="flex flex-col gap-3">
          <h4 className="font-semibold text-fg">
            {matchedSignals.length} of {match.signals.length} characteristics matched
          </h4>

          <ul className="grid gap-2 sm:grid-cols-2">
            {[...matchedSignals, ...unmatchedSignals].map((signal) => (
              <li key={signal.key} className="flex items-start gap-2 text-sm">
                <span
                  className={cn(
                    'mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full',
                    signal.matched
                      ? 'bg-success-soft text-success'
                      : 'bg-danger-soft text-danger',
                  )}
                >
                  {signal.matched ? (
                    <Check size={11} aria-hidden="true" />
                  ) : (
                    <X size={11} aria-hidden="true" />
                  )}
                </span>

                <span className="min-w-0">
                  <span className="font-medium text-fg">{signal.label}</span>
                  <span className="sr-only">
                    {signal.matched ? ': matches' : ': does not match'}
                  </span>
                  <span className="text-fg-muted"> — {signal.detail}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <p className="rounded-control bg-accent-soft px-3 py-2 text-sm text-fg">
          This is a suggestion, not a confirmation. A Pet Coordinator helps verify ownership
          before any handover is arranged.
        </p>
      </CardBody>

      {actions && <CardFooter className="flex flex-wrap gap-2">{actions}</CardFooter>}
    </Card>
  )
}

function ReportSide({ report }) {
  const primaryPhoto = report.photos.find((photo) => photo.isPrimary) ?? report.photos[0]
  const heading = report.petName ?? `${speciesLabel(report.species)} (name unknown)`

  return (
    <div className="flex min-w-0 flex-col gap-3">
      <img
        src={primaryPhoto?.url ?? photoPlaceholder}
        alt=""
        className="aspect-4/3 w-full rounded-card bg-surface-muted object-cover"
        loading="lazy"
      />

      <div className="flex min-w-0 flex-col gap-1">
        <ReportTypeBadge reportType={report.reportType} size="sm" className="self-start" />
        <Link to={`/pet/${report.id}`} className="font-semibold text-fg hover:underline">
          {heading}
        </Link>
        <p className="text-sm text-fg-muted">{report.breed || speciesLabel(report.species)}</p>
        <p className="text-sm text-fg-muted">
          {report.location.city} · {formatDate(report.incidentDate)}
        </p>
      </div>
    </div>
  )
}

/**
 * The standard action row for a user looking at a suggestion about their own
 * report. Kept beside the card so the dashboard and the detail page offer the
 * same choices in the same order.
 */
export function MatchActions({ match, onRequestVerification, onDismiss, isBusy }) {
  if (match.status === MATCH_STATUSES.CONFIRMED) {
    return <p className="text-sm text-success">Confirmed — this pet has been reunited.</p>
  }

  if (match.status === MATCH_STATUSES.VERIFICATION_REQUESTED) {
    return (
      <p className="text-sm text-fg-muted">
        A Pet Coordinator has been asked to review this match.
      </p>
    )
  }

  return (
    <>
      <Button onClick={onRequestVerification} isLoading={isBusy}>
        This could be my pet
        <ArrowRight size={16} aria-hidden="true" />
      </Button>
      <Button variant="ghost" onClick={onDismiss} disabled={isBusy}>
        Not my pet
      </Button>
    </>
  )
}
