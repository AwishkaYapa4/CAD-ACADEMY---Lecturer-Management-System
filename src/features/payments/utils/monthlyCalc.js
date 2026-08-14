import { endOfMonth, format, startOfMonth } from 'date-fns'

import { SCHEDULE_STATUS } from '@/constants/statuses'
import { toDate } from '@/utils/formatters'

/** 'yyyy-MM' key for a date (defaults to now) — the unit a payment rule is calculated and paid against. */
export function monthKeyFor(date = new Date()) {
  return format(date, 'yyyy-MM')
}

/** Inclusive [start, end] Date range covering every day in the given 'yyyy-MM' key. */
export function monthKeyRange(monthKey) {
  const anchor = new Date(`${monthKey}-01T00:00:00`)
  return { start: startOfMonth(anchor), end: endOfMonth(anchor) }
}

/** e.g. "August 2026" for display. */
export function monthKeyLabel(monthKey) {
  if (!monthKey) return '—'
  return format(new Date(`${monthKey}-01T00:00:00`), 'MMMM yyyy')
}

export function isScheduleInMonth(schedule, monthKey) {
  const date = toDate(schedule.classDate)
  if (!date) return false
  const { start, end } = monthKeyRange(monthKey)
  return date >= start && date <= end
}

/**
 * Total Scheduled Classes deliberately excludes cancelled classes — a
 * cancelled class was never actually going to happen, so it shouldn't dilute
 * the per-class rate. Completed = the lecturer submitted a report for it
 * (SCHEDULE_STATUS.COMPLETED; see classReportService.submitReport).
 */
export function summarizeMonth(schedules) {
  const scheduled = schedules.filter((s) => s.status !== SCHEDULE_STATUS.CANCELLED)
  const completedSchedules = scheduled.filter((s) => s.status === SCHEDULE_STATUS.COMPLETED)
  return {
    totalScheduled: scheduled.length,
    completed: completedSchedules.length,
    completedSchedules,
  }
}

/**
 * Payment Per Class = Monthly Payment ÷ Monthly Class Count — the class
 * count is a manually configured value on the payment rule
 * (`PaymentRuleDoc.monthlyClassCount`), never derived from how many classes
 * actually got scheduled on the calendar that month (see project spec: "the
 * payment should never be calculated simply from the total scheduled
 * classes"). Final Payment = Payment Per Class × Completed Classes, where
 * Completed Classes only ever counts classes whose status is
 * SCHEDULE_STATUS.COMPLETED (report submitted) — cancelled/missed/pending/
 * rescheduled classes are never counted (see summarizeMonth).
 *
 * The result is capped at monthlyAmount: completing more than
 * monthlyClassCount classes in a month does not pay out more than the
 * configured monthly amount (a separate extra-class-payment feature would be
 * needed to pay for the overage — not implemented here). A rule with no
 * monthlyClassCount configured has no defined per-class rate; both values
 * come back 0 instead of dividing by zero.
 */
export function calculateMonthlyPayment({ monthlyAmount, monthlyClassCount, completed }) {
  const amount = Number(monthlyAmount) || 0
  const classCount = Number(monthlyClassCount) || 0
  const paymentPerClass = classCount > 0 ? amount / classCount : 0
  const finalPayment = Math.min(paymentPerClass * completed, amount)
  return { paymentPerClass, finalPayment }
}

/**
 * Renders a payment figure the way every dashboard is required to (2026-08-10):
 * whole currency units only, thousands-separated, never decimals/cents —
 * "LKR 6,000", not "LKR 6,000.00". Rounds rather than truncates so a
 * fractional payment (e.g. an uneven per-class rate) still reads as a single
 * clean number instead of silently dropping cents.
 */
export function formatCurrency(amount, currency = '') {
  const rounded = Math.round(Number(amount) || 0)
  const formatted = rounded.toLocaleString('en-US')
  return currency ? `${currency} ${formatted}` : formatted
}
