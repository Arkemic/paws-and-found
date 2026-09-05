/**
 * Notification data access.
 *
 * Mock data only. No email, SMS or push infrastructure is built until the
 * backend requirements are confirmed (CLAUDE.md §6.8).
 */

import { createId } from '@/utils/id'
import { getTable } from './mockDb'
import { apiFetch } from './api'

/** An API notification in the shape the notification centre already reads. */
function notificationFromApi(row) {
  return {
    id: row.notification_id,
    type: row.type,
    title: row.title,
    body: row.body ?? '',
    reportId: row.report_id,
    matchId: row.match_id,
    isRead: row.is_read,
    createdAt: row.created_at,
  }
}


/** One user's notifications, newest first. `query` accepts: unreadOnly, limit. */
export async function getNotifications(_userId) {
  // The account comes from the session, not the argument: one account must not
  // be able to read another's notifications by passing a different id.
  const payload = await apiFetch('/notifications')
  return payload.data.map(notificationFromApi)
}

export async function getUnreadCount(_userId) {
  const payload = await apiFetch('/notifications')
  return payload.meta.unread
}

export async function markAsRead(id) {
  const payload = await apiFetch(`/notifications/${id}`, { method: 'PATCH' })
  return payload.data.map(notificationFromApi)
}

export async function markAllAsRead(_userId) {
  const payload = await apiFetch('/notifications', { method: 'PATCH' })
  return payload.data.map(notificationFromApi)
}

/**
 * STILL MOCK-BACKED. The API writes notifications itself inside the decision
 * transaction, so nothing in the live path calls this — only `moderationService`
 * does, and that is the next service to move across.
 */
export async function createNotification(input) {
  const notification = {
    id: createId('notif'),
    userId: input.userId,
    type: input.type,
    title: input.title,
    body: input.body ?? '',
    reportId: input.reportId ?? null,
    matchId: input.matchId ?? null,
    isRead: false,
    createdAt: new Date().toISOString(),
  }

  getTable('notifications').push(notification)

  return notification
}
