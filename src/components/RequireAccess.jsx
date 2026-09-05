import { Navigate, useLocation } from 'react-router-dom'

/**
 * Route guard for anything behind a sign-in.
 *
 * Two cases, in order:
 *   signed out            → /login, remembering where they were headed
 *   signed in, wrong role → /unauthorized
 *
 * NOT SECURITY. Authentication is simulated and this runs in the browser, so it
 * only keeps the interface coherent — real enforcement arrives with the backend
 * (CLAUDE.md §8).
 *
 * @param {Object} props
 * @param {string|null} props.role   Current role, or null when signed out.
 * @param {string[]} [props.allowed] Roles permitted here. Omit to allow any
 *   signed-in account.
 */
export function RequireAccess({ role, allowed, children }) {
  const location = useLocation()

  if (!role) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (allowed && !allowed.includes(role)) {
    return <Navigate to="/unauthorized" replace />
  }

  return children
}
