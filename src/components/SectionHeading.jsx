/**
 * The heading that opens a section on a public page.
 *
 * Shared so the homepage, About and Help cannot drift into three different
 * section-title sizes — which is exactly what had happened before the redesign.
 *
 * @param {Object} props
 * @param {string} props.title
 * @param {string} [props.description]
 * @param {React.ReactNode} [props.action]   Sits opposite the title; ignored when centered.
 * @param {boolean} [props.centered]
 */
export function SectionHeading({ title, description, action, centered = false }) {
  return (
    <div
      className={
        centered
          ? 'flex flex-col items-center gap-2 text-center'
          : 'flex flex-wrap items-end justify-between gap-4'
      }
    >
      <div className="max-w-prose">
        <h2 className="text-[1.75rem] leading-[1.15] font-semibold tracking-tight text-balance text-fg sm:text-[2rem]">
          {title}
        </h2>
        {description && <p className="mt-2 text-[1.0625rem] text-fg-muted">{description}</p>}
      </div>
      {action}
    </div>
  )
}
