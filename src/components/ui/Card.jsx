import { cn } from '@/utils/cn'

/**
 * Generic surface for grouped content. Composed rather than configured, so a
 * pet card, a statistic tile and a match comparison can all be built from the
 * same primitive instead of becoming five near-identical components
 * (CLAUDE.md §17).
 *
 * @example
 * <Card>
 *   <CardHeader title="My Reports" action={<Button size="sm">New</Button>} />
 *   <CardBody>…</CardBody>
 * </Card>
 */
export function Card({ as: Component = 'div', className, children, ...rest }) {
  return (
    <Component
      className={cn('rounded-card border border-border bg-panel shadow-card', className)}
      {...rest}
    >
      {children}
    </Component>
  )
}

/**
 * @param {Object} props
 * @param {React.ReactNode} [props.title]
 * @param {React.ReactNode} [props.subtitle]
 * @param {React.ReactNode} [props.action]  Right-aligned control, e.g. a button.
 * @param {'h2'|'h3'|'h4'} [props.titleAs]  Pick the level that keeps the page's
 *   heading order correct — do not choose by visual size.
 */
export function CardHeader({ title, subtitle, action, titleAs: Heading = 'h3', className }) {
  return (
    <div
      className={cn(
        'flex items-start justify-between gap-4 border-b border-border px-5 py-4',
        className,
      )}
    >
      <div className="min-w-0">
        {title && <Heading className="truncate text-lg font-semibold text-fg">{title}</Heading>}
        {subtitle && <p className="mt-1 text-sm text-fg-muted">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}

export function CardBody({ className, children }) {
  return <div className={cn('px-5 py-5', className)}>{children}</div>
}

export function CardFooter({ className, children }) {
  return (
    <div className={cn('border-t border-border px-5 py-4', className)}>{children}</div>
  )
}
