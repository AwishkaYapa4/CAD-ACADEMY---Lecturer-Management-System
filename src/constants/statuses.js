// A class is never auto-completed by date passing — it moves to `completed`
// only when the lecturer submits a class report (see classReports below).
export const SCHEDULE_STATUS = Object.freeze({
  SCHEDULED: 'scheduled',
  DRAFT_REPORT: 'draft_report',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
})

// No verification/approval step: a submitted report completes the class
// automatically. Draft does not count toward payment.
export const REPORT_STATUS = Object.freeze({
  DRAFT: 'draft',
  SUBMITTED: 'submitted',
})

// 'in_progress'/'ready' are computed client-side at render time and never
// persisted as a payments doc (the matching rule can change, so a stored
// snapshot could go stale) — the first real doc is written at 'approved'.
export const PAYMENT_CYCLE_STATUS = Object.freeze({
  NOT_ELIGIBLE: 'not_eligible',
  IN_PROGRESS: 'in_progress',
  READY: 'ready',
  APPROVED: 'approved',
  PAID: 'paid',
  CANCELLED: 'cancelled',
})

export const LECTURER_STATUS = Object.freeze({
  ACTIVE: 'active',
  INACTIVE: 'inactive',
})

export const BATCH_STATUS = Object.freeze({
  UPCOMING: 'upcoming',
  ACTIVE: 'active',
  COMPLETED: 'completed',
})

export const NOTIFICATION_TYPE = Object.freeze({
  CLASS_SCHEDULED: 'class_scheduled',
  REPORT_SUBMITTED: 'report_submitted',
  PAYMENT_READY: 'payment_ready',
  PAYMENT_PAID: 'payment_paid',
  ACCOUNT_ACTIVATED: 'account_activated',
  ACCOUNT_DEACTIVATED: 'account_deactivated',
  GENERAL: 'general',
})

export const STATUS_BADGE_VARIANTS = Object.freeze({
  [SCHEDULE_STATUS.SCHEDULED]: 'info',
  [SCHEDULE_STATUS.DRAFT_REPORT]: 'warning',
  [SCHEDULE_STATUS.COMPLETED]: 'success',
  [SCHEDULE_STATUS.CANCELLED]: 'muted',

  [REPORT_STATUS.DRAFT]: 'muted',
  [REPORT_STATUS.SUBMITTED]: 'success',

  [PAYMENT_CYCLE_STATUS.NOT_ELIGIBLE]: 'muted',
  [PAYMENT_CYCLE_STATUS.IN_PROGRESS]: 'muted',
  [PAYMENT_CYCLE_STATUS.READY]: 'warning',
  [PAYMENT_CYCLE_STATUS.APPROVED]: 'info',
  [PAYMENT_CYCLE_STATUS.PAID]: 'success',
  [PAYMENT_CYCLE_STATUS.CANCELLED]: 'destructive',

  [LECTURER_STATUS.ACTIVE]: 'success',
  [LECTURER_STATUS.INACTIVE]: 'muted',

  [BATCH_STATUS.UPCOMING]: 'info',
  [BATCH_STATUS.ACTIVE]: 'success',
  [BATCH_STATUS.COMPLETED]: 'muted',
})

// Explicit display-label overrides for status values whose raw enum string
// would otherwise read awkwardly via StatusPill's mechanical
// humanize (status.replace(/_/g,' ')) — e.g. a lecturer mid-class hasn't
// submitted a report yet ('draft_report' internally) but the UI calls that
// "Ongoing", not "Draft report". Anything not listed here falls back to the
// mechanical humanize, unchanged.
export const STATUS_LABELS = Object.freeze({
  [SCHEDULE_STATUS.DRAFT_REPORT]: 'Ongoing',

  [PAYMENT_CYCLE_STATUS.NOT_ELIGIBLE]: 'Not Eligible',
  [PAYMENT_CYCLE_STATUS.IN_PROGRESS]: 'In Progress',
  [PAYMENT_CYCLE_STATUS.READY]: 'Payment Ready',
  [PAYMENT_CYCLE_STATUS.APPROVED]: 'Approved',
  [PAYMENT_CYCLE_STATUS.PAID]: 'Payment Received',
})
