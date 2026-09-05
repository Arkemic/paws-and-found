import { cn } from '@/utils/cn'

/**
 * A person, drawn from their initials.
 *
 * The staff and administrator workspaces are lists of names — who filed a
 * report, who flagged one, who is handling a case — and a column of plain text
 * reads like a spreadsheet rather than a system about people helping each
 * other. This gives every name a face-sized mark without needing a photograph
 * of anybody, which is the point: uploading real profile pictures is not in
 * scope, and inventing them would put invented faces on invented people.
 *
 * The colour is picked from the name, so the same person is the same colour on
 * every page. It is decoration, never information — the name is always beside
 * it, and the mark itself is hidden from screen readers.
 *
 * @param {Object} props
 * @param {string} props.name
 * @param {'sm'|'md'|'lg'} [props.size]
 */

/**
 * Five tints from the existing palette. All are pale enough that the ink token
 * paired with each clears AA at these small sizes; none of them is `danger`,
 * because a person is not an error.
 */
const TINTS = [
  'bg-brand-soft text-brand-hover',
  'bg-accent-soft text-lost',
  'bg-status-returned-soft text-success-ink',
  'bg-surface-muted text-fg',
  'bg-found-soft text-found',
]

const SIZES = {
  sm: 'size-7 text-xs',
  md: 'size-9 text-sm',
  lg: 'size-11 text-base',
}

export function Avatar({ name, size = 'md', className }) {
  const label = String(name ?? '').trim()

  return (
    <span
      aria-hidden="true"
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full font-semibold select-none',
        SIZES[size],
        TINTS[tintIndex(label)],
        className,
      )}
    >
      {initials(label)}
    </span>
  )
}

/** "Maria Santos" -> "MS". One word gives one letter, nothing gives a dash. */
function initials(name) {
  const words = name.split(/\s+/).filter(Boolean)
  if (words.length === 0) return '–'

  const first = words[0][0]
  const last = words.length > 1 ? words[words.length - 1][0] : ''

  return (first + last).toUpperCase()
}

/**
 * Sum the character codes and wrap.
 *
 * Not a hash in any serious sense — it only has to be stable and spread five
 * ways, and a student can read it in one line (CLAUDE.md §15).
 */
function tintIndex(name) {
  let total = 0
  for (const character of name) total += character.codePointAt(0)

  return total % TINTS.length
}
