import { Link } from 'react-router-dom'
import { ArrowRight, FileText, Heart, PawPrint, ShieldCheck } from 'lucide-react'
import photoPlaceholder from '@/assets/pet-photo-placeholder.png'
import { Button, LoadingSkeleton } from '@/components/ui'
import { PageHeader } from '@/components/PageHeader'
import { StatTile } from '@/components/StatTile'
import { StatusBadge } from '@/components/StatusBadge'
import { ReportTypeBadge } from '@/components/ReportTypeBadge'
import {
  MATCH_STATUSES,
  MATCH_STATUSES_AWAITING_STAFF,
  REPORT_STATUSES,
  REPORT_STATUS_LABELS,
  REPORT_STATUS_ORDER,
} from '@/constants'
import { useAsync } from '@/hooks/useAsync'
import { matchService, petService } from '@/services'
import { formatRelativeTime } from '@/utils/date'

const STATUS_BARS = {
  [REPORT_STATUSES.ACTIVE]: 'bg-status-active',
  [REPORT_STATUSES.POSSIBLE_MATCH]: 'bg-status-match',
  [REPORT_STATUSES.RETURNED]: 'bg-status-returned',
  [REPORT_STATUSES.CLOSED]: 'bg-status-closed',
}

async function loadStaffOverview() {
  const [reports, suggested, awaiting] = await Promise.all([
    petService.getReports(),
    // With their reports, not bare: the queue shows the two animals, and a
    // coordinator judging a pairing wants to see them before the wording.
    matchService.getMatchesWithReports({ status: MATCH_STATUSES.SUGGESTED }),
    matchService.getMatchesWithReports({ statuses: MATCH_STATUSES_AWAITING_STAFF }),
  ])

  return { reports, suggested, awaiting }
}

