import { useCallback } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from '@/components/Sidebar'
import { Container } from '@/components/ui'
import { useAsync } from '@/hooks/useAsync'

/**
 * Sidebar + content shell shared by the three workspaces: the user dashboard,
 * the staff workspace and the administration area.
 *
 * One layout serves all three because they differ only in which links the
 * sidebar shows — three near-identical layout files would be exactly the
 * duplication docs/ui-inventory.md warns about.
 *
 * @param {Object} props
 * @param {string} props.label  Workspace name, used to label the sidebar nav.
 * @param {Array} props.items   Sidebar links; see constants/navigation.js.
 * @param {'panel'|'light'} [props.variant]  Sidebar look; see Sidebar.
 * @param {() => Promise<Record<string, number>>} [props.loadCounts]  Fetches
 *   the sidebar's count badges. Re-read whenever the person moves to another
 *   section, so a count that changed on one page is right on the next.
 */
export function WorkspaceLayout({ label, items, variant = 'panel', loadCounts }) {
  const { pathname } = useLocation()

  const readCounts = useCallback(
    () => (loadCounts ? loadCounts(pathname) : Promise.resolve(null)),
    [loadCounts, pathname],
  )
  const { data: counts } = useAsync(readCounts)

  return (
    <Container className="flex flex-col gap-6 lg:flex-row lg:gap-10">
      <Sidebar label={label} items={items} variant={variant} counts={counts} />

      <div className="min-w-0 flex-1">
        <Outlet />
      </div>
    </Container>
  )
}
