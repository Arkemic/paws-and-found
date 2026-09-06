import { useCallback, useEffect, useState } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'

import { RootLayout } from '@/layouts/RootLayout'
import { WorkspaceLayout } from '@/layouts/WorkspaceLayout'
import { RequireAccess } from '@/components/RequireAccess'
import { ROLES } from '@/constants'
import { ADMIN_NAV, STAFF_NAV, USER_NAV } from '@/constants/navigation'
import { userService } from '@/services'

import { HomePage } from '@/pages/public/HomePage'
import { ExplorePage } from '@/pages/public/ExplorePage'
import { ReportLostPage } from '@/pages/public/ReportLostPage'
import { ReportFoundPage } from '@/pages/public/ReportFoundPage'
import { PetDetailPage } from '@/pages/public/PetDetailPage'
import { AboutPage } from '@/pages/public/AboutPage'
import { HelpPage } from '@/pages/public/HelpPage'
import { LoginPage } from '@/pages/public/LoginPage'
import { RegisterPage } from '@/pages/public/RegisterPage'

import { DashboardOverviewPage } from '@/pages/dashboard/DashboardOverviewPage'
import { MyReportsPage } from '@/pages/dashboard/MyReportsPage'
import { EditReportPage } from '@/pages/dashboard/EditReportPage'
import { MyMatchesPage } from '@/pages/dashboard/MyMatchesPage'
import { NotificationsPage } from '@/pages/dashboard/NotificationsPage'
import { ProfilePage } from '@/pages/dashboard/ProfilePage'

import { StaffOverviewPage } from '@/pages/staff/StaffOverviewPage'
import { StaffReportsPage } from '@/pages/staff/StaffReportsPage'
import { StaffMatchesPage } from '@/pages/staff/StaffMatchesPage'
import { StaffVerificationPage } from '@/pages/staff/StaffVerificationPage'

import { AdminOverviewPage } from '@/pages/admin/AdminOverviewPage'
import { AdminUsersPage } from '@/pages/admin/AdminUsersPage'
import { AdminReportsPage } from '@/pages/admin/AdminReportsPage'
import { AdminCategoriesPage } from '@/pages/admin/AdminCategoriesPage'
import { AdminModerationPage } from '@/pages/admin/AdminModerationPage'

import { NotFoundPage } from '@/pages/system/NotFoundPage'
import { UnauthorizedPage } from '@/pages/system/UnauthorizedPage'

/**
 * Routes and the session.
 *
 * `user` is whoever the server says the session cookie belongs to, and `null`
 * means signed out — the state a first-time visitor arrives in. Signing in and
 * registering both hand back an account, which is all this component stores;
 * the session itself lives on the server.
 *
 * Browsing is public: anyone can read the homepage, search reports and open a
 * report. Filing a report, and every workspace, requires signing in.
 */
export default function App() {
  // The session now lives on the server as a PHP session, so the app has to ask
  // who is signed in rather than remembering it in a variable. `undefined`
  // means "not asked yet" — distinct from null, which means "nobody".
  const [user, setUser] = useState(undefined)

  useEffect(() => {
    let cancelled = false

    userService
      .getCurrentUser()
      .then((signedIn) => {
        if (!cancelled) setUser(signedIn)
      })
      .catch(() => {
        if (!cancelled) setUser(null)
      })

    return () => {
      cancelled = true
    }
  }, [])

  /**
   * The development role selector. It signs in and out for real now, so the
   * server session and the interface cannot disagree.
   */
  const changeRole = useCallback(async (nextRole) => {
    if (!nextRole) {
      await userService.setCurrentUser(null)
      setUser(null)
      return
    }

    const accounts = await userService.getDemoAccounts()
    const account = accounts[nextRole]
    setUser(await userService.setCurrentUser(account.id))
  }, [])

  const role = user?.role ?? null

  // Until the session check finishes, a guarded route must not decide that
  // nobody is signed in — that would bounce a signed-in user to /login on
  // every refresh.
  if (user === undefined) {
    return null
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<RootLayout role={role} onRoleChange={changeRole} user={user} />}>
          {/* Public */}
          <Route path="/" element={<HomePage />} />
          <Route path="/explore" element={<ExplorePage />} />
          <Route path="/pet/:id" element={<PetDetailPage role={role} />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/help" element={<HelpPage />} />
          <Route
            path="/login"
            element={<LoginPage onSignedIn={setUser} onDemoSignIn={changeRole} />}
          />
          <Route path="/register" element={<RegisterPage onSignedIn={setUser} />} />

          {/* Filing a report requires an account, so a report can be traced
              back to a person and followed up. Any signed-in role may file. */}
          <Route
            path="/report/lost"
            element={
              <RequireAccess role={role}>
                <ReportLostPage />
              </RequireAccess>
            }
          />
          <Route
            path="/report/found"
            element={
              <RequireAccess role={role}>
                <ReportFoundPage />
              </RequireAccess>
            }
          />

          {/* Customer / User */}
          <Route
            path="/dashboard"
            element={
              <RequireAccess role={role} allowed={[ROLES.USER]}>
                <WorkspaceLayout label="My account" items={USER_NAV} />
              </RequireAccess>
            }
          >
            <Route index element={<DashboardOverviewPage />} />
            <Route path="reports" element={<MyReportsPage />} />
            <Route path="reports/:id/edit" element={<EditReportPage />} />
            <Route path="matches" element={<MyMatchesPage />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>

          {/* Staff / Pet Coordinator */}
          <Route
            path="/staff"
            element={
              <RequireAccess role={role} allowed={[ROLES.STAFF]}>
                <WorkspaceLayout label="Staff workspace" items={STAFF_NAV} />
              </RequireAccess>
            }
          >
            <Route index element={<StaffOverviewPage />} />
            <Route path="reports" element={<StaffReportsPage />} />
            <Route path="matches" element={<StaffMatchesPage />} />
            <Route path="verification" element={<StaffVerificationPage />} />
            <Route
              path="notifications"
              element={
                <NotificationsPage
                  workspacePath="/staff"
                  workspaceLabel="Staff workspace"
                  matchPath="/staff/verification"
                />
              }
            />
          </Route>

          {/* Administrator */}
          <Route
            path="/admin"
            element={
              <RequireAccess role={role} allowed={[ROLES.ADMIN]}>
                <WorkspaceLayout label="Administration" items={ADMIN_NAV} />
              </RequireAccess>
            }
          >
            <Route index element={<AdminOverviewPage />} />
            <Route path="users" element={<AdminUsersPage />} />
            <Route path="reports" element={<AdminReportsPage />} />
            <Route path="categories" element={<AdminCategoriesPage />} />
            <Route path="moderation" element={<AdminModerationPage />} />
          </Route>

          {/* System */}
          <Route path="/unauthorized" element={<UnauthorizedPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
