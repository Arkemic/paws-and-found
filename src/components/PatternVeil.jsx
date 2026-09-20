import { cn } from '@/utils/cn'

/**
 * The community pattern (IMG-014) as a decorative layer behind a section.
 *
 * It has to be its own element: the pattern is faded out with a mask, and a
 * mask applies to everything inside the element it sits on — put it on the
 * section itself and the section's own text fades with it.
 *
 * The parent must be `relative isolate`. `isolate` keeps the negative z-index
 * inside the section, so the layer sits behind the section's content but in
 * front of the section's own background.
 *
 * Decoration only: `aria-hidden`, no pointer events, and nothing on the page
 * should depend on seeing it.
 *
 * @param {Object} props
 * @param {string} [props.className]  e.g. a different height or opacity.
 */
export function PatternVeil({ className }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'pattern-community pattern-fade pointer-events-none absolute inset-0 -z-10',
        className,
      )}
    />
  )
}
