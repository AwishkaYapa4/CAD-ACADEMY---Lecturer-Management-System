import { DashboardLayout } from '@/layouts/DashboardLayout'
import { ROLES } from '@/constants/roles'

export function AdminLayout() {
  return <DashboardLayout role={ROLES.ADMIN} />
}
