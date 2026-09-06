/**
 * In-memory mock database.
 *
 * THIS FILE IS TEMPORARY. The production database is deliberately not built yet
 * (CLAUDE.md §8), so this stands in for it while the frontend is developed.
 * When the real backend arrives, the services in this folder swap their
 * internals for API calls and this file is deleted.
 *
 * State lives in module scope: changes survive navigation and reset on a full
 * page reload, so a demo always starts from the same seed data.
 */

import * as seed from '@/mock'

function createInitialState() {
  return {
    users: structuredClone(seed.users),
    petReports: structuredClone(seed.petReports),
    matches: structuredClone(seed.matches),
    notifications: structuredClone(seed.notifications),
    moderationCases: structuredClone(seed.moderationCases),
    categories: structuredClone(seed.categories),
  }
}

let state = createInitialState()

/** Restore the seed data. */
export function resetMockDb() {
  state = createInitialState()
}

/**
 * Get one table.
 *
 * Services return these objects directly rather than copying them, so the rule
 * for callers is simple: treat anything a service returns as read-only. Change
 * data by calling a service method, never by assigning to a returned object.
 *
 * @param {'users'|'petReports'|'matches'|'notifications'|'moderationCases'|'categories'} name
 */
export function getTable(name) {
  const rows = state[name]
  if (!rows) throw new Error(`Unknown mock table: ${name}`)
  return rows
}

/** Thrown when a record does not exist, so callers can tell it apart from a real failure. */
export class NotFoundError extends Error {
  constructor(entity, id) {
    super(`${entity} "${id}" was not found.`)
    this.name = 'NotFoundError'
    this.code = 'NOT_FOUND'
  }
}

/**
 * Sort a copy of `rows` by the value `selector` returns.
 *
 * @param {Array} rows
 * @param {(row: Object) => string|number} selector
 * @param {'asc'|'desc'} [direction]
 */
export function sortBy(rows, selector, direction = 'desc') {
  const factor = direction === 'asc' ? 1 : -1
  return [...rows].sort((a, b) => {
    const left = selector(a)
    const right = selector(b)
    if (left === right) return 0
    return left > right ? factor : -factor
  })
}
