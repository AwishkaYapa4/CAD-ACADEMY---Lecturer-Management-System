export const ROUTES = Object.freeze({
  LOGIN: '/login',
  ADMIN_LOGIN: '/admin/login',
  STAFF_LOGIN: '/staff/login',
  LECTURER_LOGIN: '/lecturer/login',
  FORGOT_PASSWORD: '/forgot-password',
  DEACTIVATED: '/deactivated',
  FORBIDDEN: '/403',
  NOT_FOUND: '/404',

  // Admin
  ADMIN_DASHBOARD: '/admin',
  ADMIN_LECTURERS: '/admin/lecturers',
  ADMIN_LECTURER_DETAIL: '/admin/lecturers/:lecturerId',
  ADMIN_COURSES: '/admin/courses',
  ADMIN_BATCHES: '/admin/batches',
  ADMIN_BATCH_DETAIL: '/admin/batches/:batchId',
  ADMIN_SCHEDULES: '/admin/schedules',
  ADMIN_REPORTS: '/admin/reports',
  ADMIN_PAYMENT_RULES: '/admin/payment-rules',
  ADMIN_PAYMENT_READINESS: '/admin/payments',
  ADMIN_USERS: '/admin/users',
  ADMIN_MATERIALS: '/admin/materials',
  ADMIN_NOTIFICATIONS: '/admin/notifications',
  ADMIN_SETTINGS: '/admin/settings',

  // Staff (read-only)
  STAFF_DASHBOARD: '/staff',
  STAFF_SCHEDULES: '/staff/schedules',
  STAFF_LECTURERS: '/staff/lecturers',
  STAFF_COURSES: '/staff/courses',
  STAFF_BATCHES: '/staff/batches',
  STAFF_REPORTS: '/staff/reports',
  STAFF_PAYMENT_READINESS: '/staff/payments',
  STAFF_MATERIALS: '/staff/materials',
  STAFF_NOTIFICATIONS: '/staff/notifications',
  STAFF_PROFILE: '/staff/profile',

  // Lecturer (own data only)
  LECTURER_DASHBOARD: '/lecturer',
  LECTURER_SCHEDULE: '/lecturer/schedule',
  LECTURER_SUBMIT_REPORT: '/lecturer/classes/:scheduleId/report',
  LECTURER_HISTORY: '/lecturer/history',
  LECTURER_MATERIALS: '/lecturer/materials',
  LECTURER_NOTIFICATIONS: '/lecturer/notifications',
  LECTURER_PROFILE: '/lecturer/profile',
})

export const HOME_ROUTE_BY_ROLE = {
  admin: ROUTES.ADMIN_DASHBOARD,
  staff: ROUTES.STAFF_DASHBOARD,
  lecturer: ROUTES.LECTURER_DASHBOARD,
}

export const LOGIN_ROUTE_BY_ROLE = {
  admin: ROUTES.ADMIN_LOGIN,
  staff: ROUTES.STAFF_LOGIN,
  lecturer: ROUTES.LECTURER_LOGIN,
}
