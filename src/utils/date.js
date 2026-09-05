/**
 * Dates are stored as ISO strings and formatted at render time, so the stored
 * value stays locale-independent.
 */

/**
 * @param {string|Date|null|undefined} value
 * @returns {string} e.g. "August 12, 2026", or "" when there is no value.
 */
export function formatDate(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })
}

/**
 * @param {string|Date|null|undefined} value
 * @returns {string} e.g. "August 12, 2026 at 5:30 PM".
 */
export function formatDateTime(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleString('en-PH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

/**
 * Short relative label for notification lists — "3 hours ago". Falls back to a
 * full date once something is more than a month old, because "47 days ago" is
 * harder to place than the date itself.
 *
 * @param {string|Date} value
 * @param {Date} [now]  Injectable, so the output is predictable in a test.
 */
export function formatRelativeTime(value, now = new Date()) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  const seconds = Math.round((now.getTime() - date.getTime()) / 1000)
  if (seconds < 60) return 'just now'

  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`

  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`

  const days = Math.round(hours / 24)
  if (days < 30) return `${days} day${days === 1 ? '' : 's'} ago`

  return formatDate(date)
}

/**
 * Today as "YYYY-MM-DD", for the `max` attribute on date inputs — an incident
 * cannot have happened in the future.
 *
 * @returns {string}
 */
export function todayAsInputValue() {
  const now = new Date()
  const offsetMinutes = now.getTimezoneOffset()
  // Shift to local time before slicing, or users east of UTC get yesterday.
  return new Date(now.getTime() - offsetMinutes * 60000).toISOString().slice(0, 10)
}
