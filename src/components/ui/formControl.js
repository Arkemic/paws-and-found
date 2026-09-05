import { cn } from '@/utils/cn'

/**
 * Styling and accessibility helpers shared by Input, Textarea and Select.
 *
 * These live outside the component files so those files export components only
 * — mixing components and plain values in one module breaks Fast Refresh.
 */

/** Shared control styling, so inputs, selects and textareas look identical. */
export const controlClasses = cn(
  // h-11 matches Button's md size, so a select and a button sitting side by
  // side line up.
  'w-full rounded-control border bg-panel px-3 py-2 text-base text-fg',
  'min-h-11',
  // fg-muted, not fg-subtle: placeholders still need to be readable.
  'placeholder:text-fg-muted',
  'disabled:cursor-not-allowed disabled:bg-surface-muted disabled:opacity-60',
)

/**
 * Build the `aria-describedby` value for a control inside a Field, so the hint
 * and the validation error are both announced by screen readers.
 *
 * @param {string} id
 * @param {{ hint?: string, error?: string }} state
 * @returns {string|undefined}
 */
export function describedBy(id, { hint, error }) {
  const ids = [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean)
  return ids.length > 0 ? ids.join(' ') : undefined
}