export function StaffOverviewPage() {
  const { data, error, isLoading } = useAsync(loadStaffOverview)

  const header = (
    <PageHeader
      icon={ShieldCheck}
      eyebrow="Pet Coordinator"
      title="Staff workspace"
      description="Reports and possible matches waiting on a Pet Coordinator."
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
          The workspace could not be loaded: {error.message}
        </p>
      </div>
    )
  }

  const { reports, suggested, awaiting } = data
  const active = reports.filter((report) => report.status === REPORT_STATUSES.ACTIVE)
  const returned = reports.filter((report) => report.status === REPORT_STATUSES.RETURNED)

  // Most recently touched first — where a coordinator picks up from.
  const recentlyUpdated = [...reports].sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1)).slice(0, 6)

  return (
    <div className="flex flex-col gap-8">
      {header}

      {/* The first two numbers are work; the last two are context. They are
          sized accordingly rather than presented as four equal figures. */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          icon={ShieldCheck}
          label="Verification requests"
          value={awaiting.length}
          to="/staff/verification"
          emphasis
        />
        <StatTile
          icon={Heart}
          label="Possible matches"
          value={suggested.length}
          to="/staff/matches"
          emphasis
        />
        <StatTile icon={FileText} label="Active reports" value={active.length} to="/staff/reports" />
        <StatTile icon={PawPrint} label="Pets returned" value={returned.length} />
      </div>

      <NeedsAttention awaiting={awaiting} suggested={suggested} />

      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="text-xl font-semibold text-fg">Recent cases</h2>
          <Button as={Link} to="/staff/reports" variant="ghost" size="sm">
            See the queue
          </Button>
        </div>

        <ul className="flex flex-col divide-y divide-border overflow-hidden rounded-card border border-border bg-panel">
          {recentlyUpdated.map((report) => (
            <li key={report.id} className="flex flex-wrap items-center gap-x-3 gap-y-1.5 px-4 py-3">
              <ReportThumb report={report} />
              <ReportTypeBadge reportType={report.reportType} size="sm" />
              <Link
                to={`/pet/${report.id}`}
                className="text-sm font-medium text-brand hover:underline"
              >
                {report.petName ?? 'Found pet report'}
              </Link>
              <StatusBadge status={report.status} />
              <span className="ml-auto text-sm whitespace-nowrap text-fg-muted">
                {report.location.city} · {formatRelativeTime(report.updatedAt)}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <StatusBreakdown reports={reports} />
    </div>
  )
}

/**
 * The one section a coordinator should read first: everything that is blocked
 * on them, newest first, with the action attached to each row.
 */
function NeedsAttention({ awaiting, suggested }) {
  const total = awaiting.length + suggested.length

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-xl font-semibold text-fg">
        Needs your attention
        {total > 0 && <span className="ml-2 font-normal text-fg-muted">{total}</span>}
      </h2>

      {total === 0 ? (
        <p className="rounded-card border border-border bg-panel px-4 py-5 text-fg-muted">
          Nothing is waiting on a coordinator right now.
        </p>
      ) : (
        <ul className="flex flex-col divide-y divide-border overflow-hidden rounded-card border border-border bg-panel">
          {awaiting.map(({ match, lostReport, foundReport }) => (
            <AttentionRow
              key={match.id}
              icon={ShieldCheck}
              lostReport={lostReport}
              foundReport={foundReport}
              urgent
              title={`Verification requested · ${match.score}% match`}
              detail={`${lostReport.petName ?? 'A lost report'} and a found report in ${foundReport.location.city}`}
              when={match.updatedAt}
              to="/staff/verification"
              actionLabel="Verify"
            />
          ))}

          {suggested.map(({ match, lostReport, foundReport }) => (
            <AttentionRow
              key={match.id}
              icon={Heart}
              lostReport={lostReport}
              foundReport={foundReport}
              title={`Possible match · ${match.score}%`}
              detail={`${lostReport.petName ?? 'A lost report'} and a found report in ${foundReport.location.city}`}
              when={match.updatedAt}
              to="/staff/matches"
              actionLabel="Review"
            />
          ))}
        </ul>
      )}
    </section>
  )
}

function AttentionRow({
  icon: Icon,
  urgent = false,
  lostReport,
  foundReport,
  title,
  detail,
  when,
  to,
  actionLabel,
}) {
  return (
    <li className="flex items-start gap-4 px-4 py-4">
      {/* The two animals, where the row is about a pairing. A coordinator
          decides these by looking, and a queue of identical teal icons gave
          them nothing to look at — the wording underneath is the same on every
          row, so the photographs are the only thing that distinguishes one
          case from the next. The icon medallion stays as the fallback. */}
      {lostReport && foundReport ? (
        <span className="mt-0.5 flex shrink-0 -space-x-3">
          <ReportThumb report={lostReport} />
          <ReportThumb report={foundReport} />
        </span>
      ) : (
        <span
          className={
            urgent
              ? 'mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-control bg-accent-soft text-lost'
              : 'mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-control bg-brand-soft text-brand'
          }
        >
          <Icon size={18} aria-hidden="true" />
        </span>
      )}

      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p className="flex flex-wrap items-center gap-2 font-medium text-fg">
          <Icon
            size={16}
            aria-hidden="true"
            className={urgent ? 'shrink-0 text-lost' : 'shrink-0 text-brand'}
          />
          {title}
        </p>
        <p className="text-sm text-fg-muted">{detail}</p>
        <p className="text-sm text-fg-muted">{formatRelativeTime(when)}</p>
      </div>

      <Button as={Link} to={to} size="sm" variant={urgent ? 'primary' : 'secondary'}>
        {actionLabel}
        <ArrowRight size={14} aria-hidden="true" />
      </Button>
    </li>
  )
}

/** One report's photograph, sized for a queue row. */
function ReportThumb({ report }) {
  const photo = report.photos.find((item) => item.isPrimary) ?? report.photos[0]

  return (
    <img
      src={photo?.url ?? photoPlaceholder}
      alt=""
      loading="lazy"
      className="size-11 rounded-control border-2 border-panel bg-surface-muted object-cover"
    />
  )
}

/**
 * Where every report currently sits.
 *
 * The bars are plain divs sized by percentage — a chart library for four
 * numbers would be a dependency the project has to justify at a defence.
 */
function StatusBreakdown({ reports }) {
  const total = reports.length

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-xl font-semibold text-fg">Where reports stand</h2>

      <dl className="flex flex-col gap-3 rounded-card border border-border bg-panel p-5">
        {REPORT_STATUS_ORDER.map((status) => {
          const count = reports.filter((report) => report.status === status).length
          const share = total === 0 ? 0 : Math.round((count / total) * 100)

          return (
            <div key={status} className="flex items-center gap-4">
              <dt className="w-36 shrink-0 text-sm text-fg">{REPORT_STATUS_LABELS[status]}</dt>
              <dd className="flex flex-1 items-center gap-3">
                {/* Decorative — the number beside it is the actual value. */}
                <span
                  aria-hidden="true"
                  className="h-2 flex-1 overflow-hidden rounded-pill bg-surface-muted"
                >
                  <span
                    className={`block h-full rounded-pill ${STATUS_BARS[status]}`}
                    style={{ width: `${share}%` }}
                  />
                </span>
                <span className="w-8 shrink-0 text-right font-medium text-fg tabular-nums">
                  {count}
                </span>
              </dd>
            </div>
          )
        })}
      </dl>
    </section>
  )
}
