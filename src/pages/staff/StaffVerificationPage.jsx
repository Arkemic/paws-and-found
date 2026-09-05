import { useState } from 'react'
import { BadgeCheck, Check, Mail, Phone, ShieldCheck, X } from 'lucide-react'
import { Button, Card, CardBody, CardHeader, EmptyState, LoadingSkeleton, Textarea } from '@/components/ui'
import { PageHeader } from '@/components/PageHeader'
import { MatchCard } from '@/components/MatchCard'
import { MATCH_STATUSES_AWAITING_STAFF, MATCH_STATUS_LABELS } from '@/constants'
import { useAsync } from '@/hooks/useAsync'
import { matchService, userService } from '@/services'

async function loadVerificationQueue() {
  const [staff, pairings] = await Promise.all([
    userService.getCurrentUser(),
    matchService.getMatchesWithReports({ statuses: MATCH_STATUSES_AWAITING_STAFF }),
  ])

  // Reporters on both sides, so a coordinator can actually contact them.
  const reporterIds = [
    ...new Set(pairings.flatMap((p) => [p.lostReport.reporterId, p.foundReport.reporterId])),
  ]
  const reporters = await Promise.all(reporterIds.map((id) => userService.getUserById(id)))

  return {
    staff,
    pairings,
    reportersById: Object.fromEntries(reporters.map((user) => [user.id, user])),
  }
}

/**
 * Where a Pet Coordinator decides whether two reports are the same animal.
 *
 * The comparison itself is the same `MatchCard` the reporters see — a
 * coordinator should be looking at exactly what they were shown. What is added
 * here is the part only staff get: contact details for both sides, the running
 * case note, and the decision.
 */
export function StaffVerificationPage() {
  const { data, error, isLoading, reload } = useAsync(loadVerificationQueue)

  const header = (
    <PageHeader
      icon={BadgeCheck}
      eyebrow="Pet Coordinator"
      title="Verification"
      description="Compare a lost report against a found report before a handover is arranged."
      breadcrumb={[{ label: 'Staff workspace', to: '/staff' }, { label: 'Verification' }]}
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
          The verification queue could not be loaded: {error.message}
        </p>
      </div>
    )
  }

  const { staff, pairings, reportersById } = data

  return (
    <div className="flex flex-col gap-6">
      {header}

      {pairings.length === 0 ? (
        <EmptyState
          icon={ShieldCheck}
          title="Nothing waiting"
          description="When someone asks for a possible match to be checked, it will appear here."
        />
      ) : (
        <ul className="flex flex-col gap-6">
          {pairings.map(({ match, lostReport, foundReport }) => (
            <li key={match.id} className="flex flex-col gap-3">
              <MatchCard match={match} lostReport={lostReport} foundReport={foundReport} />
              <VerificationPanel
                match={match}
                staff={staff}
                reporters={[
                  reportersById[lostReport.reporterId],
                  reportersById[foundReport.reporterId],
                ]}
                onDone={reload}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function VerificationPanel({ match, staff, reporters, onDone }) {
  const [note, setNote] = useState(match.staffNotes ?? '')
  const [busyAction, setBusyAction] = useState(null)
  const [actionError, setActionError] = useState(null)

  const run = async (name, action) => {
    setBusyAction(name)
    setActionError(null)

    try {
      await action()
      onDone()
    } catch (caught) {
      setActionError(caught instanceof Error ? caught : new Error(String(caught)))
    } finally {
      setBusyAction(null)
    }
  }

  return (
    <Card>
      <CardHeader
        titleAs="h3"
        title="Coordinator decision"
        subtitle={`Currently ${MATCH_STATUS_LABELS[match.status]}.`}
      />

      <CardBody className="flex flex-col gap-4">
        <div>
          <h4 className="text-sm font-semibold text-fg">Coordination details</h4>
          <p className="mb-2 text-sm text-fg-muted">
            Shown to staff only, so you can reach both sides. Do not pass either person&apos;s
            details to the other.
          </p>

          <ul className="grid gap-3 sm:grid-cols-2">
            {reporters.map((reporter, index) => (
              <li key={reporter.id} className="rounded-control border border-border p-3 text-sm">
                <p className="font-medium text-fg">
                  {index === 0 ? 'Lost report' : 'Found report'} · {reporter.fullName}
                </p>
                <p className="mt-1 flex items-center gap-1.5 text-fg-muted">
                  <Mail size={14} className="shrink-0 text-fg-subtle" aria-hidden="true" />
                  {reporter.email}
                </p>
                <p className="flex items-center gap-1.5 text-fg-muted">
                  <Phone size={14} className="shrink-0 text-fg-subtle" aria-hidden="true" />
                  {reporter.phone}
                </p>
              </li>
            ))}
          </ul>
        </div>

        <Textarea
          label="Case note"
          value={note}
          onChange={(event) => setNote(event.target.value)}
          rows={3}
          maxLength={500}
          placeholder="e.g. Asked the owner to describe the collar tag before contact details are shared."
          hint="Sent to both reporters when you ask for more information. Kept on the case otherwise."
        />

        {actionError && (
          <p role="alert" className="text-sm text-danger">
            That could not be saved: {actionError.message}
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          <Button
            isLoading={busyAction === 'confirm'}
            disabled={Boolean(busyAction)}
            onClick={() =>
              run('confirm', () =>
                matchService.confirmMatch(match.id, {
                  actorId: staff.id,
                  staffId: staff.id,
                  note: note.trim(),
                }),
              )
            }
          >
            <Check size={16} aria-hidden="true" />
            Confirm match
          </Button>

          <Button
            variant="secondary"
            isLoading={busyAction === 'info'}
            disabled={Boolean(busyAction) || !note.trim()}
            onClick={() =>
              run('info', () =>
                matchService.requestMoreInformation(match.id, {
                  staffId: staff.id,
                  note: note.trim(),
                }),
              )
            }
          >
            Request more information
          </Button>

          {/* Pushed away from the two constructive actions. Ruling a pairing
              out is not undoable from this screen, and it should not sit a few
              pixels from "Confirm match". */}
          <Button
            variant="danger"
            className="sm:ml-auto"
            isLoading={busyAction === 'reject'}
            disabled={Boolean(busyAction)}
            onClick={() =>
              run('reject', () =>
                matchService.rejectMatch(match.id, { staffId: staff.id, note: note.trim() }),
              )
            }
          >
            <X size={16} aria-hidden="true" />
            Not the same pet
          </Button>
        </div>

        <p className="text-sm text-fg-muted">
          Confirming marks both reports as returned and tells both reporters. Ruling a pairing
          out leaves both reports active so the search continues.
        </p>
      </CardBody>
    </Card>
  )
}
