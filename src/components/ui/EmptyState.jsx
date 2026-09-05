import { cn } from '@/utils/cn'

/**
 * Shown when a list has nothing in it — no reports, no matches, no search
 * results. Every list in the app should have one (CLAUDE.md §20).
 *
 * Pass either an `illustration` (for a page-level empty result) or an `icon`
 * (for a smaller, inline one) — not both.
 *
 * @param {Object} props
 * @param {string} [props.illustration]  Imported image source.
 * @param {React.ElementType} [props.icon]  A lucide icon component.
 * @param {string} props.title
 * @param {string} [props.description]
 * @param {React.ReactNode} [props.action]  Usually a Button or a Link.
 */
export function EmptyState({ illustration, icon: Icon, title, description, action, className }) {
  return (
    <div
      className={cn(
        'flex flex-col items-center gap-2 rounded-card border border-dashed border-border px-6 py-10 text-center',
        className,
      )}
    >
      {/* Decorative: the title and description carry the meaning. */}
      {illustration && <img src={illustration} alt="" className="mb-2 w-full max-w-56" />}
      {!illustration && Icon && <Icon size={28} className="text-fg-subtle" aria-hidden="true" />}
      <p className="font-medium text-fg">{title}</p>
      {description && <p className="max-w-prose text-sm text-fg-muted">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}
