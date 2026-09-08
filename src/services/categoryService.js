/**
 * Pet categories — the species list reports are filed under.
 *
 * Administrators manage this list and the changes are kept in MySQL. A
 * category's `id` is its code ('dog'), which is what a report actually stores,
 * so renaming one is always safe; removing one is not, which is why the API
 * refuses while any report still uses it.
 */

import { apiFetch } from './api'

/** An API category in the shape the interface already reads. */
function categoryFromApi(row) {
  return {
    id: row.code,
    categoryId: row.category_id,
    label: row.label,
    isActive: row.is_active ?? true,
    reportCount: row.report_count ?? 0,
  }
}

/**
 * Every category, active or not, with the number of reports filed against
 * each. Administrators only — the API refuses anyone else.
 */
export async function getCategories() {
  const payload = await apiFetch('/categories?all=1')
  return payload.data.map(categoryFromApi)
}

/** Only the ones that should appear in a dropdown. Public. */
export async function getActiveCategories() {
  const payload = await apiFetch('/categories')
  return payload.data.map(categoryFromApi)
}

/**
 * How many reports use each category, keyed by code.
 *
 * Derived from the same request as the list rather than counted separately:
 * the API already returns the figure, and asking twice invites the two to
 * disagree.
 */
export async function getCategoryUsage() {
  const categories = await getCategories()

  return Object.fromEntries(categories.map((category) => [category.id, category.reportCount]))
}

/**
 * Add a category. The code stored on reports is derived from the label by the
 * server, so that both sides cannot disagree about how it is spelled.
 */
export async function createCategory(label) {
  const payload = await apiFetch('/categories', {
    method: 'POST',
    body: JSON.stringify({ label }),
  })

  return categoryFromApi(payload.data)
}

/** Rename a category. Safe at any time — reports reference the code, not the label. */
export async function renameCategory(id, label) {
  const payload = await apiFetch(`/categories/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ label }),
  })

  return categoryFromApi(payload.data)
}

/**
 * Hide a category from the dropdowns without touching the reports that already
 * use it. This is the safe alternative to deleting.
 */
export async function setCategoryActive(id, isActive) {
  const payload = await apiFetch(`/categories/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ is_active: isActive }),
  })

  return categoryFromApi(payload.data)
}

/**
 * Delete a category outright. The API refuses while any report still uses it,
 * and says how many are in the way.
 */
export async function deleteCategory(id) {
  await apiFetch(`/categories/${id}`, { method: 'DELETE' })
}
