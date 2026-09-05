import { REPORT_STATUSES, REPORT_STATUS_LABELS } from '@/constants'
import { cn } from '@/utils/cn'

/**
 * Where a report stands: Active, Possible Match, Returned, Closed.
 *
 * Deliberately quieter than ReportTypeBadge — a small dot plus text rather
 * than a filled badge — because type and status sit side by side and must not
 * compete. Type and status are separate concepts and never share a treatment.
 *
 * The dot is decorative; the label carries the meaning.
 */
const DOT_COLOURS = {
  [REPORT_STATUSES.ACTIVE]: 'bg-status-active',
  [REPORT_STATUSES.POSSIBLE_MATCH]: 'bg-status-match',
  [REPORT_STATUSES.RETURNED]: 'bg-status-returned',
  [REPORT_STATUSES.CLOSED]: 'bg-status-closed',
}

/**
 * @param {Object} props
 * @param {string} props.status  One of REPORT_STATUSES.
 */
export function StatusBadge({ status, className }) {
  const dot = DOT_COLOURS[status]
  if (!dot) return null

  return (
    <span className={cn('inline-flex items-center gap-1.5 text-xs text-fg-muted', className)}>
      <span className={cn('size-2 shrink-0 rounded-full', dot)} aria-hidden="true" />
      {REPORT_STATUS_LABELS[status]}
    </span>
  )
}
