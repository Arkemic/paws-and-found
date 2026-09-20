import { cn } from '@/utils/cn'

/**
 * IMG-014, the community route pattern, as a decorative layer behind a
 * section's content.
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
 * @param {'far'|'near'} [props.scale]  `far` is the ambient setting — two or
 *   three motifs in a viewport. `near` brings the routes close enough to read
 *   as a journey; for a band that is about the journey.
 * @param {boolean} [props.fade]  Fades downwards (the default). Off for a
 *   layer that is already clipped or masked by its own container.
 * @param {string} [props.className]  e.g. a different height, or an opacity.
 */
export function PatternVeil({ scale = 'far', fade = true, className }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'pointer-events-none absolute inset-0 -z-10',
        scale === 'near' ? 'route-pattern-near' : 'route-pattern',
        fade && 'pattern-fade',
        className,
      )}
    />
  )
}

/**
 * IMG-016, the woven microtexture, as its own layer. The footer and a couple
 * of warm public sections only.
 */
export function WovenVeil({ className }) {
  return (
    <span
      aria-hidden="true"
      className={cn('woven-texture pointer-events-none absolute inset-0 -z-10', className)}
    />
  )
}
