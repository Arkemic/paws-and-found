import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Heart } from 'lucide-react'
import { Button, EmptyState, LoadingSkeleton } from '@/components/ui'
import { PageHeader } from '@/components/PageHeader'
import { MatchCard } from '@/components/MatchCard'
import { MATCH_STATUSES, MATCH_STATUS_LABELS } from '@/constants'
import { useAsync } from '@/hooks/useAsync'
import { matchService } from '@/services'
import { cn } from '@/utils/cn'

const TABS = [
  { id: 'open', label: 'Open', statuses: [MATCH_STATUSES.SUGGESTED] },
  {
    id: 'review',
    label: 'With a coordinator',
    statuses: [MATCH_STATUSES.VERIFICATION_REQUESTED, MATCH_STATUSES.UNDER_REVIEW],
  },
  { id: 'confirmed', label: 'Confirmed', statuses: [MATCH_STATUSES.CONFIRMED] },
  {
    id: 'closed',
    label: 'Ruled out',
    statuses: [MATCH_STATUSES.REJECTED, MATCH_STATUSES.DISMISSED],
  },
]

const loadAllMatches = () => matchService.getMatchesWithReports()

/**
 * Every stored pairing in the system, for a coordinator to look through.
 *
 * Read-only: deciding on a pairing happens in the verification workspace, so
 * there is one place where confirming or rejecting can be done, with the
 * reporters' details to hand.
 */
export function StaffMatchesPage() {
  const [tab, setTab] = useState('review')
  const { data, error, isLoading } = useAsync(loadAllMatches)

  const header = (
    <PageHeader
      icon={Heart}
      eyebrow="Pet Coordinator"
      title="Match queue"
      description="Possible matches raised between lost and found reports, highest score first."
      breadcrumb={[{ label: 'Staff workspace', to: '/staff' }, { label: 'Match queue' }]}
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
          The match queue could not be loaded: {error.message}
        </p>
      </div>
    )
  }

  const countFor = (statuses) =>
    data.filter((item) => statuses.includes(item.match.status)).length

  const activeTab = TABS.find((item) => item.id === tab)
  const visible = data.filter((item) => activeTab.statuses.includes(item.match.status))

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
            <span className="ml-1.5 text-fg-muted">{countFor(item.statuses)}</span>
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <EmptyState
          icon={Heart}
          title="Nothing here"
          description="Pairings appear in this group as they move through review."
        />
      ) : (
        <ul className="flex flex-col gap-5">
          {visible.map(({ match, lostReport, foundReport }) => (
            <li key={match.id}>
              <MatchCard
                match={match}
                lostReport={lostReport}
                foundReport={foundReport}
                actions={
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-sm text-fg-muted">
                      {MATCH_STATUS_LABELS[match.status]}
                    </span>
                    {activeTab.id === 'review' && (
                      <Button as={Link} to="/staff/verification" size="sm">
                        Review this pairing
                      </Button>
                    )}
                  </div>
                }
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
