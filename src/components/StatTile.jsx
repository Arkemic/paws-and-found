import { Link } from 'react-router-dom'
import { cn } from '@/utils/cn'

/**
 * One number on a dashboard, with what it counts.
 *
 * Deliberately plain — CLAUDE.md §13 asks dashboards to prioritise useful case
 * information over decorative analytics, so there are no charts, sparklines or
 * trend arrows here. The number and its label are the point.
 *
 * @param {Object} props
 * @param {React.ElementType} props.icon
 * @param {string} props.label
 * @param {number} props.value
 * @param {string} [props.to]  Makes the whole tile a link.
 * @param {boolean} [props.emphasis]  For the one or two numbers that mean
 *   someone has to do something. Use it sparingly — if every tile is
 *   emphasised, none of them is.
 */
export function StatTile({ icon: Icon, label, value, to, emphasis = false, className }) {
  const content = (
    <>
      <span
        className={cn(
          'flex size-9 items-center justify-center rounded-control',
          emphasis ? 'bg-brand text-fg-inverted' : 'bg-brand-soft text-brand',
        )}
      >
        <Icon size={18} aria-hidden="true" />
      </span>
      <span className={cn('font-semibold text-fg', emphasis ? 'text-4xl' : 'text-2xl')}>
        {value}
      </span>
      <span className={cn('text-sm', emphasis ? 'font-medium text-fg' : 'text-fg-muted')}>
        {label}
      </span>
    </>
  )

  const classes = cn(
    'flex flex-col items-start gap-1 rounded-card border p-4',
    emphasis ? 'border-brand/30 bg-brand-soft' : 'border-border bg-panel',
    to && 'transition-colors hover:border-border-strong',
    className,
  )

  if (to) {
    return (
      <Link to={to} className={classes}>
        {content}
      </Link>
    )
  }

  return <div className={classes}>{content}</div>
}
