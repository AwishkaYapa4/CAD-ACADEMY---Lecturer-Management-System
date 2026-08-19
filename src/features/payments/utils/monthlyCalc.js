import { endOfMonth, format, startOfMonth } from 'date-fns'

import { SCHEDULE_STATUS } from '@/constants/statuses'
import { toDate } from '@/utils/formatters'

/** 'yyyy-MM' key for a date, defaults to now. */
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
  if (!monthKey) return '-'
  return format(new Date(`${monthKey}-01T00:00:00`), 'MMMM yyyy')
}

export function isScheduleInMonth(schedule, monthKey) {
  const date = toDate(schedule.classDate)
  if (!date) return false
  const { start, end } = monthKeyRange(monthKey)
  return date >= start && date <= end
}

/**
 * Total scheduled classes excludes cancelled classes. Completed means the
 * lecturer submitted a report for the schedule.
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
 * Payment per class = monthly payment / configured monthly class count.
 * Classes up to monthlyClassCount are regular monthly classes; any completed
 * classes above that target are separated as extra classes and paid at the
 * same per-class rate.
 */
export function calculateMonthlyPayment({ monthlyAmount, monthlyClassCount, completed }) {
  const amount = Number(monthlyAmount) || 0
  const classCount = Number(monthlyClassCount) || 0
  const completedCount = Number(completed) || 0
  const paymentPerClass = classCount > 0 ? amount / classCount : 0
  const regularClassCount = classCount > 0 ? Math.min(completedCount, classCount) : 0
  const extraClassCount = classCount > 0 ? Math.max(0, completedCount - classCount) : 0
  const regularPayment = paymentPerClass * regularClassCount
  const extraPayment = paymentPerClass * extraClassCount
  const finalPayment = regularPayment + extraPayment
  return {
    paymentPerClass,
    finalPayment,
    regularClassCount,
    regularPayment,
    extraClassCount,
    extraPayment,
  }
}

/** Whole-unit currency formatting for dashboard payment figures. */
export function formatCurrency(amount, currency = '') {
  const rounded = Math.round(Number(amount) || 0)
  const formatted = rounded.toLocaleString('en-US')
  return currency ? `${currency} ${formatted}` : formatted
}
