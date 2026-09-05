/**
 * Join class names, dropping anything falsy.
 *
 * Deliberately dependency-free (CLAUDE.md §22 — no unnecessary dependencies).
 * It does not de-duplicate conflicting Tailwind utilities, so when a component
 * accepts a `className` override, put the incoming value LAST so it wins.
 *
 * @param {...(string|false|null|undefined)} classes
 * @returns {string}
 */
export function cn(...classes) {
  return classes.filter(Boolean).join(' ')
}
