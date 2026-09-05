import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Heart } from 'lucide-react'
import { Button, EmptyState, LoadingSkeleton } from '@/components/ui'
import { PageHeader } from '@/components/PageHeader'
import { MatchActions, MatchCard } from '@/components/MatchCard'
import { useAsync } from '@/hooks/useAsync'
import { matchService, petService, userService } from '@/services'

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

      {suggestions.length === 0 ? (
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
      ) : (
        <ul className="flex flex-col gap-5">
          {suggestions.map((suggestion) => (
            <li key={suggestion.id}>
              <MatchCard
                match={suggestion}
                lostReport={byId[suggestion.lostReportId]}
                foundReport={byId[suggestion.foundReportId]}
                actions={
                  <MatchActions
                    match={suggestion}
                    isBusy={busyId === suggestion.id}
                    onRequestVerification={() =>
                      act(suggestion, (match) =>
                        matchService.requestVerification(match, user.id),
                      )
                    }
                    onDismiss={() => act(suggestion, matchService.dismissMatch)}
                  />
                }
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
