import { useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { LogOut, Menu, X } from 'lucide-react'
import logoMark from '@/assets/pawsfound-logo-mark.png'
import { Button, Container } from '@/components/ui'
import { DemoRoleSelector } from './DemoRoleSelector'
import { NavDropdown, NavDropdownItem } from './NavDropdown'
import { PUBLIC_NAV, WORKSPACE_BY_ROLE } from '@/constants/navigation'
import { cn } from '@/utils/cn'

const linkClasses = ({ isActive }) =>
  cn(
    'rounded-control px-3 py-2 text-[0.9375rem] font-medium transition-colors',
    isActive ? 'bg-brand-soft text-brand-hover' : 'text-fg-muted hover:bg-surface-muted hover:text-fg',
  )

/** The "Report" trigger, styled to sit level with the plain links beside it. */
const triggerClasses =
  'flex items-center gap-1 rounded-control px-3 py-2 text-[0.9375rem] font-medium text-fg-muted transition-colors hover:bg-surface-muted hover:text-fg'

/**
 * Top navigation.
 *
 * Four groups, in this order, because they answer four different questions:
 *
 *   1. brand              — where am I
 *   2. public navigation  — where can I go
 *   3. workspace          — where does my role work
 *   4. account and demo   — who am I, and the development role switch
 *
 * They used to sit in one row at equal weight, which read as a single mush of
 * links. The workspace is now a bordered control rather than a sixth link, the
 * account is a menu rather than a label, and the demo selector sits behind a
 * divider under a muted "Demo:" so it can never be mistaken for a real account
 * control.
 *
 * Below `xl` everything collapses behind the menu button: a signed-in
 * coordinator carries seven items plus a name plus the selector, which does not
 * fit a 1024px laptop.
 *
 * @param {Object} props
 * @param {string|null} props.role  null when signed out.
 * @param {(role: string|null) => void} props.onRoleChange
 * @param {Object|null} props.user  The signed-in account; null when signed out.
 */
export function Navbar({ role, onRoleChange, user }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const location = useLocation()
  const workspace = role ? WORKSPACE_BY_ROLE[role] : null

  const closeMenu = () => setIsMenuOpen(false)

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-panel/95 backdrop-blur-sm">
      <Container className="flex h-18 items-center gap-6">
        {/* 1. Brand */}
        <Link
          to="/"
          className="flex shrink-0 items-center gap-2.5 text-xl font-semibold tracking-tight text-fg"
        >
          <img src={logoMark} alt="" className="size-10 shrink-0" />
          Paws&amp;Found
        </Link>

        {/* 2. Public navigation */}
        <nav aria-label="Main" className="hidden items-center gap-1 xl:flex">
          {PUBLIC_NAV.map((item) =>
            item.children ? (
              <NavDropdown
                key={item.label}
                label={item.label}
                triggerClassName={triggerClasses}
                isActive={item.children.some((child) => location.pathname === child.to)}
              >
                {(close) =>
                  item.children.map((child) => (
                    <NavDropdownItem key={child.to} as={Link} to={child.to} onClick={close}>
                      {child.label}
                    </NavDropdownItem>
                  ))
                }
              </NavDropdown>
            ) : (
              <NavLink key={item.to} to={item.to} end={item.end} className={linkClasses}>
                {item.label}
              </NavLink>
            ),
          )}
        </nav>

        {/* 3 and 4 sit together on the right, away from the public links. */}
        <div className="ml-auto hidden items-center gap-4 xl:flex">
          {/* 3. The role's own workspace — a destination, not a sixth link. */}
          {workspace && (
            <NavLink
              to={workspace.to}
              className={({ isActive }) =>
                cn(
                  'rounded-control border px-3.5 py-2 text-[0.9375rem] font-medium whitespace-nowrap transition-colors',
                  isActive
                    ? 'border-brand bg-brand-soft text-brand-hover'
                    : 'border-border-strong text-fg hover:bg-surface-muted',
                )
              }
            >
              {workspace.label}
            </NavLink>
          )}

          {/* 4. Account, then the demo control behind a divider. */}
          {user ? (
            <NavDropdown
              align="right"
              label={<span className="max-w-36 truncate">{user.fullName}</span>}
              triggerClassName="flex items-center gap-1.5 rounded-control px-2 py-2 text-[0.9375rem] font-medium text-fg transition-colors hover:bg-surface-muted"
            >
              {(close) => (
                <>
                  <p className="px-3 pt-1 pb-2 text-xs break-all text-fg-muted">{user.email}</p>
                  <NavDropdownItem
                    as="button"
                    type="button"
                    onClick={() => {
                      close()
                      onRoleChange(null)
                    }}
                  >
                    <LogOut size={15} aria-hidden="true" />
                    Sign out
                  </NavDropdownItem>
                </>
              )}
            </NavDropdown>
          ) : (
            <Button as={Link} to="/login" size="sm" variant="secondary">
              Sign in
            </Button>
          )}

          <span className="h-6 w-px bg-border" aria-hidden="true" />

          {/* Development scaffolding, labelled as such. */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-fg-muted">Demo:</span>
            <DemoRoleSelector role={role} onRoleChange={onRoleChange} hideLabel />
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsMenuOpen((open) => !open)}
          aria-expanded={isMenuOpen}
          aria-controls="mobile-menu"
          className="ml-auto rounded-control p-2.5 text-fg hover:bg-surface-muted xl:hidden"
        >
          {isMenuOpen ? <X size={22} aria-hidden="true" /> : <Menu size={22} aria-hidden="true" />}
          <span className="sr-only">{isMenuOpen ? 'Close menu' : 'Open menu'}</span>
        </button>
      </Container>

      {isMenuOpen && (
        <div id="mobile-menu" className="border-t border-border bg-panel xl:hidden">
          <Container className="flex flex-col py-4">
            {/* The Report menu flattens here: on a phone a submenu inside a
                submenu is worse than two plain links. */}
            <nav aria-label="Main" className="flex flex-col gap-0.5">
              {PUBLIC_NAV.flatMap((item) =>
                item.children
                  ? item.children.map((child) => (
                      <NavLink
                        key={child.to}
                        to={child.to}
                        className={linkClasses}
                        onClick={closeMenu}
                      >
                        {child.label}
                      </NavLink>
                    ))
                  : [
                      <NavLink
                        key={item.to}
                        to={item.to}
                        end={item.end}
                        className={linkClasses}
                        onClick={closeMenu}
                      >
                        {item.label}
                      </NavLink>,
                    ],
              )}
            </nav>

            {workspace && (
              <NavLink
                to={workspace.to}
                onClick={closeMenu}
                className={({ isActive }) =>
                  cn(
                    'mt-3 rounded-control border px-3.5 py-2 text-center text-[0.9375rem] font-medium',
                    isActive
                      ? 'border-brand bg-brand-soft text-brand-hover'
                      : 'border-border-strong text-fg',
                  )
                }
              >
                {workspace.label}
              </NavLink>
            )}

            <div className="mt-4 flex flex-col gap-3 border-t border-border pt-4">
              {user ? (
                <div className="flex items-center justify-between gap-3">
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-fg">
                      {user.fullName}
                    </span>
                    <span className="block truncate text-xs text-fg-muted">{user.email}</span>
                  </span>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      closeMenu()
                      onRoleChange(null)
                    }}
                  >
                    <LogOut size={14} aria-hidden="true" />
                    Sign out
                  </Button>
                </div>
              ) : (
                <Button as={Link} to="/login" variant="secondary" onClick={closeMenu}>
                  Sign in
                </Button>
              )}

              <div className="flex items-center gap-2">
                <span className="text-xs text-fg-muted">Demo:</span>
                <DemoRoleSelector role={role} onRoleChange={onRoleChange} hideLabel />
              </div>
            </div>
          </Container>
        </div>
      )}
    </header>
  )
}
