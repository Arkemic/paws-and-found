/**
 * Pet categories — the species list reports are filed under.
 *
 * Administrators manage this list. A category's `id` is what gets stored on a
 * report, so renaming is always safe; removing one is not, which is why it is
 * only allowed while nothing uses it.
 */

import { apiFetch } from './api'
import { NotFoundError, getTable, sortBy } from './mockDb'

/** Every category, active or not. */
export async function getCategories() {
  return sortBy(getTable('categories'), (category) => category.label, 'asc')
}

/** Only the ones that should appear in a dropdown. */
export async function getActiveCategories() {
  const payload = await apiFetch('/categories')

  // The interface keys species off `id`, and the API's stable species key is
  // its code ('dog'), not the numeric primary key — that is what a report's
  // `species` field holds.
  return payload.data.map((row) => ({
    id: row.code,
    categoryId: row.category_id,
    label: row.label,
    isActive: true,
  }))
}

export async function getCategoryUsage() {
  const reports = getTable('petReports')

  return Object.fromEntries(
    getTable('categories').map((category) => [
      category.id,
      reports.filter((report) => report.species === category.id).length,
    ]),
  )
}

/**
 * Add a category. The id is derived from the label so that reports store
 * something readable rather than a random string.
 *
 * @param {string} label
 */
export async function createCategory(label) {
  const trimmed = label.trim()
  if (!trimmed) throw new Error('A category needs a name.')

  const id = trimmed
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

  const rows = getTable('categories')
  if (rows.some((category) => category.id === id)) {
    throw new Error(`There is already a category called "${trimmed}".`)
  }

  const category = { id, label: trimmed, isActive: true, createdAt: new Date().toISOString() }
  rows.push(category)

  return category
}

/**
 * Rename a category. Safe at any time — reports reference the id, not the label.
 */
export async function renameCategory(id, label) {
  const trimmed = label.trim()
  if (!trimmed) throw new Error('A category needs a name.')

  const category = getTable('categories').find((row) => row.id === id)
  if (!category) throw new NotFoundError('Category', id)

  category.label = trimmed

  return category
}

/**
 * Hide a category from the dropdowns without touching the reports that already
 * use it. This is the safe alternative to deleting.
 */
export async function setCategoryActive(id, isActive) {
  const category = getTable('categories').find((row) => row.id === id)
  if (!category) throw new NotFoundError('Category', id)

  category.isActive = isActive

  return category
}

/**
 * Delete a category outright — refused while any report still uses it, because
 * that would leave those reports pointing at a species that no longer exists.
 */
export async function deleteCategory(id) {
  const usage = await getCategoryUsage()
  if (usage[id] > 0) {
    throw new Error(
      `${usage[id]} report${usage[id] === 1 ? '' : 's'} still use this category. Deactivate it instead.`,
    )
  }

  const rows = getTable('categories')
  const index = rows.findIndex((row) => row.id === id)
  if (index === -1) throw new NotFoundError('Category', id)

  rows.splice(index, 1)
}
