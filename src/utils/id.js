let counter = 0

/**
 * Generate a readable, prefixed id, e.g. "report-a1b2c3".
 *
 * This exists only because there is no database yet. Once the real backend
 * generates ids, it goes away.
 */
export function createId(prefix) {
  counter += 1
  const random = Math.random().toString(36).slice(2, 8)
  return `${prefix}-${random}${counter.toString(36)}`
}
