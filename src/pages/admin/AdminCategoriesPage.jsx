import { useState } from 'react'
import { Check, FolderTree, Pencil, Trash2, X } from 'lucide-react'
import { Button, Card, CardBody, Input, LoadingSkeleton } from '@/components/ui'
import { PageHeader } from '@/components/PageHeader'
import { useAsync } from '@/hooks/useAsync'
import { categoryService } from '@/services'
import { cn } from '@/utils/cn'

async function loadCategories() {
  const [categories, usage] = await Promise.all([
    categoryService.getCategories(),
    categoryService.getCategoryUsage(),
  ])
  return { categories, usage }
}

/**
 * The species list reports are filed under.
 *
 * A category's id is what gets stored on a report, so renaming is always safe.
 * Deleting is only offered while nothing uses it — otherwise those reports
 * would point at a species that no longer exists. Deactivating is the safe way
 * to retire one.
 *
 * Breed management is deliberately not here: the roadmap defers it until the
 * instructor's database requirements are known.
 */
export function AdminCategoriesPage() {
  const { data, error, isLoading, reload } = useAsync(loadCategories)
  const [newLabel, setNewLabel] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editLabel, setEditLabel] = useState('')
  const [actionError, setActionError] = useState(null)
  const [isBusy, setIsBusy] = useState(false)

  const header = (
    <PageHeader
      icon={FolderTree}
      eyebrow="Administrator"
      title="Pet categories"
      description="The species list that reports, filters and matching are built from."
      breadcrumb={[{ label: 'Administration', to: '/admin' }, { label: 'Pet categories' }]}
    />
  )

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        {header}
        <LoadingSkeleton lines={5} />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col gap-6">
        {header}
        <p role="alert" className="text-sm text-danger">
          The categories could not be loaded: {error.message}
        </p>
      </div>
    )
  }

  const { categories, usage } = data

  const run = async (action) => {
    setIsBusy(true)
    setActionError(null)
    try {
      await action()
      reload()
    } catch (caught) {
      setActionError(caught instanceof Error ? caught : new Error(String(caught)))
    } finally {
      setIsBusy(false)
    }
  }

  const add = async (event) => {
    event.preventDefault()
    await run(async () => {
      await categoryService.createCategory(newLabel)
      setNewLabel('')
    })
  }

  const saveRename = async (id) => {
    await run(async () => {
      await categoryService.renameCategory(id, editLabel)
      setEditingId(null)
    })
  }

  return (
    <div className="flex flex-col gap-6">
      {header}

      <Card>
        <CardBody>
          <form onSubmit={add} className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <Input
              label="Add a category"
              value={newLabel}
              onChange={(event) => setNewLabel(event.target.value)}
              maxLength={40}
              placeholder="e.g. Turtle"
              className="sm:flex-1"
            />
            <Button type="submit" disabled={!newLabel.trim() || isBusy}>
              Add category
            </Button>
          </form>
        </CardBody>
      </Card>

      {actionError && (
        <p role="alert" className="text-sm text-danger">
          {actionError.message}
        </p>
      )}

      {/* Compact rows, same as the user list. Nine categories as nine cards
          was a page of scrolling to read nine words. */}
      <div className="overflow-x-auto rounded-card border border-border bg-panel">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-surface-muted text-fg">
            <tr>
              <th scope="col" className="px-4 py-2.5 font-medium">
                Category
              </th>
              <th scope="col" className="hidden px-2 py-2.5 font-medium sm:table-cell">
                Reports
              </th>
              <th scope="col" className="px-2 py-2.5 font-medium">
                Status
              </th>
              <th scope="col" className="px-4 py-2.5 text-right font-medium">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-border">
            {categories.map((category) => {
              const inUse = usage[category.id] ?? 0
              const isEditing = editingId === category.id

              if (isEditing) {
                return (
                  <tr key={category.id} className="bg-surface">
                    <td colSpan={4} className="px-4 py-3">
                      <div className="flex flex-wrap items-end gap-2">
                        <Input
                          label={`Rename ${category.label}`}
                          value={editLabel}
                          onChange={(event) => setEditLabel(event.target.value)}
                          maxLength={40}
                        />
                        <Button size="sm" onClick={() => saveRename(category.id)} disabled={isBusy}>
                          <Check size={14} aria-hidden="true" />
                          Save
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                          <X size={14} aria-hidden="true" />
                          Cancel
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              }

              return (
                <tr key={category.id} className="align-middle transition-colors hover:bg-surface">
                  <td className="px-4 py-3">
                    <p className="font-medium text-fg">{category.label}</p>
                    <p className="text-fg-muted">
                      Stored as <code>{category.id}</code>
                      <span className="sm:hidden">
                        {' '}
                        · {inUse} {inUse === 1 ? 'report' : 'reports'}
                      </span>
                    </p>
                  </td>

                  <td className="hidden px-2 py-3 text-fg-muted tabular-nums sm:table-cell">
                    {inUse}
                  </td>

                  <td className="px-2 py-3">
                    <span
                      className={cn(
                        'inline-block rounded-pill px-2.5 py-0.5 text-xs font-medium',
                        category.isActive
                          ? 'bg-success-soft text-success-ink'
                          : 'bg-surface-muted text-fg',
                      )}
                    >
                      {category.isActive ? 'Available' : 'Hidden'}
                    </span>
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex flex-wrap justify-end gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={isBusy}
                        onClick={() => {
                          setEditingId(category.id)
                          setEditLabel(category.label)
                        }}
                      >
                        <Pencil size={14} aria-hidden="true" />
                        Rename
                        <span className="sr-only"> {category.label}</span>
                      </Button>

                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={isBusy}
                        onClick={() =>
                          run(() =>
                            categoryService.setCategoryActive(category.id, !category.isActive),
                          )
                        }
                      >
                        {category.isActive ? 'Deactivate' : 'Reactivate'}
                        <span className="sr-only"> {category.label}</span>
                      </Button>

                      {/* Only offered while nothing points at it. */}
                      {inUse === 0 && (
                        <Button
                          size="sm"
                          variant="danger"
                          disabled={isBusy}
                          onClick={() => run(() => categoryService.deleteCategory(category.id))}
                        >
                          <Trash2 size={14} aria-hidden="true" />
                          Delete
                          <span className="sr-only"> {category.label}</span>
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <p className="text-sm text-fg-muted">
        Renaming is always safe — reports store the category id, not its name. A category in
        use cannot be deleted; deactivate it instead, which hides it from new reports without
        touching the ones already filed.
      </p>
    </div>
  )
}
