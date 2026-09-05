import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronDown, ChevronUp, FileText, Heart, PawPrint } from 'lucide-react'
import photoPlaceholder from '@/assets/pet-photo-placeholder.png'
import { EmptyState, LoadingSkeleton } from '@/components/ui'
import { PageHeader } from '@/components/PageHeader'
import { ReportTypeBadge } from '@/components/ReportTypeBadge'
import { StatusBadge } from '@/components/StatusBadge'
import {
  REPORT_STATUSES,
  REPORT_STATUS_LABELS,
  REPORT_STATUS_ORDER,
  speciesLabel,
} from '@/constants'
import { useAsync } from '@/hooks/useAsync'
import { matchService, petService } from '@/services'
import { formatDate, formatRelativeTime } from '@/utils/date'
import { cn } from '@/utils/cn'

/**
 * Queue tabs.
 *
 * These are the four real report statuses, not the roadmap's "New / Pending
 * Review" — those describe a staff review state the data model does not have,
 * and inventing one to fill a tab would be the wrong way round. If the team
 * wants an explicit review state, it should be added deliberately.
 */
const TABS = [
  { id: 'all', label: 'All' },
  ...REPORT_STATUS_ORDER.map((status) => ({ id: status, label: REPORT_STATUS_LABELS[status] })),
]

async function loadQueue() {
  const [reports, matches] = await Promise.all([petService.getReports(), matchService.getMatches()])
  return { reports, matches }
}

