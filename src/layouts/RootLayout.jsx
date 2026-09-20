import { Outlet, useLocation } from 'react-router-dom'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { cn } from '@/utils/cn'

/**
 * Which environment the page is in. The four canvases share one recipe and
 * differ in which brand colour leads, so the public pages feel warm and
 * community-facing, the coordinator's workspace reads cooler and operational,
 * and administration is the quietest of the four — without any of them looking
 * like a different product (docs/design-system.md).
 */
function canvasFor(pathname) {
  if (pathname.startsWith('/admin')) return 'canvas-admin'
  if (pathname.startsWith('/staff')) return 'canvas-staff'
  // Taller on the customer dashboard: the greeting, the quick actions and the
  // first heading all sit inside the warm region, and it fades out under the
  // cards rather than stopping just below the greeting.
  if (pathname.startsWith('/dashboard')) return 'canvas-customer h-[58rem]'
  return 'canvas-public'
}

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
  const { pathname } = useLocation()

  return (
    <div className="page-ground flex min-h-screen flex-col bg-surface">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      <Navbar role={role} onRoleChange={onRoleChange} onSignOut={onSignOut} user={user} />

      {/* The environment layer: grain plus the two glows for this area of the
          site. It is behind the page, above the ground, and fades out well
          before the content ends — the atmosphere belongs to the top of a
          page, not to the whole scroll. */}
      <main id="main-content" className={cn('relative isolate flex-1 py-8')}>
        <span
          aria-hidden="true"
          className={cn(
            'canvas-fade pointer-events-none absolute inset-x-0 top-0 -z-10 h-[46rem]',
            canvasFor(pathname),
          )}
        />
        <Outlet />
      </main>

      <Footer />
    </div>
  )
}
