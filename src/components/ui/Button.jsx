import { cn } from '@/utils/cn'

/**
 * Colours come from the semantic tokens in index.css, so the whole app is
 * recoloured from one place. Behaviour that must not change: an explicit
 * `type`, a real disabled state, and a visible focus ring.
 */
const VARIANTS = {
  primary: 'bg-brand text-fg-inverted shadow-card hover:bg-brand-hover',
  secondary: 'bg-panel text-fg border border-border-strong hover:bg-surface-muted',
  ghost: 'bg-transparent text-fg hover:bg-surface-muted',
  // Amber. For the Lost-report action, where warmth and urgency are the point.
  // Dark text, because amber is too light to carry white text accessibly.
  accent: 'bg-accent text-fg shadow-card hover:bg-accent-hover',
  danger: 'bg-danger text-fg-inverted hover:bg-danger-hover',
}

/**
 * Heights are generous on purpose. WCAG 2.2 AA only asks for a 24x24 target,
 * but 44px is the comfortable size on a phone and it stops the interface
 * reading as a dense admin tool.
 */
const SIZES = {
  sm: 'h-9 px-3.5 text-sm gap-1.5',
  md: 'h-11 px-5 text-base gap-2',
  lg: 'h-13 px-7 text-base gap-2.5',
}

/**
 * @param {Object} props
 * @param {React.ElementType} [props.as]  e.g. `Link`, to render a link that
 *   looks like a button.
 * @param {'primary'|'secondary'|'ghost'|'accent'|'danger'} [props.variant]
 * @param {'sm'|'md'|'lg'} [props.size]
 * @param {'button'|'submit'|'reset'} [props.type] Defaults to "button" so a
 *   button inside a form never submits it by accident.
 * @param {boolean} [props.isLoading] Disables the button and announces progress.
 * @param {boolean} [props.fullWidth]
 * @param {React.ReactNode} props.children
 */
export function Button({
  as: Component = 'button',
  variant = 'primary',
  size = 'md',
  type = 'button',
  isLoading = false,
  fullWidth = false,
  disabled = false,
  className,
  children,
  ...rest
}) {
  // `as={Link}` renders a button-shaped link. `type` and `disabled` are only
  // valid on a real <button>, so they are dropped for anything else.
  const isNativeButton = Component === 'button'

  return (
    <Component
      type={isNativeButton ? type : undefined}
      disabled={isNativeButton ? disabled || isLoading : undefined}
      aria-disabled={!isNativeButton && (disabled || isLoading) ? true : undefined}
      aria-busy={isLoading || undefined}
      className={cn(
        'inline-flex items-center justify-center rounded-control font-medium',
        'transition-[background-color,color,box-shadow] duration-150',
        'disabled:cursor-not-allowed disabled:opacity-50',
        VARIANTS[variant],
        SIZES[size],
        fullWidth && 'w-full',
        className,
      )}
      {...rest}
    >
      {children}
    </Component>
  )
}
