import { NavLink } from 'react-router-dom'
import { cn } from '@/utils/cn'

const linkClasses = ({ isActive }) =>
  cn(
    'flex items-center gap-2 rounded-control px-3 py-2 text-sm transition-colors',
    isActive
      ? 'bg-brand-soft font-medium text-brand-hover'
      : 'text-fg-muted hover:bg-surface-muted hover:text-fg',
  )

/**
 * Workspace navigation for the dashboard, staff and admin areas.
 *
 * On mobile it becomes a horizontally scrolling row above the content rather
 * than a drawer — there are only four or five links, so a drawer would be more
 * machinery than the problem needs.
 *
 * @param {Object} props
 * @param {string} props.label  Names the nav for screen readers, e.g. "My Account".
 * @param {{ to: string, label: string, icon: React.ElementType, end?: boolean }[]} props.items
 */
export function Sidebar({ label, items }) {
  return (
    // A panel from `lg` up, the same treatment Explore's filter sidebar uses, so
    // a signed-in workspace reads as part of the same site rather than as bare
    // links on the page ground. On mobile it stays a plain scrolling row: a
    // bordered card around four links would be chrome for its own sake.
    <nav
      aria-label={label}
      className="lg:w-60 lg:shrink-0 lg:rounded-card lg:border lg:border-border lg:bg-panel lg:p-3 lg:shadow-card"
    >
      <ul className="flex gap-1 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0">
        {items.map((item) => {
          const Icon = item.icon

          return (
            <li key={item.to} className="shrink-0 lg:shrink">
              <NavLink to={item.to} end={item.end} className={linkClasses}>
                <Icon size={16} aria-hidden="true" />
                <span className="whitespace-nowrap">{item.label}</span>
              </NavLink>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
