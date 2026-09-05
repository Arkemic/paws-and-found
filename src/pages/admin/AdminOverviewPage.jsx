import { Link } from 'react-router-dom'
import { Flag, FolderTree, ListChecks, ShieldHalf, Users } from 'lucide-react'
import { Button, Card, CardBody, CardHeader, LoadingSkeleton } from '@/components/ui'
import { PageHeader } from '@/components/PageHeader'
import { StatTile } from '@/components/StatTile'
import { StatusBadge } from '@/components/StatusBadge'
import { MODERATION_REASON_LABELS, REPORT_STATUSES, ROLE_LABELS } from '@/constants'
import { useAsync } from '@/hooks/useAsync'
import { categoryService, moderationService, petService, userService } from '@/services'
import { formatRelativeTime } from '@/utils/date'

async function loadAdminOverview() {
  const [users, reports, openCases, categories] = await Promise.all([
    userService.getUsers(),
    petService.getReports(),
    moderationService.getCasesWithContext({ status: 'open' }),
    categoryService.getCategories(),
  ])

  return { users, reports, openCases, categories }
}

/**
 * System oversight.
 *
 * Administration is about accounts, records, categories and moderation — not
 * day-to-day pet cases, which belong to the Pet Coordinators (CLAUDE.md §4.3).
 */
export function AdminOverviewPage() {
  const { data, error, isLoading } = useAsync(loadAdminOverview)

  const header = (
    <PageHeader
      icon={ShieldHalf}
      eyebrow="Administrator"
      title="Administration"
      description="Accounts, records, categories and moderation."
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
          The overview could not be loaded: {error.message}
        </p>
      </div>
    )
  }

  const { users, reports, openCases, categories } = data
  const suspended = users.filter((user) => user.accountStatus === 'suspended')
  const active = reports.filter((report) => report.status === REPORT_STATUSES.ACTIVE)
  const recentlyClosed = reports
    .filter((report) => report.status === REPORT_STATUSES.CLOSED)
    .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))
    .slice(0, 5)

  return (
    <div className="flex flex-col gap-6">
      {header}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile icon={Flag} label="Flags awaiting review" value={openCases.length} to="/admin/moderation" />
        <StatTile icon={Users} label="Accounts" value={users.length} to="/admin/users" />
        <StatTile icon={ListChecks} label="Active reports" value={active.length} to="/admin/reports" />
        <StatTile icon={FolderTree} label="Pet categories" value={categories.length} to="/admin/categories" />
      </div>

      {openCases.length > 0 && (
        <Card>
          <CardHeader
            titleAs="h2"
            title="Flags awaiting review"
            action={
              <Button as={Link} to="/admin/moderation" size="sm">
                Open moderation
              </Button>
            }
          />
          <CardBody>
            <ul className="flex flex-col divide-y divide-border">
              {openCases.slice(0, 4).map(({ moderationCase, report }) => (
                <li key={moderationCase.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2 text-sm">
                  <span className="font-medium text-fg">
                    {MODERATION_REASON_LABELS[moderationCase.reason]}
                  </span>
                  <Link to={`/pet/${report.id}`} className="text-brand hover:underline">
                    {report.petName ?? 'Found pet report'}
                  </Link>
                  <span className="text-fg-muted">
                    {formatRelativeTime(moderationCase.createdAt)}
                  </span>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      )}

      {suspended.length > 0 && (
        <Card>
          <CardHeader titleAs="h2" title="Suspended accounts" />
          <CardBody>
            <ul className="flex flex-col divide-y divide-border">
              {suspended.map((user) => (
                <li key={user.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2 text-sm">
                  <span className="font-medium text-fg">{user.fullName}</span>
                  <span className="text-fg-muted">{ROLE_LABELS[user.role]}</span>
                  <Link to="/admin/users" className="text-brand hover:underline">
                    Manage
                  </Link>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      )}

      <Card>
        <CardHeader titleAs="h2" title="Recently closed cases" />
        <CardBody>
          {recentlyClosed.length === 0 ? (
            <p className="text-sm text-fg-muted">No cases have been closed yet.</p>
          ) : (
            <ul className="flex flex-col divide-y divide-border">
              {recentlyClosed.map((report) => (
                <li key={report.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2 text-sm">
                  <Link to={`/pet/${report.id}`} className="font-medium text-brand hover:underline">
                    {report.petName ?? 'Found pet report'}
                  </Link>
                  <StatusBadge status={report.status} />
                  <span className="text-fg-muted">
                    {report.location.city} · {formatRelativeTime(report.updatedAt)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
    </div>
  )
}
