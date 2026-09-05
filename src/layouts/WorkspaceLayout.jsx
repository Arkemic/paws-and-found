import { Outlet } from 'react-router-dom'
import { Sidebar } from '@/components/Sidebar'
import { Container } from '@/components/ui'

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
 */
export function WorkspaceLayout({ label, items }) {
  return (
    <Container className="flex flex-col gap-6 lg:flex-row lg:gap-10">
      <Sidebar label={label} items={items} />

      <div className="min-w-0 flex-1">
        <Outlet />
      </div>
    </Container>
  )
}
