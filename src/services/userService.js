/**
 * User and session data access.
 *
 * Authentication is real. `signIn()` and `register()` post to the PHP API,
 * which verifies or hashes the password with bcrypt and answers with a session
 * cookie; `getCurrentUser()` then asks the server who that cookie belongs to.
 * Nothing here decides access on its own — every protected endpoint checks the
 * session again for itself (see `api/helpers.php`).
 */

import { ROLES } from '@/constants'
import { NotFoundError, getTable } from './mockDb'
import { apiFetch, queryString } from './api'

/** An API account in the shape the interface already reads. */
function userFromApi(row) {
  return {
    id: row.user_id,
    fullName: row.full_name,
    email: row.email ?? '',
    phone: row.contact_number ?? '',
    role: row.role,
    accountStatus: row.account_status,
    preferredLocation: row.preferred_location ?? '',
    createdAt: row.created_at,
  }
}


/**
 * Every seeded demonstration account shares this password (see
 * `database/seed.sql`). It exists so the development role selector can sign in
 * for real rather than pretending — the app now holds a genuine PHP session,
 * not a variable.
 */
const DEMO_PASSWORD = 'demo1234'

/** `query` accepts: role, accountStatus, search (name or email). */
export async function getUsers(query = {}) {
  const payload = await apiFetch(
    `/users${queryString({ role: query.role, status: query.accountStatus, q: query.search })}`,
  )

  return payload.data.map(userFromApi)
}

export async function getUserById(id) {
  try {
    const payload = await apiFetch(`/users/${id}`)
    return userFromApi(payload.data)
  } catch (error) {
    throw new NotFoundError(error.message)
  }
}

export async function getCurrentUser() {
  // The session is a server-side PHP session; the browser only carries the
  // cookie. Asking the API is the only way to know who is signed in.
  const payload = await apiFetch('/auth/me')
  if (!payload.user) return null

  return {
    id: payload.user.user_id,
    fullName: payload.user.full_name,
    email: payload.user.email,
    phone: payload.user.contact_number ?? '',
    role: payload.user.role,
    accountStatus: 'active',
    preferredLocation: payload.user.preferred_location ?? '',
  }
}

/**
 * Sign in with an email address and password.
 *
 * The API replies with a session cookie. The account itself is read back from
 * /auth/me so that `getCurrentUser()` stays the single place that shapes a user
 * for the interface.
 */
export async function signIn(email, password) {
  await apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })

  return getCurrentUser()
}

/** End the session. Returns null so callers can assign the result directly. */
export async function signOut() {
  await apiFetch('/auth/logout', { method: 'POST' })
  return null
}

/**
 * Create an account and sign in as it.
 *
 * The role is deliberately not sent: the API always creates an ordinary user,
 * so a crafted request cannot register an administrator.
 */
export async function register({ fullName, email, password, phone = '' }) {
  await apiFetch('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      full_name: fullName,
      email,
      password,
      contact_number: phone,
    }),
  })

  return getCurrentUser()
}

export async function setCurrentUser(userId) {
  if (userId === null) {
    await apiFetch('/auth/logout', { method: 'POST' })
    return null
  }

  // The selector knows the account by its demo id; the API signs in by email.
  // getDemoAccounts() returns an object keyed by role, not an array.
  const account = Object.values(await getDemoAccounts()).find((user) => user?.id === userId)
  if (!account) throw new NotFoundError('User', userId)

  await apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: account.email, password: DEMO_PASSWORD }),
  })

  return getCurrentUser()
}

export async function getDemoAccounts() {
  const rows = getTable('users')
  const pick = (role) => rows.find((u) => u.role === role && u.accountStatus === 'active')

  return {
    [ROLES.USER]: pick(ROLES.USER),
    [ROLES.STAFF]: pick(ROLES.STAFF),
    [ROLES.ADMIN]: pick(ROLES.ADMIN),
  }
}

/**
 * Patch a user's own profile fields. Role and account status are left out —
 * changing those is an administrator action, below.
 */
export async function updateUser(id, changes) {
  const rows = getTable('users')
  const index = rows.findIndex((u) => u.id === id)
  if (index === -1) throw new NotFoundError('User', id)

  const { id: _id, role: _role, accountStatus: _status, createdAt: _createdAt, ...editable } = changes

  rows[index] = { ...rows[index], ...editable }

  return rows[index]
}

/** Administrator action: suspend or reinstate an account. */
export async function setAccountStatus(id, accountStatus) {
  const payload = await apiFetch(`/users/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ account_status: accountStatus }),
  })

  return userFromApi(payload.data)
}

export async function setUserRole(id, role) {
  const payload = await apiFetch(`/users/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ role }),
  })

  return userFromApi(payload.data)
}

