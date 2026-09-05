import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Flag, ShieldCheck } from 'lucide-react'
import photoPlaceholder from '@/assets/pet-photo-placeholder.png'
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  LoadingSkeleton,
  Textarea,
} from '@/components/ui'
import { Avatar } from '@/components/Avatar'
import { PageHeader } from '@/components/PageHeader'
import { ReportTypeBadge } from '@/components/ReportTypeBadge'
import { StatusBadge } from '@/components/StatusBadge'
import { MODERATION_REASON_LABELS } from '@/constants'
import { useAsync } from '@/hooks/useAsync'
import { moderationService, userService } from '@/services'
import { formatRelativeTime } from '@/utils/date'
import { cn } from '@/utils/cn'

const TABS = [
  { id: 'open', label: 'Awaiting review' },
  { id: 'actioned', label: 'Actioned' },
  { id: 'dismissed', label: 'Dismissed' },
]

async function loadModeration() {
  const [cases, admin] = await Promise.all([
    moderationService.getCasesWithContext(),
    userService.getCurrentUser(),
  ])
  return { cases, admin }
}

/**
 * Flags raised by the community, for an administrator to decide on.
 *
 * Only the four approved actions (CLAUDE.md §6.9). "Remove" closes a report
 * rather than deleting it — the record of what happened has to survive the
 * decision, and the reporter is always told the outcome.
 */
