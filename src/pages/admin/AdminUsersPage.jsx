import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search, Users } from 'lucide-react'
import { Button, EmptyState, LoadingSkeleton, Select } from '@/components/ui'
import { Avatar } from '@/components/Avatar'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { PageHeader } from '@/components/PageHeader'
import { ROLES, ROLE_LABELS } from '@/constants'
import { useAsync } from '@/hooks/useAsync'
import { userService } from '@/services'
import { optionsFromLabels } from '@/utils/options'
import { formatShortDate } from '@/utils/date'
import { AccountStatusBadge } from './AdminBadges'

async function loadUsers() {
  const [users, currentUser] = await Promise.all([
    userService.getUsers(),
    userService.getCurrentUser(),
  ])
  return { users, currentUser }
}

/** What each role can do, so a role change is made with its meaning in view. */
const ROLE_DESCRIPTIONS = {
  [ROLES.USER]: 'Files and manages their own reports. No access to either workspace.',
  [ROLES.STAFF]:
    'Reviews reports and possible matches, decides verifications, and sees both reporters’ contact details.',
  [ROLES.ADMIN]: 'Manages accounts, categories and moderation, including suspending accounts.',
}

/**
 * Account management.
 *
 * An administrator can change someone's role and suspend or reinstate an
 * account — but never their own, so the last administrator cannot lock
 * themselves out of the system. The server enforces that too; hiding the
 * buttons is only the polite half.
 *
 * Both changes go through a confirmation that names the person and says what
 * the change does: they are one click apart in a table of similar-looking rows.
 */
