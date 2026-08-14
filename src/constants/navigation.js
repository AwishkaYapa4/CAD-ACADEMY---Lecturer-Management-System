import {
  LayoutDashboard,
  Users,
  BookOpen,
  Layers,
  CalendarClock,
  ClipboardCheck,
  ClipboardEdit,
  ShieldCheck,
  Wallet,
  History,
  FileUp,
  Bell,
  Settings,
  UserCircle,
  UserCog,
} from 'lucide-react'

import { ROLES } from '@/constants/roles'
import { ROUTES } from '@/constants/routes'

export const NAV_ITEMS_BY_ROLE = {
  [ROLES.ADMIN]: [
    { label: 'Dashboard', to: ROUTES.ADMIN_DASHBOARD, icon: LayoutDashboard, end: true },
    { label: 'Lecturers', to: ROUTES.ADMIN_LECTURERS, icon: Users },
    { label: 'Courses', to: ROUTES.ADMIN_COURSES, icon: BookOpen },
    { label: 'Batches', to: ROUTES.ADMIN_BATCHES, icon: Layers },
    { label: 'Class Schedules', to: ROUTES.ADMIN_SCHEDULES, icon: CalendarClock },
    { label: 'Class Reports', to: ROUTES.ADMIN_REPORTS, icon: ClipboardCheck },
    { label: 'Payment Rules', to: ROUTES.ADMIN_PAYMENT_RULES, icon: ShieldCheck },
    { label: 'Payment Readiness', to: ROUTES.ADMIN_PAYMENT_READINESS, icon: Wallet },
    { label: 'Users', to: ROUTES.ADMIN_USERS, icon: UserCog },
    { label: 'Materials', to: ROUTES.ADMIN_MATERIALS, icon: FileUp },
    { label: 'Notifications', to: ROUTES.ADMIN_NOTIFICATIONS, icon: Bell },
    { label: 'Settings', to: ROUTES.ADMIN_SETTINGS, icon: Settings },
  ],
  // 2026-08-10: trimmed to exactly these 7 at the user's explicit request
  // ("show ... only", then "today's class page remove") — Lecturers/
  // Courses/Batches/Today's Classes removed from the Staff nav. The
  // Today's Classes route/page was deleted outright (StaffTodayPage.jsx no
  // longer exists); Lecturers/Courses/Batches pages/routes still exist and
  // still work if linked to directly, just no longer advertised in the
  // sidebar.
  [ROLES.STAFF]: [
    { label: 'Dashboard', to: ROUTES.STAFF_DASHBOARD, icon: LayoutDashboard, end: true },
    { label: 'Class Schedules', to: ROUTES.STAFF_SCHEDULES, icon: CalendarClock },
    { label: 'Class Reports', to: ROUTES.STAFF_REPORTS, icon: ClipboardCheck },
    { label: 'Payment Readiness', to: ROUTES.STAFF_PAYMENT_READINESS, icon: Wallet },
    { label: 'Materials', to: ROUTES.STAFF_MATERIALS, icon: FileUp },
    { label: 'Notifications', to: ROUTES.STAFF_NOTIFICATIONS, icon: Bell },
    { label: 'Profile', to: ROUTES.STAFF_PROFILE, icon: UserCircle },
  ],
  [ROLES.LECTURER]: [
    { label: 'Dashboard', to: ROUTES.LECTURER_DASHBOARD, icon: LayoutDashboard, end: true },
    { label: 'My Classes', to: ROUTES.LECTURER_SCHEDULE, icon: CalendarClock },
    { label: 'My Class History', to: ROUTES.LECTURER_HISTORY, icon: History },
    { label: 'My Materials', to: ROUTES.LECTURER_MATERIALS, icon: ClipboardEdit },
    { label: 'Notifications', to: ROUTES.LECTURER_NOTIFICATIONS, icon: Bell },
    { label: 'Profile', to: ROUTES.LECTURER_PROFILE, icon: UserCircle },
  ],
}