export function StaffReportsPage() {
  const [tab, setTab] = useState(REPORT_STATUSES.ACTIVE)
  // Most recently touched first — where a coordinator picks up from.
  const [sort, setSort] = useState({ key: 'updated', direction: 'desc' })
  const { data, error, isLoading } = useAsync(loadQueue)

  // Clicking the active column flips it; clicking a new one starts ascending.
  const toggleSort = (key) =>
    setSort((current) =>
      current.key === key
        ? { key, direction: current.direction === 'asc' ? 'desc' : 'asc' }
        : { key, direction: 'asc' },
    )

  const header = (
    <PageHeader
      icon={FileText}
      eyebrow="Pet Coordinator"
      title="Report queue"
      description="Every lost and found report in the system, grouped by where it stands."
      breadcrumb={[{ label: 'Staff workspace', to: '/staff' }, { label: 'Report queue' }]}
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
          The queue could not be loaded: {error.message}
        </p>
      </div>
    )
  }

  const { reports, matches } = data
  const countFor = (id) =>
    id === 'all' ? reports.length : reports.filter((report) => report.status === id).length

  const visible = tab === 'all' ? reports : reports.filter((report) => report.status === tab)

  const matchCountFor = (reportId) =>
    matches.filter((match) => match.lostReportId === reportId || match.foundReportId === reportId)
      .length

  // What each sortable column compares on. Dates are ISO strings, so they sort
  // correctly as text; status sorts by workflow order rather than alphabetically.
  const sortValues = {
    report: (report) => (report.petName ?? speciesLabel(report.species)).toLowerCase(),
    location: (report) => report.location.city.toLowerCase(),
    date: (report) => report.incidentDate,
    status: (report) => REPORT_STATUS_ORDER.indexOf(report.status),
    match: (report) => matchCountFor(report.id),
    updated: (report) => report.updatedAt,
  }

  const readValue = sortValues[sort.key]
  const sorted = [...visible].sort((a, b) => {
    const left = readValue(a)
    const right = readValue(b)
    if (left === right) return 0
    return (left < right ? -1 : 1) * (sort.direction === 'asc' ? 1 : -1)
  })

  const headerProps = { sort, onSort: toggleSort }

  return (
    <div className="flex flex-col gap-6">
      {header}

      <div className="flex flex-wrap gap-1 overflow-x-auto border-b border-border" role="tablist">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            onClick={() => setTab(item.id)}
            className={cn(
              '-mb-px shrink-0 border-b-2 px-3 py-2 text-sm whitespace-nowrap transition-colors',
              tab === item.id
                ? 'border-brand font-medium text-brand-hover'
                : 'border-transparent text-fg-muted hover:text-fg',
            )}
          >
            {item.label}
            <span className="ml-1.5 text-fg-muted">{countFor(item.id)}</span>
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <EmptyState
          icon={PawPrint}
          title="Nothing in this queue"
          description="Reports will appear here as they reach this status."
        />
      ) : (
        // A management list, not a stack of cards: a coordinator scanning
        // twenty-four reports needs rows they can compare, not twenty-four
        // panels. Secondary columns drop out on narrow screens rather than
        // forcing the whole table to scroll sideways.
        <div className="overflow-x-auto rounded-card border border-border bg-panel">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-surface-muted text-fg">
              <tr>
                <th scope="col" className="w-20 px-4 py-2.5 font-medium">
                  <span className="sr-only">Photo</span>
                </th>
                <SortableHeader label="Report" sortKey="report" {...headerProps} />
                <SortableHeader
                  label="Location"
                  sortKey="location"
                  className="hidden md:table-cell"
                  {...headerProps}
                />
                <SortableHeader
                  label="Date"
                  sortKey="date"
                  className="hidden lg:table-cell"
                  {...headerProps}
                />
                <SortableHeader label="Status" sortKey="status" {...headerProps} />
                <SortableHeader
                  label="Match"
                  sortKey="match"
                  className="hidden sm:table-cell"
                  {...headerProps}
                />
                <SortableHeader
                  label="Updated"
                  sortKey="updated"
                  className="hidden xl:table-cell"
                  {...headerProps}
                />
              </tr>
            </thead>

            <tbody className="divide-y divide-border">
              {sorted.map((report) => {
                const matchCount = matchCountFor(report.id)
                const primaryPhoto =
                  report.photos.find((photo) => photo.isPrimary) ?? report.photos[0]

                return (
                  <tr key={report.id} className="align-middle transition-colors hover:bg-surface">
                    <td className="px-4 py-3">
                      <img
                        src={primaryPhoto?.url ?? photoPlaceholder}
                        alt=""
                        className="size-11 rounded-control bg-surface-muted object-cover"
                        loading="lazy"
                      />
                    </td>

                    <td className="px-2 py-3">
                      <div className="flex flex-col gap-1">
                        <Link
                          to={`/pet/${report.id}`}
                          className="font-medium text-fg hover:underline"
                        >
                          {report.petName ?? `${speciesLabel(report.species)} (name unknown)`}
                        </Link>
                        <div className="flex flex-wrap items-center gap-2">
                          <ReportTypeBadge reportType={report.reportType} size="sm" />
                          <span className="text-fg-muted">
                            {report.breed || speciesLabel(report.species)}
                          </span>
                        </div>
                        {/* The columns hidden on narrow screens, folded into
                            the one column that is always visible. */}
                        <span className="text-fg-muted md:hidden">
                          {report.location.city} · {formatDate(report.incidentDate)}
                        </span>
                      </div>
                    </td>

                    <td className="hidden px-2 py-3 text-fg-muted md:table-cell">
                      {report.location.city}
                    </td>

                    <td className="hidden px-2 py-3 whitespace-nowrap text-fg-muted lg:table-cell">
                      {formatDate(report.incidentDate)}
                    </td>

                    <td className="px-2 py-3">
                      <StatusBadge status={report.status} />
                    </td>

                    <td className="hidden px-2 py-3 sm:table-cell">
                      {matchCount > 0 ? (
                        <Link
                          to="/staff/matches"
                          className="inline-flex items-center gap-1 whitespace-nowrap text-brand hover:underline"
                        >
                          <Heart size={14} aria-hidden="true" />
                          {matchCount}
                          <span className="sr-only">
                            possible {matchCount === 1 ? 'match' : 'matches'}
                          </span>
                        </Link>
                      ) : (
                        <span className="text-fg-muted">—</span>
                      )}
                    </td>

                    <td className="hidden px-4 py-3 whitespace-nowrap text-fg-muted xl:table-cell">
                      {formatRelativeTime(report.updatedAt)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

/**
 * One sortable column header.
 *
 * `aria-sort` is what tells a screen reader which column the table is ordered
 * by and in which direction — without it the arrow is meaningless to anyone
 * not looking at it.
 */
function SortableHeader({ label, sortKey, sort, onSort, className }) {
  const isActive = sort.key === sortKey
  const Arrow = sort.direction === 'asc' ? ChevronUp : ChevronDown

  return (
    <th
      scope="col"
      aria-sort={isActive ? (sort.direction === 'asc' ? 'ascending' : 'descending') : 'none'}
      className={cn('px-2 py-2.5 font-medium', className)}
    >
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={cn(
          'inline-flex items-center gap-1 hover:underline',
          isActive && 'font-semibold',
        )}
      >
        {label}
        {isActive && <Arrow size={14} aria-hidden="true" />}
      </button>
    </th>
  )
}
