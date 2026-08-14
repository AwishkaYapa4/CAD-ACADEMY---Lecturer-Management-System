import { Outlet } from 'react-router-dom'

import { MonthlyOverviewWidget } from '@/components/common/MonthlyOverviewWidget'
import { Navbar } from '@/components/common/Navbar'
import { Sidebar } from '@/components/common/Sidebar'
import { NAV_ITEMS_BY_ROLE } from '@/constants/navigation'
import { ROLES } from '@/constants/roles'
import { ROUTES } from '@/constants/routes'

// Only Admin/Staff manage payments across every lecturer, so only they get
// the "Monthly Overview" sidebar widget — a Lecturer's own dashboard already
// is their full report, nothing to link out to.
const OVERVIEW_HREF_BY_ROLE = {
  [ROLES.ADMIN]: ROUTES.ADMIN_PAYMENT_READINESS,
  [ROLES.STAFF]: ROUTES.STAFF_PAYMENT_READINESS,
}

/**
 * Shared shell for every authenticated role. Role only changes which nav
 * items render — the chrome (sidebar/navbar/content) is identical.
 */
export function DashboardLayout({ role }) {
  const navItems = NAV_ITEMS_BY_ROLE[role] ?? []
  const overviewHref = OVERVIEW_HREF_BY_ROLE[role]
  const sidebarFooter = overviewHref ? <MonthlyOverviewWidget viewAllHref={overviewHref} /> : null

  return (
    <div className="flex h-screen overflow-hidden bg-muted/30">
      <Sidebar navItems={navItems} footer={sidebarFooter} className="hidden lg:flex" />

      <div className="flex min-w-0 flex-1 flex-col">
        <Navbar role={role} navItems={navItems} sidebarFooter={sidebarFooter} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
