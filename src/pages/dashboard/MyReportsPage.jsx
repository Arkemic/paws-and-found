import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Heart, PawPrint, Pencil, TriangleAlert } from 'lucide-react'
import { Button, Card, CardBody, EmptyState, LoadingSkeleton } from '@/components/ui'
import { PageHeader } from '@/components/PageHeader'
import { ReportTypeBadge } from '@/components/ReportTypeBadge'
import { StatusBadge } from '@/components/StatusBadge'
import { REPORT_STATUSES } from '@/constants'
import { useAsync } from '@/hooks/useAsync'
import { matchService, petService, userService } from '@/services'
import { formatDate } from '@/utils/date'
import { cn } from '@/utils/cn'

const OPEN_STATUSES = [REPORT_STATUSES.ACTIVE, REPORT_STATUSES.POSSIBLE_MATCH]

/** The three groups people actually think in, rather than raw statuses. */
const TABS = [
  { id: 'open', label: 'Open' },
  { id: 'recovered', label: 'Recovered' },
  { id: 'closed', label: 'Closed' },
]

async function loadMyReports() {
  const user = await userService.getCurrentUser()
  const [reports, matches] = await Promise.all([
    petService.getReportsByUser(user.id),
    matchService.getMatchesForUser(user.id),
  ])
  return { user, reports, matches }
}

export function MyReportsPage() {
  const [tab, setTab] = useState('open')
  const { data, error, isLoading, reload } = useAsync(loadMyReports)

  const closeReport = async (report, userId) => {
    await petService.updateReportStatus(report.id, REPORT_STATUSES.CLOSED, {
      actorId: userId,
      note: 'Closed by the reporter.',
    })
    reload()
  }

  const header = (
    <PageHeader
      title="My reports"
      description="Every lost and found report you have filed, and where each one stands."
      breadcrumb={[{ label: 'My dashboard', to: '/dashboard' }, { label: 'My reports' }]}
      actions={
        <Button as={Link} to="/report/lost" variant="accent" size="sm">
          <TriangleAlert size={16} aria-hidden="true" />
          Report a lost pet
        </Button>
      }
    />
  )

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        {header}
        <LoadingSkeleton lines={5} />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col gap-6">
        {header}
        <p role="alert" className="text-sm text-danger">
          Your reports could not be loaded: {error.message}
        </p>
      </div>
    )
  }

  const { user, reports, matches } = data
  const grouped = {
    open: reports.filter((report) => OPEN_STATUSES.includes(report.status)),
    recovered: reports.filter((report) => report.status === REPORT_STATUSES.RETURNED),
    closed: reports.filter((report) => report.status === REPORT_STATUSES.CLOSED),
  }
  const visible = grouped[tab]

  const matchCountFor = (reportId) =>
    matches.filter(
      (match) => match.lostReportId === reportId || match.foundReportId === reportId,
    ).length

  return (
    <div className="flex flex-col gap-6">
      {header}

      <div className="flex flex-wrap gap-1 border-b border-border" role="tablist">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            onClick={() => setTab(item.id)}
            className={cn(
              '-mb-px border-b-2 px-3 py-2 text-sm transition-colors',
              tab === item.id
                ? 'border-brand font-medium text-brand-hover'
                : 'border-transparent text-fg-muted hover:text-fg',
            )}
          >
            {item.label}
            <span className="ml-1.5 text-fg-muted">{grouped[item.id].length}</span>
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <EmptyState
          icon={PawPrint}
          title={`No ${tab} reports`}
          description={
            tab === 'open'
              ? 'When you file a lost or found report, it will appear here until it is recovered or closed.'
              : 'Nothing in this group yet.'
          }
          action={
            tab === 'open' && (
              <Button as={Link} to="/report/lost" variant="accent">
                Report a lost pet
              </Button>
            )
          }
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {visible.map((report) => {
            const matchCount = matchCountFor(report.id)

            return (
              <li key={report.id}>
                <Card>
                  <CardBody className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 flex-col gap-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <ReportTypeBadge reportType={report.reportType} size="sm" />
                        <StatusBadge status={report.status} />
                      </div>

                      <Link
                        to={`/pet/${report.id}`}
                        className="font-semibold text-fg hover:underline"
                      >
                        {report.petName ?? 'Found pet report'}
                      </Link>

                      <p className="text-sm text-fg-muted">
                        {report.location.city} · {formatDate(report.incidentDate)}
                      </p>

                      {matchCount > 0 && (
                        <Link
                          to="/dashboard/matches"
                          className="inline-flex w-fit items-center gap-1 text-sm text-brand hover:underline"
                        >
                          <Heart size={14} aria-hidden="true" />
                          {matchCount} possible {matchCount === 1 ? 'match' : 'matches'}
                        </Link>
                      )}
                    </div>

                    <div className="flex shrink-0 flex-wrap gap-2">
                      <Button
                        as={Link}
                        to={`/dashboard/reports/${report.id}/edit`}
                        variant="secondary"
                        size="sm"
                      >
                        <Pencil size={14} aria-hidden="true" />
                        Edit
                      </Button>

                      {report.status !== REPORT_STATUSES.CLOSED && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => closeReport(report, user.id)}
                        >
                          Close
                        </Button>
                      )}
                    </div>
                  </CardBody>
                </Card>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