export function AdminUsersPage() {
  const { data, error, isLoading, reload } = useAsync(loadUsers)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  // The Overview's "Manage" link arrives as ?status=suspended.
  const [params, setParams] = useSearchParams()
  const statusFilter = params.get('status') ?? ''
  const setStatusFilter = (value) => setParams(value ? { status: value } : {}, { replace: true })
  const [asking, setAsking] = useState(null) // { user, kind: 'role'|'status', role? }
  const [isBusy, setIsBusy] = useState(false)
  const [actionError, setActionError] = useState(null)

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
  const isFiltering = Boolean(needle || roleFilter || statusFilter)

  const visible = users.filter((user) => {
    if (roleFilter && user.role !== roleFilter) return false
    if (statusFilter && user.accountStatus !== statusFilter) return false
    if (!needle) return true
    return (
      user.fullName.toLowerCase().includes(needle) || user.email.toLowerCase().includes(needle)
    )
  })

  const clearFilters = () => {
    setSearch('')
    setRoleFilter('')
    setStatusFilter('')
  }

  const commit = async () => {
    setIsBusy(true)
    setActionError(null)
    try {
      if (asking.kind === 'role') {
        await userService.setUserRole(asking.user.id, asking.role)
      } else {
        await userService.setAccountStatus(
          asking.user.id,
          asking.user.accountStatus === 'suspended' ? 'active' : 'suspended',
        )
      }
      setAsking(null)
      reload()
    } catch (caught) {
      setActionError(caught instanceof Error ? caught : new Error(String(caught)))
    } finally {
      setIsBusy(false)
    }
  }

  const cancel = () => {
    setAsking(null)
    setActionError(null)
  }

  return (
    <div className="flex flex-col gap-6">
      {header}

      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_11rem_11rem]">
        <label className="relative">
          <span className="sr-only">Search accounts</span>
          <Search
            size={16}
            className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-fg-muted"
            aria-hidden="true"
          />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Name or email"
            className="h-10 w-full rounded-control border border-border-strong bg-panel pr-3 pl-9 text-sm text-fg placeholder:text-fg-muted"
          />
        </label>
        <Select
          label="Role"
          hideLabel
          value={roleFilter}
          onChange={(event) => setRoleFilter(event.target.value)}
          options={[{ value: '', label: 'Any role' }, ...optionsFromLabels(ROLE_LABELS)]}
        />
        <Select
          label="Account status"
          hideLabel
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          options={[
            { value: '', label: 'Any status' },
            { value: 'active', label: 'Active' },
            { value: 'suspended', label: 'Suspended' },
          ]}
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <p className="text-sm text-fg-muted" aria-live="polite">
          {isFiltering
            ? `${visible.length} of ${users.length} accounts`
            : `${users.length} ${users.length === 1 ? 'account' : 'accounts'}`}
        </p>
        {isFiltering && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            Clear filters
          </Button>
        )}
      </div>

      {visible.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No accounts match"
          description="Try a broader search, or clear the filters."
          action={
            <Button variant="secondary" onClick={clearFilters}>
              Clear filters
            </Button>
          }
        />
      ) : (
        <>
          {/* Phones and tablets: one management card per account. A five-column
              table squeezed to 390px is unreadable and scrolls sideways. */}
          <ul className="flex flex-col gap-3 lg:hidden">
            {visible.map((user) => (
              <UserCard
                key={user.id}
                user={user}
                isSelf={user.id === currentUser?.id}
                onAsk={setAsking}
              />
            ))}
          </ul>

          <div className="hidden overflow-hidden rounded-card border border-border bg-panel lg:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-surface-muted text-fg">
                <tr>
                  <th scope="col" className="px-4 py-2.5 font-medium">
                    User
                  </th>
                  <th scope="col" className="px-2 py-2.5 font-medium">
                    Role
                  </th>
                  <th scope="col" className="px-2 py-2.5 font-medium">
                    Status
                  </th>
                  <th scope="col" className="px-2 py-2.5 font-medium">
                    Joined
                  </th>
                  <th scope="col" className="px-4 py-2.5 text-right font-medium">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-border">
                {visible.map((user) => {
                  const isSelf = user.id === currentUser?.id

                  return (
                    <tr key={user.id} className="align-middle transition-colors hover:bg-surface">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar name={user.fullName} />
                          <div className="min-w-0">
                            <p className="font-medium text-fg">
                              {user.fullName}
                              {isSelf && <span className="ml-2 text-fg-muted">(you)</span>}
                            </p>
                            <p className="break-all text-fg-muted">{user.email}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-2 py-3 text-fg">{ROLE_LABELS[user.role]}</td>

                      <td className="px-2 py-3">
                        <AccountStatusBadge status={user.accountStatus} />
                      </td>

                      <td className="px-2 py-3 whitespace-nowrap text-fg-muted">
                        {formatShortDate(user.createdAt)}
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex justify-end">
                          <RowActions user={user} isSelf={isSelf} onAsk={setAsking} />
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      <p className="text-sm text-fg-muted">
        You cannot change your own role or suspend your own account — that is how an
        administrator locks themselves out.
      </p>

      {asking?.kind === 'role' && (
        <RoleDialog
          user={asking.user}
          role={asking.role}
          onPick={(role) => setAsking((current) => ({ ...current, role }))}
          onCancel={cancel}
          onConfirm={commit}
          isBusy={isBusy}
          error={actionError}
        />
      )}

      {asking?.kind === 'status' && (
        <StatusDialog
          user={asking.user}
          onCancel={cancel}
          onConfirm={commit}
          isBusy={isBusy}
          error={actionError}
        />
      )}
    </div>
  )
}

/**
 * The two management actions. Suspending is destructive, so it is a quiet
 * button that only turns red on hover or focus — a column of red buttons made
 * the whole table look like a warning.
 */
function RowActions({ user, isSelf, onAsk }) {
  if (isSelf) {
    return <span className="text-fg-muted">This is your account</span>
  }

  const isSuspended = user.accountStatus === 'suspended'

  return (
    <div className="flex flex-wrap justify-end gap-2">
      <Button
        size="sm"
        variant="secondary"
        onClick={() => onAsk({ user, kind: 'role', role: user.role })}
      >
        Change role
        <span className="sr-only"> for {user.fullName}</span>
      </Button>
      <Button
        size="sm"
        variant={isSuspended ? 'secondary' : 'ghost'}
        className={isSuspended ? undefined : 'text-fg-muted hover:bg-danger-soft hover:text-danger-hover focus-visible:bg-danger-soft focus-visible:text-danger-hover'}
        onClick={() => onAsk({ user, kind: 'status' })}
      >
        {isSuspended ? 'Reinstate' : 'Suspend'}
        <span className="sr-only"> {user.fullName}’s account</span>
      </Button>
    </div>
  )
}

/** One account as a card, for narrower screens. */
function UserCard({ user, isSelf, onAsk }) {
  return (
    <li className="flex flex-col gap-3 rounded-card border border-border bg-panel p-4 shadow-card">
      <div className="flex items-start gap-3">
        <Avatar name={user.fullName} />
        <div className="min-w-0 flex-1">
          <p className="font-medium text-fg">
            {user.fullName}
            {isSelf && <span className="ml-2 text-fg-muted">(you)</span>}
          </p>
          <p className="text-sm break-all text-fg-muted">{user.email}</p>
        </div>
      </div>

      <dl className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
        <div className="flex items-center gap-1.5">
          <dt className="text-fg-muted">Role:</dt>
          <dd className="text-fg">{ROLE_LABELS[user.role]}</dd>
        </div>
        <div className="flex items-center gap-1.5">
          <dt className="sr-only">Status</dt>
          <dd>
            <AccountStatusBadge status={user.accountStatus} />
          </dd>
        </div>
        <div className="flex items-center gap-1.5">
          <dt className="text-fg-muted">Joined</dt>
          <dd className="text-fg-muted">{formatShortDate(user.createdAt)}</dd>
        </div>
      </dl>

      <RowActions user={user} isSelf={isSelf} onAsk={onAsk} />
    </li>
  )
}

function RoleDialog({ user, role, onPick, onCancel, onConfirm, isBusy, error }) {
  const changed = role !== user.role

  return (
    <ConfirmDialog
      isOpen
      title={`Change ${user.fullName}’s role?`}
      confirmLabel={changed ? `Make ${ROLE_LABELS[role]}` : 'Change role'}
      tone="primary"
      confirmDisabled={!changed || isBusy}
      isBusy={isBusy}
      error={error}
      onCancel={onCancel}
      onConfirm={onConfirm}
    >
      <p className="text-fg-muted">
        {user.fullName} is currently {ROLE_LABELS[user.role]}. A role decides what someone can
        reach; it takes effect the next time they load a page.
      </p>

      <fieldset className="flex flex-col gap-2">
        <legend className="sr-only">New role for {user.fullName}</legend>
        {Object.entries(ROLE_LABELS).map(([value, label]) => (
          <label
            key={value}
            className="flex cursor-pointer gap-3 rounded-control border border-border p-3 has-checked:border-brand has-checked:bg-brand-soft"
          >
            <input
              type="radio"
              name={`role-${user.id}`}
              value={value}
              checked={role === value}
              onChange={() => onPick(value)}
              className="mt-1 size-4 shrink-0 accent-brand"
            />
            <span className="flex flex-col gap-0.5">
              <span className="font-medium text-fg">
                {label}
                {value === user.role && <span className="text-fg-muted"> · current</span>}
              </span>
              <span className="text-fg-muted">{ROLE_DESCRIPTIONS[value]}</span>
            </span>
          </label>
        ))}
      </fieldset>
    </ConfirmDialog>
  )
}

function StatusDialog({ user, onCancel, onConfirm, isBusy, error }) {
  const isSuspended = user.accountStatus === 'suspended'

  return (
    <ConfirmDialog
      isOpen
      title={isSuspended ? `Reinstate ${user.fullName}?` : `Suspend ${user.fullName}?`}
      confirmLabel={isSuspended ? 'Reinstate account' : 'Suspend account'}
      tone={isSuspended ? 'primary' : 'danger'}
      isBusy={isBusy}
      error={error}
      onCancel={onCancel}
      onConfirm={onConfirm}
    >
      <p className="text-fg-muted">
        {user.fullName} · {ROLE_LABELS[user.role]} · {user.email}
      </p>
      <p>
        {isSuspended
          ? 'They will be able to sign in again and use their account as before. Their reports are untouched either way.'
          : 'They will not be able to sign in until an administrator reinstates them. Reports they have already filed stay in the system and stay visible.'}
      </p>
    </ConfirmDialog>
  )
}
