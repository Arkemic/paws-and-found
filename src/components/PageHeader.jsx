import { Breadcrumb } from './Breadcrumb'

/**
 * Standard top of every page: breadcrumb, heading, short description, and any
 * page-level actions.
 *
 * It also sets the browser tab title. React 19 hoists a `<title>` rendered
 * anywhere in the tree into `<head>`, so no extra hook is needed — but it does
 * mean every page must render a PageHeader, or the previous page's title
 * sticks.
 *
 * @param {Object} props
 * @param {string} props.title           Also used as the document title.
 * @param {string} [props.description]
 * @param {{ label: string, to?: string }[]} [props.breadcrumb]
 * @param {React.ReactNode} [props.actions]
 * @param {React.ElementType} [props.icon]  A Lucide icon, shown in a medallion
 *   beside the heading. Used by the staff and administrator workspaces, which
 *   otherwise open on a line of plain text and read like a different, plainer
 *   product than the public pages. Public pages lead with a photograph or an
 *   illustration instead, so they pass nothing.
 * @param {string} [props.eyebrow]  A short line above the heading, for a
 *   workspace to say whose it is.
 */
export function PageHeader({ title, description, breadcrumb, actions, icon: Icon, eyebrow }) {
  return (
    <div className="flex flex-col gap-2.5 border-b border-border pb-5">
      <title>{`${title} · Paws&Found`}</title>

      {breadcrumb && <Breadcrumb items={breadcrumb} />}

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-4">
          {Icon && (
            <span className="flex size-12 shrink-0 items-center justify-center rounded-card bg-brand-soft text-brand sm:size-14">
              <Icon size={26} aria-hidden="true" />
            </span>
          )}

          <div className="flex flex-col gap-0.5">
            {eyebrow && (
              <p className="text-xs font-medium tracking-wide text-fg-muted uppercase">{eyebrow}</p>
            )}
            <h1 className="text-3xl font-semibold tracking-tight text-balance text-fg sm:text-4xl">
              {title}
            </h1>
          </div>
        </div>

        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>

      {description && <p className="max-w-prose text-fg-muted">{description}</p>}
    </div>
  )
}
