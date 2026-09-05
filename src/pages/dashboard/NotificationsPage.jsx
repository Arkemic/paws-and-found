import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Bell,
  CircleCheck,
  Flag,
  Heart,
  PawPrint,
  RefreshCw,
  ShieldCheck,
  XCircle,
} from 'lucide-react'
import { Button, EmptyState, LoadingSkeleton } from '@/components/ui'
import { PageHeader } from '@/components/PageHeader'
import { NOTIFICATION_TYPES } from '@/constants'
import { useAsync } from '@/hooks/useAsync'
import { notificationService, userService } from '@/services'
import { formatRelativeTime } from '@/utils/date'
import { cn } from '@/utils/cn'

/** An icon per event, so the list is scannable without reading every line. */
const TYPE_ICONS = {
  [NOTIFICATION_TYPES.MATCH_SUGGESTED]: Heart,
  [NOTIFICATION_TYPES.VERIFICATION_REQUESTED]: ShieldCheck,
  [NOTIFICATION_TYPES.STAFF_REVIEWED]: ShieldCheck,
  [NOTIFICATION_TYPES.MATCH_CONFIRMED]: CircleCheck,
  [NOTIFICATION_TYPES.MATCH_REJECTED]: XCircle,
  [NOTIFICATION_TYPES.REPORT_UPDATED]: RefreshCw,
  [NOTIFICATION_TYPES.STATUS_CHANGED]: RefreshCw,
  [NOTIFICATION_TYPES.PET_RETURNED]: PawPrint,
  [NOTIFICATION_TYPES.REPORT_FLAGGED]: Flag,
}

async function loadNotifications() {
  const user = await userService.getCurrentUser()
  const notifications = await notificationService.getNotifications(user.id)
  return { user, notifications }
}

/**
 * The notification centre.
 *
 * Shared by the user dashboard and the staff workspace — the list is the
 * current account's either way, so only the breadcrumb differs.
 *
 * @param {Object} props
 * @param {string} [props.workspacePath]
 * @param {string} [props.workspaceLabel]
 */
export function NotificationsPage({
  workspacePath = '/dashboard',
  workspaceLabel = 'My dashboard',
  // Where "See the match" goes. A coordinator acts on pairings in the
  // verification workspace; a user reviews them on their matches page.
  matchPath = '/dashboard/matches',
}) {
  const { data, error, isLoading, reload } = useAsync(loadNotifications)
  const [showUnreadOnly, setShowUnreadOnly] = useState(false)
  const [isBusy, setIsBusy] = useState(false)

  const header = (
    <PageHeader
      title="Notifications"
      description="Updates on your reports, possible matches and verification requests."
      breadcrumb={[{ label: workspaceLabel, to: workspacePath }, { label: 'Notifications' }]}
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
          Your notifications could not be loaded: {error.message}
        </p>
      </div>
    )
  }

  const { user, notifications } = data
  const unreadCount = notifications.filter((item) => !item.isRead).length
  const visible = showUnreadOnly ? notifications.filter((item) => !item.isRead) : notifications

  const markOne = async (id) => {
    await notificationService.markAsRead(id)
    reload()
  }

  const markAll = async () => {
    setIsBusy(true)
    try {
      await notificationService.markAllAsRead(user.id)
      reload()
    } finally {
      setIsBusy(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {header}

      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
        <div className="flex gap-1" role="tablist">
          {[
            { id: 'all', label: `All (${notifications.length})`, unreadOnly: false },
            { id: 'unread', label: `Unread (${unreadCount})`, unreadOnly: true },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={showUnreadOnly === tab.unreadOnly}
              onClick={() => setShowUnreadOnly(tab.unreadOnly)}
              className={cn(
                'rounded-control px-3 py-1.5 text-sm transition-colors',
                showUnreadOnly === tab.unreadOnly
                  ? 'bg-brand-soft font-medium text-brand-hover'
                  : 'text-fg-muted hover:text-fg',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={markAll}
          disabled={unreadCount === 0}
          isLoading={isBusy}
        >
          Mark all as read
        </Button>
      </div>

      {visible.length === 0 ? (
        <EmptyState
          icon={Bell}
          title={showUnreadOnly ? 'Nothing unread' : 'No notifications yet'}
          description={
            showUnreadOnly
              ? 'You are up to date.'
              : 'When a possible match is found, or one of your reports changes, you will hear about it here.'
          }
        />
      ) : (
        // Grouped by age and packed into divided rows rather than a stack of
        // separate cards. A notification list is read top to bottom in one
        // pass; twelve bordered panels made that a scroll.
        <div className="flex flex-col gap-6">
          {groupByAge(visible).map((group) => (
            <section key={group.label} className="flex flex-col gap-2">
              <h2 className="text-sm font-semibold text-fg-muted">{group.label}</h2>

              <ul className="flex flex-col divide-y divide-border overflow-hidden rounded-card border border-border bg-panel">
                {group.items.map((notification) => {
                  const Icon = TYPE_ICONS[notification.type] ?? Bell

                  return (
                    <li
                      key={notification.id}
                      className={cn(
                        'flex gap-3 p-4',
                        !notification.isRead && 'bg-brand-soft/40',
                      )}
                    >
                      <span
                        className={cn(
                          'mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-control',
                          notification.isRead
                            ? 'bg-surface-muted text-fg-muted'
                            : 'bg-brand-soft text-brand',
                        )}
                      >
                        <Icon size={16} aria-hidden="true" />
                      </span>

                      <div className="flex min-w-0 flex-1 flex-col gap-1">
                        <div className="flex flex-wrap items-baseline gap-x-2">
                          <h3 className="font-medium text-fg">{notification.title}</h3>
                          {!notification.isRead && (
                            <span className="rounded-control bg-brand px-1.5 py-0.5 text-[0.6875rem] font-medium text-fg-inverted">
                              New
                            </span>
                          )}
                          <span className="ml-auto text-sm whitespace-nowrap text-fg-muted">
                            {formatRelativeTime(notification.createdAt)}
                          </span>
                        </div>

                        {notification.body && (
                          <p className="text-sm text-fg-muted">{notification.body}</p>
                        )}

                        <div className="mt-1 flex flex-wrap gap-3">
                          {notification.reportId && (
                            <Link
                              to={`/pet/${notification.reportId}`}
                              className="inline-block py-1 text-sm font-medium text-brand hover:underline"
                            >
                              View the report
                            </Link>
                          )}
                          {notification.matchId && (
                            <Link
                              to={matchPath}
                              className="inline-block py-1 text-sm font-medium text-brand hover:underline"
                            >
                              See the match
                            </Link>
                          )}
                          {!notification.isRead && (
                            <button
                              type="button"
                              onClick={() => markOne(notification.id)}
                              className="py-1 text-sm text-fg-muted hover:text-fg hover:underline"
                            >
                              Mark as read
                              <span className="sr-only">: {notification.title}</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}

/**
 * Split a notification list into Today / This week / Earlier, keeping the
 * original newest-first order inside each group.
 *
 * Empty groups are dropped, so a quiet week does not render three headings
 * over one row.
 */
function groupByAge(notifications, now = new Date()) {
  const dayInMs = 24 * 60 * 60 * 1000
  const groups = [
    { label: 'Today', items: [] },
    { label: 'This week', items: [] },
    { label: 'Earlier', items: [] },
  ]

  for (const notification of notifications) {
    const age = now.getTime() - new Date(notification.createdAt).getTime()
    const index = age < dayInMs ? 0 : age < 7 * dayInMs ? 1 : 2
    groups[index].items.push(notification)
  }

  return groups.filter((group) => group.items.length > 0)
}
