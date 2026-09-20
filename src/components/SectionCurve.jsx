import { cn } from '@/utils/cn'

/**
 * A very shallow curve between two sections, in place of a hard edge.
 *
 * It belongs at the *end* of a section and is filled with the colour of the
 * section that follows, so the next chapter appears to rise into this one. The
 * curve is about 28–48px of travel across a whole desktop viewport: enough to
 * stop the page reading as stacked rectangles, nowhere near a wave.
 *
 * Use it sparingly — a page where every boundary curves reads as a template.
 *
 * @param {Object} props
 * @param {'surface'|'surface-alt'|'warm-band'|'surface-warm'|'sunken'} props.to
 *   The section below, which is what the curve is filled with.
 * @param {boolean} [props.flip]  Mirrors the curve, so consecutive boundaries
 *   do not all lean the same way.
 */
const FILLS = {
  surface: 'text-surface',
  'surface-alt': 'text-surface-alt',
  'warm-band': 'text-warm-band',
  'surface-warm': 'text-surface-warm',
  sunken: 'text-sunken',
}

export function SectionCurve({ to, flip = false, className }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 1440 48"
      preserveAspectRatio="none"
      className={cn(
        // -mb-px closes the hairline the browser leaves between a scaled SVG
        // and the section under it.
        'pointer-events-none -mb-px block h-8 w-full sm:h-12',
        FILLS[to],
        flip && '-scale-x-100',
        className,
      )}
    >
      <path
        d="M0 48V22c220 0 330-22 560-22s400 26 620 26 260-14 260-14V48Z"
        fill="currentColor"
      />
    </svg>
  )
}
