import { useState } from 'react'
import { Users } from 'lucide-react'
import { Button, EmptyState, Input, LoadingSkeleton, Select } from '@/components/ui'
import { Avatar } from '@/components/Avatar'
import { PageHeader } from '@/components/PageHeader'
import { ROLE_LABELS } from '@/constants'
import { useAsync } from '@/hooks/useAsync'
import { userService } from '@/services'
import { optionsFromLabels } from '@/utils/options'
import { formatDate } from '@/utils/date'
import { cn } from '@/utils/cn'

async function loadUsers() {
  const [users, currentUser] = await Promise.all([
    userService.getUsers(),
    userService.getCurrentUser(),
  ])
  return { users, currentUser }
}

/**
 * Account management.
 *
 * An administrator can change someone's role and suspend or reinstate an
 * account — but never their own, so the last administrator cannot lock
 * themselves out of the system by accident.
 */
export function AdminUsersPage() {
  const { data, error, isLoading, reload } = useAsync(loadUsers)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [busyId, setBusyId] = useState(null)

  const header = (
    <PageHeader
      icon={Users}
      eyebrow="Administrator"
      title="Users"
      description="Community members, Pet Coordinators and administrators."
      breadcrumb={[{ label: 'Administration', to: '/admin' }, { label: 'Users' }]}
    />
  )

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        {header}
        <LoadingSkeleton lines={6} />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col gap-6">
        {header}
        <p role="alert" className="text-sm text-danger">
          The account list could not be loaded: {error.message}
        </p>
      </div>
    )
  }

  const { users, currentUser } = data
  const needle = search.trim().toLowerCase()

  const visible = users.filter((user) => {
    if (roleFilter && user.role !== roleFilter) return false
    if (statusFilter && user.accountStatus !== statusFilter) return false
    if (!needle) return true
    return (
      user.fullName.toLowerCase().includes(needle) || user.email.toLowerCase().includes(needle)
    )
  })

  const run = async (userId, action) => {
    setBusyId(userId)
    try {
      await action()
      reload()
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {header}

      <div className="grid gap-4 sm:grid-cols-3">
        <Input
          label="Search"
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Name or email"
        />
        <Select
          label="Role"
          value={roleFilter}
          onChange={(event) => setRoleFilter(event.target.value)}
          options={[{ value: '', label: 'Any role' }, ...optionsFromLabels(ROLE_LABELS)]}
        />
        <Select
          label="Account status"
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          options={[
            { value: '', label: 'Any status' },
            { value: 'active', label: 'Active' },
            { value: 'suspended', label: 'Suspended' },
          ]}
        />
      </div>

      <p className="text-sm text-fg-muted" aria-live="polite">
        {visible.length} {visible.length === 1 ? 'account' : 'accounts'}
      </p>

      {visible.length === 0 ? (
        <EmptyState icon={Users} title="No accounts match" description="Try a broader search." />
      ) : (
        // Compact rows rather than a card per person: managing accounts means
        // comparing them, and one card each turned seven users into a page of
        // scrolling.
        <div className="overflow-x-auto rounded-card border border-border bg-panel">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-surface-muted text-fg">
              <tr>
                <th scope="col" className="px-4 py-2.5 font-medium">
                  User
                </th>
                <th scope="col" className="px-2 py-2.5 font-medium">
                  Role
                </th>
                <th scope="col" className="hidden px-2 py-2.5 font-medium sm:table-cell">
                  Status
                </th>
                <th scope="col" className="hidden px-2 py-2.5 font-medium lg:table-cell">
                  Joined
                </th>
                <th scope="col" className="px-4 py-2.5 text-right font-medium">
                  Action
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-border">
              {visible.map((user) => {
                const isSelf = user.id === currentUser?.id
                const isSuspended = user.accountStatus === 'suspended'

                return (
                  <tr key={user.id} className="align-middle transition-colors hover:bg-surface">
                    <td className="px-4 py-3">
                      <div className="flex items-start gap-3">
                        <Avatar name={user.fullName} className="mt-0.5" />

                        <div className="min-w-0">
                          <p className="font-medium text-fg">
                            {user.fullName}
                            {isSelf && <span className="ml-2 text-fg-muted">(you)</span>}
                          </p>
                          <p className="break-all text-fg-muted">{user.email}</p>
                          <p className="text-fg-muted lg:hidden">
                            Joined {formatDate(user.createdAt)}
                          </p>
                          {isSuspended && (
                            <p className="font-medium text-danger sm:hidden">Suspended</p>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="px-2 py-3">
                      <Select
                        label={`Role for ${user.fullName}`}
                        hideLabel
                        value={user.role}
                        disabled={isSelf || busyId === user.id}
                        onChange={(event) =>
                          run(user.id, () => userService.setUserRole(user.id, event.target.value))
                        }
                        options={optionsFromLabels(ROLE_LABELS)}
                      />
                    </td>

                    <td className="hidden px-2 py-3 sm:table-cell">
                      <span
                        className={cn(
                          'inline-block rounded-pill px-2.5 py-0.5 text-xs font-medium whitespace-nowrap',
                          isSuspended
                            ? 'bg-danger-soft text-danger-hover'
                            : 'bg-success-soft text-success-ink',
                        )}
                      >
                        {isSuspended ? 'Suspended' : 'Active'}
                      </span>
                    </td>

                    <td className="hidden px-2 py-3 whitespace-nowrap text-fg-muted lg:table-cell">
                      {formatDate(user.createdAt)}
                    </td>

                    <td className="px-4 py-3 text-right">
                      <Button
                        size="sm"
                        variant={isSuspended ? 'secondary' : 'danger'}
                        disabled={isSelf || busyId === user.id}
                        onClick={() =>
                          run(user.id, () =>
                            userService.setAccountStatus(
                              user.id,
                              isSuspended ? 'active' : 'suspended',
                            ),
                          )
                        }
                      >
                        {isSuspended ? 'Reinstate' : 'Suspend'}
                        <span className="sr-only"> account</span>
                      </Button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-sm text-fg-muted">
        You cannot change your own role or suspend your own account — that is how an
        administrator locks themselves out.
      </p>
    </div>
  )
}
