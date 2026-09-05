/**
 * Seed pet categories.
 *
 * These start as the five species the reports already use. Administrators can
 * add and rename them (Phase 11), which is why they live in a table rather than
 * only in `SPECIES_LABELS`.
 *
 * `id` is the value stored on a report, so renaming a category changes only its
 * label — existing reports keep working.
 */

export const categories = [
  { id: 'dog', label: 'Dog', isActive: true, createdAt: '2026-01-05T00:30:00.000Z' },
  { id: 'cat', label: 'Cat', isActive: true, createdAt: '2026-01-05T00:30:00.000Z' },
  { id: 'bird', label: 'Bird', isActive: true, createdAt: '2026-01-05T00:30:00.000Z' },
  { id: 'rabbit', label: 'Rabbit', isActive: true, createdAt: '2026-01-05T00:30:00.000Z' },
  { id: 'other', label: 'Other', isActive: true, createdAt: '2026-01-05T00:30:00.000Z' },
]
