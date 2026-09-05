/**
 * Mock data barrel.
 *
 * Nothing outside `src/services/` should import from this folder. Components
 * and pages must go through the service layer instead (CLAUDE.md §9), because
 * that is the boundary the real backend will eventually replace.
 */

export { users } from './users'
export { petReports } from './petReports'
export { matches } from './matches'
export { notifications } from './notifications'
export { moderationCases } from './moderationCases'
export { categories } from './categories'
