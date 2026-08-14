import { Navigate, Route, Routes } from 'react-router-dom'

import { AuthLayout } from '@/layouts/AuthLayout'
import { AdminLayout } from '@/layouts/AdminLayout'
import { StaffLayout } from '@/layouts/StaffLayout'
import { LecturerLayout } from '@/layouts/LecturerLayout'

import { ProtectedRoute } from '@/routes/ProtectedRoute'
import { PublicOnlyRoute } from '@/routes/PublicOnlyRoute'
import { RoleRoute } from '@/routes/RoleRoute'

import { ROLES } from '@/constants/roles'
import { ROUTES } from '@/constants/routes'

// Auth
import LoginPage from '@/pages/auth/LoginPage'
import AdminLoginPage from '@/pages/auth/AdminLoginPage'
import StaffLoginPage from '@/pages/auth/StaffLoginPage'
import LecturerLoginPage from '@/pages/auth/LecturerLoginPage'
import ForgotPasswordPage from '@/pages/auth/ForgotPasswordPage'

// Shared
import NotificationsPage from '@/pages/shared/NotificationsPage'
import ProfilePage from '@/pages/shared/ProfilePage'

// Admin
import AdminDashboardPage from '@/pages/admin/AdminDashboardPage'
import LecturersListPage from '@/pages/admin/lecturers/LecturersListPage'
import LecturerDetailPage from '@/pages/admin/lecturers/LecturerDetailPage'
import CoursesListPage from '@/pages/admin/courses/CoursesListPage'
import BatchesListPage from '@/pages/admin/batches/BatchesListPage'
import BatchDetailPage from '@/pages/admin/batches/BatchDetailPage'
import SchedulesListPage from '@/pages/admin/schedules/SchedulesListPage'
import ClassReportsPage from '@/pages/admin/reports/ClassReportsPage'
import PaymentRulesListPage from '@/pages/admin/paymentRules/PaymentRulesListPage'
import PaymentReadinessPage from '@/pages/admin/payments/PaymentReadinessPage'
import UsersListPage from '@/pages/admin/users/UsersListPage'
import AdminMaterialsPage from '@/pages/admin/materials/AdminMaterialsPage'
import SettingsPage from '@/pages/admin/settings/SettingsPage'

// Staff
import StaffDashboardPage from '@/pages/staff/StaffDashboardPage'
import StaffSchedulesPage from '@/pages/staff/StaffSchedulesPage'
import StaffLecturersPage from '@/pages/staff/StaffLecturersPage'
import StaffCoursesPage from '@/pages/staff/StaffCoursesPage'
import StaffBatchesPage from '@/pages/staff/StaffBatchesPage'
import StaffPaymentReadinessPage from '@/pages/staff/StaffPaymentReadinessPage'
import StaffMaterialsPage from '@/pages/staff/StaffMaterialsPage'

// Lecturer
import LecturerDashboardPage from '@/pages/lecturer/LecturerDashboardPage'
import MySchedulePage from '@/pages/lecturer/MySchedulePage'
import SubmitReportPage from '@/pages/lecturer/SubmitReportPage'
import ClassHistoryPage from '@/pages/lecturer/ClassHistoryPage'
import MyMaterialsPage from '@/pages/lecturer/MyMaterialsPage'

