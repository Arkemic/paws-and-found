import { Outlet } from 'react-router-dom'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'

/**
 * The shell every page sits inside: navigation, the page itself, and the
 * footer.
 *
 * @param {Object} props
 * @param {string} props.role
 * @param {(role: string) => void} props.onRoleChange  Development only.
 * @param {() => void} props.onSignOut
 * @param {Object|null} props.user
 */
export function RootLayout({ role, onRoleChange, onSignOut, user }) {
  return (
    <div className="page-ground flex min-h-screen flex-col bg-surface">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      <Navbar role={role} onRoleChange={onRoleChange} onSignOut={onSignOut} user={user} />

      <main id="main-content" className="flex-1 py-8">
        <Outlet />
      </main>

      <Footer />
    </div>
  )
}
