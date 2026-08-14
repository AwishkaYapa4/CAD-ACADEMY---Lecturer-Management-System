// Central registry of Firestore collection names.
// Never hardcode a collection string anywhere else — import from here.
export const COLLECTIONS = Object.freeze({
  USERS: 'users',
  LECTURERS: 'lecturers',
  COURSES: 'courses',
  BATCHES: 'batches',
  LECTURER_ASSIGNMENTS: 'lecturerAssignments',
  CLASS_SCHEDULES: 'classSchedules',
  CLASS_REPORTS: 'classReports',
  CLASS_MATERIALS: 'classMaterials',
  PAYMENT_RULES: 'paymentRules',
  PAYMENTS: 'payments',
  NOTIFICATIONS: 'notifications',
  SYSTEM_SETTINGS: 'systemSettings',
})

// Firestore has no field-level read rules, so monetary data is split into an
// admin-only subcollection. Applies to both `paymentRules/{id}` (rate/amount
// config) and `payments/{id}` (the calculated total) — the parent doc holds
// only non-monetary operational fields visible to staff/lecturer. Only Admin
// and Cloud Functions (Admin SDK) may read/write the `private/amount` doc.
// See firestore.rules.
export const PRIVATE_SUBCOLLECTION = 'private'
export const PRIVATE_AMOUNT_DOC_ID = 'amount'
