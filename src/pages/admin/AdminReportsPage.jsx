import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ListChecks } from 'lucide-react'
import { Card, CardBody, EmptyState, Input, LoadingSkeleton, Select } from '@/components/ui'
import { PageHeader } from '@/components/PageHeader'
import { ReportTypeBadge } from '@/components/ReportTypeBadge'
import { StatusBadge } from '@/components/StatusBadge'
import { REPORT_STATUS_LABELS, REPORT_STATUS_ORDER, speciesLabel } from '@/constants'
import { useAsync } from '@/hooks/useAsync'
import { petService, userService } from '@/services'
import { orderedOptionsFromLabels } from '@/utils/options'
import { formatDate, formatRelativeTime } from '@/utils/date'

async function loadRecords() {
  const [reports, users] = await Promise.all([petService.getReports(), userService.getUsers()])
  return {
    reports,
    usersById: Object.fromEntries(users.map((user) => [user.id, user])),
  }
}

/**
 * Record oversight.
 *
 * Read-only on purpose. Administrators review records and check who filed
 * what; acting on a specific pet case is a Pet Coordinator's job, and removing
 * a report happens through moderation, where a reason is recorded and the
 * reporter is told (CLAUDE.md §4.3).
 */
export function AdminReportsPage() {
  const { data, error, isLoading } = useAsync(loadRecords)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')

  const header = (
    <PageHeader
      title="Reports"
      description="Every lost and found record in the system, and who filed it."
      breadcrumb={[{ label: 'Administration', to: '/admin' }, { label: 'Reports' }]}
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
          The records could not be loaded: {error.message}
        </p>
      </div>
    )
  }

  const { reports, usersById } = data
  const needle = search.trim().toLowerCase()

  const visible = reports.filter((report) => {
    if (status && report.status !== status) return false
    if (!needle) return true

    const reporter = usersById[report.reporterId]
    return [report.petName, report.breed, report.location.city, reporter?.fullName]
      .filter(Boolean)
      .some((value) => value.toLowerCase().includes(needle))
  })

  return (
    <div className="flex flex-col gap-6">
      {header}

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Search"
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Pet name, breed, city or reporter"
        />
        <Select
          label="Status"
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          options={[
            { value: '', label: 'Any status' },
            ...orderedOptionsFromLabels(REPORT_STATUS_LABELS, REPORT_STATUS_ORDER),
          ]}
        />
      </div>

      <p className="text-sm text-fg-muted" aria-live="polite">
        {visible.length} of {reports.length} {reports.length === 1 ? 'record' : 'records'}
      </p>

      {visible.length === 0 ? (
        <EmptyState
          icon={ListChecks}
          title="No records match"
          description="Try a broader search or a different status."
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {visible.map((report) => {
            const reporter = usersById[report.reporterId]

            return (
              <li key={report.id}>
                <Card>
                  <CardBody className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 flex-col gap-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <ReportTypeBadge reportType={report.reportType} size="sm" />
                        <StatusBadge status={report.status} />
                      </div>

                      <Link
                        to={`/pet/${report.id}`}
                        className="font-semibold text-fg hover:underline"
                      >
                        {report.petName ?? `${speciesLabel(report.species)} (name unknown)`}
                      </Link>

                      <p className="text-sm text-fg-muted">
                        {report.location.city} · {formatDate(report.incidentDate)}
                      </p>
                    </div>

                    <div className="flex shrink-0 flex-col gap-0.5 text-sm sm:items-end">
                      <span className="text-fg">{reporter?.fullName ?? 'Unknown reporter'}</span>
                      {reporter?.accountStatus === 'suspended' && (
                        <span className="text-danger">Account suspended</span>
                      )}
                      <span className="text-fg-muted">
                        Updated {formatRelativeTime(report.updatedAt)}
                      </span>
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
