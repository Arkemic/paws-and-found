import { cn } from '@/utils/cn'

/**
 * Horizontal page shell: one place that owns max width and gutters, so every
 * page lines up and mobile padding never has to be re-invented.
 *
 * Widths come from the tokens in index.css:
 *   page   — 80rem, the default for dashboards and listings
 *   wizard — 50rem, the multi-step report form
 *   form   — 42rem, short single-column forms such as sign-in
 *   prose  — 45rem, long-form reading such as Help and About
 */
const WIDTHS = {
  page: 'max-w-(--container-page)',
  wizard: 'max-w-(--container-wizard)',
  form: 'max-w-(--container-form)',
  prose: 'max-w-(--container-prose)',
}

/**
 * @param {Object} props
 * @param {'page'|'wizard'|'form'|'prose'} [props.width]
 * @param {React.ElementType} [props.as]
 */
export function Container({ width = 'page', as: Component = 'div', className, children }) {
  return (
    <Component className={cn('mx-auto w-full px-4 sm:px-6 lg:px-8', WIDTHS[width], className)}>
      {children}
    </Component>
  )
}
