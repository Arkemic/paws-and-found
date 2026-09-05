import { CircleCheck, TriangleAlert } from 'lucide-react'
import { REPORT_TYPES, REPORT_TYPE_LABELS } from '@/constants'
import { cn } from '@/utils/cn'

/**
 * Lost / Found indicator — the single most important thing to read on a card.
 *
 * Lost is amber, Found is teal (docs/design-system.md). Colour is never the
 * only signal: each carries its own icon and the word itself, so the badge
 * still works in greyscale or for a colour-blind reader.
 */
const STYLES = {
  [REPORT_TYPES.LOST]: {
    icon: TriangleAlert,
    className: 'bg-lost-soft text-lost',
  },
  [REPORT_TYPES.FOUND]: {
    icon: CircleCheck,
    className: 'bg-found-soft text-found',
  },
}

/**
 * @param {Object} props
 * @param {'lost'|'found'} props.reportType
 * @param {'sm'|'md'} [props.size]
 */
export function ReportTypeBadge({ reportType, size = 'md', className }) {
  const style = STYLES[reportType]
  if (!style) return null

  const Icon = style.icon

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-control font-semibold tracking-wide uppercase',
        size === 'sm' ? 'px-1.5 py-0.5 text-[0.6875rem]' : 'px-2 py-1 text-xs',
        style.className,
        className,
      )}
    >
      <Icon size={size === 'sm' ? 12 : 14} aria-hidden="true" />
      {REPORT_TYPE_LABELS[reportType]}
    </span>
  )
}