export function AdminModerationPage() {
  const { data, error, isLoading, reload } = useAsync(loadModeration)
  const [tab, setTab] = useState('open')

  const header = (
    <PageHeader
      icon={Flag}
      eyebrow="Administrator"
      title="Moderation"
      description="Reports flagged by the community, and what was decided."
      breadcrumb={[{ label: 'Administration', to: '/admin' }, { label: 'Moderation' }]}
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
          The moderation queue could not be loaded: {error.message}
        </p>
      </div>
    )
  }

  const { cases, admin } = data
  const countFor = (id) => cases.filter((item) => item.moderationCase.status === id).length
  const visible = cases.filter((item) => item.moderationCase.status === tab)

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
          icon={tab === 'open' ? ShieldCheck : Flag}
          title={tab === 'open' ? 'Nothing awaiting review' : 'Nothing here'}
          description={
            tab === 'open'
              ? 'When someone flags a report, it will appear here for a decision.'
              : 'Decisions you make will be recorded in this group.'
          }
        />
      ) : (
        <ul className="flex flex-col gap-4">
          {visible.map(({ moderationCase, report, reporter, reportedBy }) => (
            <li key={moderationCase.id}>
              <ModerationCase
                moderationCase={moderationCase}
                report={report}
                reporter={reporter}
                reportedBy={reportedBy}
                admin={admin}
                onDone={reload}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function ModerationCase({ moderationCase, report, reporter, reportedBy, admin, onDone }) {
  const [note, setNote] = useState(moderationCase.resolutionNote ?? '')
  const [busyAction, setBusyAction] = useState(null)
  const [actionError, setActionError] = useState(null)

  const isOpen = moderationCase.status === 'open'
  const primaryPhoto = report.photos.find((photo) => photo.isPrimary) ?? report.photos[0]

  const decide = async (action) => {
    setBusyAction(action)
    setActionError(null)

    try {
      await moderationService.applyDecision(moderationCase.id, {
        action,
        adminId: admin.id,
        note,
      })
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
        titleAs="h2"
        title={MODERATION_REASON_LABELS[moderationCase.reason]}
        subtitle={
          <span className="flex flex-wrap items-center gap-1.5">
            Flagged {formatRelativeTime(moderationCase.createdAt)} by
            <Avatar name={reportedBy.fullName} size="sm" />
            {reportedBy.fullName}
          </span>
        }
      />

      <CardBody className="flex flex-col gap-5">
        <blockquote className="rounded-control border-l-2 border-border-strong bg-surface-muted px-3 py-2 text-sm text-fg">
          {moderationCase.details || 'No further detail was given.'}
        </blockquote>

        {/* The content being complained about. An administrator should be able
            to judge a flag without leaving the queue, so the photograph and the
            opening of the description come with it. */}
        <div className="flex gap-4 rounded-control border border-border p-3">
          <img
            src={primaryPhoto?.url ?? photoPlaceholder}
            alt=""
            className="size-20 shrink-0 rounded-control bg-surface-muted object-cover"
            loading="lazy"
          />

          <div className="flex min-w-0 flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <ReportTypeBadge reportType={report.reportType} size="sm" />
              <StatusBadge status={report.status} />
            </div>
            <Link to={`/pet/${report.id}`} className="font-semibold text-brand hover:underline">
              {report.petName ?? 'Found pet report'}
            </Link>
            <p className="flex flex-wrap items-center gap-1.5 text-sm text-fg-muted">
              Filed by
              <Avatar name={reporter.fullName} size="sm" />
              {reporter.fullName}
              {reporter.accountStatus === 'suspended' && (
                <span className="font-medium text-danger">· account suspended</span>
              )}
            </p>
            <p className="line-clamp-3 text-sm text-fg-muted">{report.description}</p>
          </div>
        </div>

        {isOpen ? (
          <>
            <Textarea
              label="Decision note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              rows={2}
              maxLength={500}
              placeholder="What you decided and why."
              hint="Sent to the person who filed the report."
            />

            {actionError && (
              <p role="alert" className="text-sm text-danger">
                That could not be saved: {actionError.message}
              </p>
            )}

            {/* The two destructive decisions are separated from the two that
                are not. All four in one row put "Remove and suspend" a few
                pixels from "Dismiss flag". */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="secondary"
                  isLoading={busyAction === 'dismiss'}
                  disabled={Boolean(busyAction)}
                  onClick={() => decide('dismiss')}
                >
                  Dismiss flag
                </Button>
                <Button
                  variant="secondary"
                  isLoading={busyAction === 'warn'}
                  disabled={Boolean(busyAction)}
                  onClick={() => decide('warn')}
                >
                  Warn the reporter
                </Button>
              </div>

              <div className="flex flex-wrap gap-2 border-t border-border pt-3 sm:border-t-0 sm:pt-0">
                <Button
                  variant="danger"
                  isLoading={busyAction === 'remove'}
                  disabled={Boolean(busyAction)}
                  onClick={() => decide('remove')}
                >
                  Remove the report
                </Button>
                <Button
                  variant="danger"
                  isLoading={busyAction === 'suspend'}
                  disabled={Boolean(busyAction)}
                  onClick={() => decide('suspend')}
                >
                  Remove and suspend
                </Button>
              </div>
            </div>

            <p className="text-sm text-fg-muted">
              Removing closes the report rather than deleting it, so the record of what
              happened survives. The person who filed it is told either way.
            </p>
          </>
        ) : (
          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-semibold text-fg">Case history</h3>
            <ol className="flex flex-col gap-2 text-sm">
              <li className="flex gap-2">
                <span className="mt-1.5 size-2 shrink-0 rounded-full bg-status-match" aria-hidden="true" />
                <span>
                  <span className="font-medium text-fg">Flagged</span>
                  <span className="text-fg-muted">
                    {' '}
                    by {reportedBy.fullName} · {formatRelativeTime(moderationCase.createdAt)}
                  </span>
                </span>
              </li>
              <li className="flex gap-2">
                <span
                  className={cn(
                    'mt-1.5 size-2 shrink-0 rounded-full',
                    moderationCase.status === 'dismissed'
                      ? 'bg-status-closed'
                      : 'bg-status-returned',
                  )}
                  aria-hidden="true"
                />
                <span>
                  <span className="font-medium text-fg">
                    {moderationCase.status === 'dismissed' ? 'Dismissed' : 'Actioned'}
                  </span>
                  <span className="text-fg-muted"> by an administrator</span>
                  {moderationCase.resolutionNote && (
                    <span className="block text-fg-muted">{moderationCase.resolutionNote}</span>
                  )}
                </span>
              </li>
            </ol>
          </div>
        )}
      </CardBody>
    </Card>
  )
}
