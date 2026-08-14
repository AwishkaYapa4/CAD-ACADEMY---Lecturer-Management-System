import { DashboardLayout } from '@/layouts/DashboardLayout'
import { ROLES } from '@/constants/roles'

export function StaffLayout() {
  return <DashboardLayout role={ROLES.STAFF} />
}
