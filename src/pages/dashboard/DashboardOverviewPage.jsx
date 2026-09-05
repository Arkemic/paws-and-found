import { Link } from 'react-router-dom'
import { HandHeart, Heart, PawPrint, TriangleAlert } from 'lucide-react'
import photoPlaceholder from '@/assets/pet-photo-placeholder.png'
import { Button, EmptyState, LoadingSkeleton } from '@/components/ui'
import { PageHeader } from '@/components/PageHeader'
import { PetCard } from '@/components/PetCard'
import { StatusBadge } from '@/components/StatusBadge'
import { REPORT_STATUSES } from '@/constants'
import { useAsync } from '@/hooks/useAsync'
import { matchService, petService, userService } from '@/services'
import { formatDate } from '@/utils/date'

const OPEN_STATUSES = [REPORT_STATUSES.ACTIVE, REPORT_STATUSES.POSSIBLE_MATCH]

async function loadOverview() {
  const user = await userService.getCurrentUser()

  const [reports, suggestions, activity] = await Promise.all([
    petService.getReportsByUser(user.id),
    matchService.getSuggestionsForUser(user.id),
    // Asked for directly: a report in the list does not carry its own history,
    // so this feed cannot be assembled from `reports`.
    petService.getRecentActivity(6),
  ])

  // Each suggestion names two reports; fetch them once each.
  const reportIds = [
    ...new Set(suggestions.flatMap((item) => [item.lostReportId, item.foundReportId])),
  ]
  const matchReports = await Promise.all(reportIds.map((id) => petService.getReportById(id)))
  const byId = Object.fromEntries(matchReports.map((report) => [report.id, report]))

  return { user, reports, suggestions, byId, activity }
}

/**
 * The customer's home in the system.
 *
 * It answers one question — what is happening with my pets? — so it is
 * deliberately not a smaller copy of the staff dashboard. There is no row of
 * counters: an owner with two open cases does not need to be told they have
 * two open cases, they need to see them.
 */
