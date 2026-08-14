import { DashboardLayout } from '@/layouts/DashboardLayout'
import { ROLES } from '@/constants/roles'

export function LecturerLayout() {
  return <DashboardLayout role={ROLES.LECTURER} />
}