// Errors
import ForbiddenPage from '@/pages/errors/ForbiddenPage'
import NotFoundPage from '@/pages/errors/NotFoundPage'
import DeactivatedPage from '@/pages/errors/DeactivatedPage'

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<PublicOnlyRoute />}>
        <Route element={<AuthLayout />}>
          <Route path={ROUTES.LOGIN} element={<LoginPage />} />
          <Route path={ROUTES.ADMIN_LOGIN} element={<AdminLoginPage />} />
          <Route path={ROUTES.STAFF_LOGIN} element={<StaffLoginPage />} />
          <Route path={ROUTES.LECTURER_LOGIN} element={<LecturerLoginPage />} />
          <Route path={ROUTES.FORGOT_PASSWORD} element={<ForgotPasswordPage />} />
        </Route>
      </Route>

      <Route element={<AuthLayout />}>
        <Route path={ROUTES.DEACTIVATED} element={<DeactivatedPage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route path={ROUTES.FORBIDDEN} element={<ForbiddenPage />} />

        <Route element={<RoleRoute allowedRoles={[ROLES.ADMIN]} />}>
          <Route element={<AdminLayout />}>
            <Route path={ROUTES.ADMIN_DASHBOARD} element={<AdminDashboardPage />} />
            <Route path={ROUTES.ADMIN_LECTURERS} element={<LecturersListPage />} />
            <Route path={ROUTES.ADMIN_LECTURER_DETAIL} element={<LecturerDetailPage />} />
            <Route path={ROUTES.ADMIN_COURSES} element={<CoursesListPage />} />
            <Route path={ROUTES.ADMIN_BATCHES} element={<BatchesListPage />} />
            <Route path={ROUTES.ADMIN_BATCH_DETAIL} element={<BatchDetailPage />} />
            <Route path={ROUTES.ADMIN_SCHEDULES} element={<SchedulesListPage />} />
            <Route path={ROUTES.ADMIN_REPORTS} element={<ClassReportsPage />} />
            <Route path={ROUTES.ADMIN_PAYMENT_RULES} element={<PaymentRulesListPage />} />
            <Route path={ROUTES.ADMIN_PAYMENT_READINESS} element={<PaymentReadinessPage />} />
            <Route path={ROUTES.ADMIN_USERS} element={<UsersListPage />} />
            <Route path={ROUTES.ADMIN_MATERIALS} element={<AdminMaterialsPage />} />
            <Route path={ROUTES.ADMIN_NOTIFICATIONS} element={<NotificationsPage />} />
            <Route path={ROUTES.ADMIN_SETTINGS} element={<SettingsPage />} />
          </Route>
        </Route>

        <Route element={<RoleRoute allowedRoles={[ROLES.STAFF]} />}>
          <Route element={<StaffLayout />}>
            <Route path={ROUTES.STAFF_DASHBOARD} element={<StaffDashboardPage />} />
            <Route path={ROUTES.STAFF_SCHEDULES} element={<StaffSchedulesPage />} />
            <Route path={ROUTES.STAFF_LECTURERS} element={<StaffLecturersPage />} />
            <Route path={ROUTES.STAFF_COURSES} element={<StaffCoursesPage />} />
            <Route path={ROUTES.STAFF_BATCHES} element={<StaffBatchesPage />} />
            <Route path={ROUTES.STAFF_REPORTS} element={<ClassReportsPage />} />
            <Route path={ROUTES.STAFF_PAYMENT_READINESS} element={<StaffPaymentReadinessPage />} />
            <Route path={ROUTES.STAFF_MATERIALS} element={<StaffMaterialsPage />} />
            <Route path={ROUTES.STAFF_NOTIFICATIONS} element={<NotificationsPage />} />
            <Route path={ROUTES.STAFF_PROFILE} element={<ProfilePage />} />
          </Route>
        </Route>

        <Route element={<RoleRoute allowedRoles={[ROLES.LECTURER]} />}>
          <Route element={<LecturerLayout />}>
            <Route path={ROUTES.LECTURER_DASHBOARD} element={<LecturerDashboardPage />} />
            <Route path={ROUTES.LECTURER_SCHEDULE} element={<MySchedulePage />} />
            <Route path={ROUTES.LECTURER_SUBMIT_REPORT} element={<SubmitReportPage />} />
            <Route path={ROUTES.LECTURER_HISTORY} element={<ClassHistoryPage />} />
            <Route path={ROUTES.LECTURER_MATERIALS} element={<MyMaterialsPage />} />
            <Route path={ROUTES.LECTURER_NOTIFICATIONS} element={<NotificationsPage />} />
            <Route path={ROUTES.LECTURER_PROFILE} element={<ProfilePage />} />
          </Route>
        </Route>
      </Route>

      <Route path="/" element={<Navigate to={ROUTES.LOGIN} replace />} />
      <Route path={ROUTES.NOT_FOUND} element={<NotFoundPage />} />
      <Route path="*" element={<Navigate to={ROUTES.NOT_FOUND} replace />} />
    </Routes>
  )
}