export function DashboardOverviewPage() {
  // Defined at module scope, so its identity is already stable.
  const { data, error, isLoading } = useAsync(loadOverview)

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="My dashboard" />
        <LoadingSkeleton lines={6} />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="My dashboard" />
        <p role="alert" className="text-sm text-danger">
          Your dashboard could not be loaded: {error.message}
        </p>
      </div>
    )
  }

  const { user, reports, suggestions, byId, activity } = data
  const openReports = reports.filter((report) => OPEN_STATUSES.includes(report.status))
  const recovered = reports.filter((report) => report.status === REPORT_STATUSES.RETURNED)

  // Matches lead the page when there are any: an unreviewed match is the only
  // thing here that is waiting on the owner. With none, the section sits below
  // the reports rather than opening the dashboard with a line about nothing.
  //
  // Deliberately NOT a full MatchCard. That is the evidence comparison people
  // decide on, and it belongs on the page where they decide — here it only has
  // to be interesting enough to click.
  const matchesSection = (
    <Section
      title="Possible matches"
      description="Reports that share characteristics with yours. A suggestion, never a confirmation."
    >
      {suggestions.length === 0 ? (
        <p className="text-fg-muted">
          Nothing yet. When a report is filed that lines up with one of yours, it will appear
          here with an explanation of what matches.
        </p>
      ) : (
        <div className="flex flex-col gap-4 rounded-card border border-accent/40 bg-accent-soft/50 p-4 sm:p-6">
          <ul className="flex flex-col gap-3">
            {suggestions.slice(0, 3).map((suggestion) => {
              const lost = byId[suggestion.lostReportId]
              const found = byId[suggestion.foundReportId]

              return (
                <li
                  key={suggestion.id}
                  className="flex flex-wrap items-center gap-4 rounded-card bg-panel p-3 shadow-card"
                >
                  <div className="flex shrink-0 items-center gap-2">
                    <img
                      src={primaryPhotoUrl(lost) ?? photoPlaceholder}
                      alt=""
                      className="size-14 rounded-control bg-surface-muted object-cover"
                      loading="lazy"
                    />
                    <img
                      src={primaryPhotoUrl(found) ?? photoPlaceholder}
                      alt=""
                      className="size-14 rounded-control bg-surface-muted object-cover"
                      loading="lazy"
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-fg">
                      {suggestion.score}% possible match
                    </p>
                    <p className="text-sm text-fg-muted">
                      {lost.petName ?? 'Your lost report'} and a found report in{' '}
                      {found.location.city}
                    </p>
                  </div>
                </li>
              )
            })}
          </ul>

          <Button as={Link} to="/dashboard/matches" className="self-start">
            <Heart size={16} aria-hidden="true" />
            Review{' '}
            {suggestions.length === 1 ? 'this match' : `all ${suggestions.length} matches`}
          </Button>
        </div>
      )}
    </Section>
  )

  return (
    <div className="flex flex-col gap-12">
      <PageHeader
        title={`Welcome back, ${user.fullName.split(' ')[0]}.`}
        description="Here is where your cases stand today."
      />

      {/* The two things a person comes here to start. They sit above everything
          else because filing quickly is the whole point of the site. */}
      <div className="grid gap-3 sm:grid-cols-2">
        <Button as={Link} to="/report/lost" variant="accent" size="lg" fullWidth>
          <TriangleAlert size={18} aria-hidden="true" />
          Report a lost pet
        </Button>
        <Button as={Link} to="/report/found" size="lg" fullWidth>
          <HandHeart size={18} aria-hidden="true" />
          Report a found pet
        </Button>
      </div>

      {suggestions.length > 0 && matchesSection}

      <Section
        title="Your active reports"
        description="Cases that are still open."
        action={
          reports.length > 0 && (
            <Button as={Link} to="/dashboard/reports" variant="ghost" size="sm">
              See all reports
            </Button>
          )
        }
      >
        {openReports.length === 0 ? (
          <EmptyState
            icon={PawPrint}
            title={reports.length === 0 ? 'You have not filed a report yet' : 'Nothing open'}
            description={
              reports.length === 0
                ? 'When you report a lost or found pet, it will appear here so you can follow it.'
                : 'None of your reports are currently active. Closed and recovered cases are on the My Reports page.'
            }
            action={
              <Button as={Link} to="/report/lost" variant="accent">
                Report a lost pet
              </Button>
            }
          />
        ) : (
          <ul className="grid gap-5 sm:grid-cols-2">
            {openReports.slice(0, 4).map((report) => (
              <li key={report.id} className="flex">
                <PetCard report={report} className="w-full" />
              </li>
            ))}
          </ul>
        )}
      </Section>

      {suggestions.length === 0 && matchesSection}

      <Section title="Recent updates" description="Every change across your reports, newest first.">
        {activity.length === 0 ? (
          <p className="text-fg-muted">Nothing has happened on your reports yet.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-border overflow-hidden rounded-card border border-border bg-panel shadow-card">
            {activity.map((entry) => (
              <li key={entry.id} className="flex flex-wrap items-center gap-x-3 gap-y-1.5 p-4">
                <StatusBadge status={entry.status} />
                <Link
                  to={`/pet/${entry.reportId}`}
                  className="font-medium text-brand hover:underline"
                >
                  {entry.reportLabel}
                </Link>
                {entry.note && <span className="text-fg-muted">{entry.note}</span>}
                {entry.actorName && (
                  <span className="text-sm text-fg-subtle">by {entry.actorName}</span>
                )}
                <span className="ml-auto text-sm whitespace-nowrap text-fg-muted">
                  {formatDate(entry.createdAt)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Section>

      {recovered.length > 0 && (
        <Section title="Returned pets" description="Cases that ended the way they should.">
          <ul className="flex flex-col gap-3">
            {recovered.map((report) => (
              <li
                key={report.id}
                className="flex items-center gap-4 rounded-card border border-border bg-panel p-3 shadow-card"
              >
                <img
                  src={primaryPhotoUrl(report) ?? photoPlaceholder}
                  alt=""
                  className="size-14 shrink-0 rounded-control bg-surface-muted object-cover"
                  loading="lazy"
                />
                <div className="min-w-0">
                  <p className="font-medium text-fg">
                    <Link to={`/pet/${report.id}`} className="hover:underline">
                      {report.petName ?? 'Found pet report'}
                    </Link>
                  </p>
                  <p className="text-sm text-fg-muted">Returned {returnedOn(report)}</p>
                </div>
              </li>
            ))}
          </ul>
        </Section>
      )}
    </div>
  )
}

/**
 * A titled block of the dashboard. Local to this page — it exists only so the
 * five sections below cannot drift apart in spacing and heading size.
 */
function Section({ title, description, action, children }) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-semibold tracking-tight text-fg">{title}</h2>
          {description && <p className="text-fg-muted">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}

function primaryPhotoUrl(report) {
  const photo = report.photos.find((item) => item.isPrimary) ?? report.photos[0]
  return photo?.url
}

function returnedOn(report) {
  const entry = report.statusHistory.find((item) => item.status === REPORT_STATUSES.RETURNED)
  return entry ? `on ${formatDate(entry.createdAt)}` : ''
}
