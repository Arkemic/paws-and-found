import { cn } from '@/utils/cn'

/**
 * Grey placeholder block shown while a service call is in flight.
 *
 * `aria-hidden` because it carries no information — the region that is loading
 * should announce itself with `aria-busy` or visually hidden text instead.
 *
 * Sizing is either the default or whatever `className` provides — never both,
 * because `cn()` joins classes without resolving Tailwind conflicts, so an
 * `h-4` baked into the base would fight an `aspect-4/3` passed by the caller.
 *
 * @param {Object} props
 * @param {number} [props.lines]  How many bars to draw.
 * @param {string} [props.className] Sizing, e.g. "h-4 w-32". Replaces the default.
 */
export function LoadingSkeleton({ lines = 1, className }) {
  return (
    <div className="flex flex-col gap-2" aria-hidden="true">
      {Array.from({ length: lines }, (_, index) => (
        <div
          key={index}
          className={cn('animate-pulse rounded bg-surface-muted', className ?? 'h-4 w-full')}
        />
      ))}
    </div>
  )
}
