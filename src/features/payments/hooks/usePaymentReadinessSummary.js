import { useMemo } from 'react'

import { PAYMENT_CYCLE_STATUS } from '@/constants/statuses'
import { useClassReports, useLecturerReports } from '@/features/classReports/hooks/useClassReports'
import { useLecturerPaymentRules, usePaymentRules } from '@/features/paymentRules/hooks/usePaymentRules'
import { matchPaymentRuleForScope } from '@/features/paymentRules/utils/matchRule'
import { useLecturerPayments, usePayments } from '@/features/payments/hooks/usePayments'
import { monthKeyFor, summarizeMonth } from '@/features/payments/utils/monthlyCalc'
import { useLecturerSchedules, useSchedules } from '@/features/schedules/hooks/useSchedules'
import { toDate } from '@/utils/formatters'

const RECEIVED_PAYMENT_VISIBLE_DAYS = 15
const MS_PER_DAY = 24 * 60 * 60 * 1000

function getPaymentReceivedDate(payment) {
  return toDate(payment.paidAt ?? payment.updatedAt ?? payment.createdAt)
}

function isPaymentReceivedRecently(payment, now = new Date()) {
  if (payment.status !== PAYMENT_CYCLE_STATUS.PAID) return true
  const receivedDate = getPaymentReceivedDate(payment)
  if (!receivedDate) return true
  return now.getTime() - receivedDate.getTime() < RECEIVED_PAYMENT_VISIBLE_DAYS * MS_PER_DAY
}

/**
 * Same rule-matching/grouping logic as PaymentReadinessList, extracted so
 * dashboards can show a "Payment Ready" count without re-implementing the
 * grouping — every consumer of readiness state should go through this one
 * place rather than recomputing it.
 *
 * Readiness is scoped to a calendar month (`monthKey`, 'yyyy-MM', defaults to
 * the current month): each active rule's row reports how many of the
 * lecturer's classes for that rule's scope were scheduled vs. completed *in
 * that month*. `totalScheduled` is informational only — the actual payment
 * math divides by the rule's configured `monthlyClassCount`, not by how many
 * classes the calendar happened to schedule (see calculateMonthlyPayment in
 * monthlyCalc.js). This hook only computes counts, never the monthly amount
 * itself — that lives in a private subcollection (Admin-write, but Admin/
 * Staff/owning-Lecturer can all read it, see firestore.rules) and is fetched
 * separately by whichever component needs it (see PaymentReadinessRow).
 *
 * Pass `lecturerId` for a lecturer's own dashboard — Firestore rules only
 * let a lecturer `list` paymentRules/classSchedules/payments when the query
 * itself is constrained to `lecturerId == <them>` (an unconstrained
 * collection-wide query is rejected outright), so this switches to the
 * constrained variants of every hook rather than the admin-facing
 * unconstrained ones. Both variants are always called (Rules of Hooks) —
 * only the relevant one's data is used.
 */
export function usePaymentReadinessSummary(lecturerId, monthKey = monthKeyFor()) {
  const allRules = usePaymentRules()
  const ownRules = useLecturerPaymentRules(lecturerId)
  const allSchedules = useSchedules()
  const ownSchedules = useLecturerSchedules(lecturerId)
  const allPayments = usePayments()
  const ownPayments = useLecturerPayments(lecturerId)
  const allReports = useClassReports()
  const ownReports = useLecturerReports(lecturerId)

  const { data: rules, loading: rulesLoading } = lecturerId ? ownRules : allRules
  const { data: schedules, loading: schedulesLoading } = lecturerId ? ownSchedules : allSchedules
  const { data: payments, loading: paymentsLoading } = lecturerId ? ownPayments : allPayments
  const { data: reports, loading: reportsLoading } = lecturerId ? ownReports : allReports

  const activeRules = useMemo(
    () =>
      rules.filter(
        (r) =>
          r.active !== false &&
          (!lecturerId || r.lecturerId === lecturerId) &&
          (!r.periodMonth || r.periodMonth === monthKey)
      ),
    [rules, lecturerId, monthKey]
  )

  // Paid payments stay visible as received history for 15 days, but they no
  // longer lock the whole month; only the reports marked paymentProcessed are
  // excluded from the next payable row.
  const paidPaymentByRuleMonth = useMemo(() => {
    const byKey = {}
    const now = new Date()
    payments
      .filter((p) => [PAYMENT_CYCLE_STATUS.APPROVED, PAYMENT_CYCLE_STATUS.PAID].includes(p.status))
      .filter((p) => isPaymentReceivedRecently(p, now))
      .forEach((payment) => {
        const key = `${payment.paymentRuleId}__${payment.periodMonth}`
        byKey[key] = byKey[key] ?? { ...payment, id: key, completedClassCount: 0 }
        byKey[key].completedClassCount += payment.completedClassCount ?? 0
      })
    return byKey
  }, [payments])

  const reportByScheduleId = useMemo(
    () => Object.fromEntries(reports.map((report) => [report.scheduleId ?? report.id, report])),
    [reports]
  )

  const rows = useMemo(() => {
    const inMonth = schedules.filter((s) => {
      const date = toDate(s.classDate)
      return date && monthKeyFor(date) === monthKey
    })

    // Each schedule is claimed by exactly one rule — its most specific match
    // (lecturer+course+batch > lecturer+course) — so a lecturer with several
    // scoped rules gets one independent row per rule instead of the same
    // class being double-counted under all of them.
    const byRuleId = {}
    inMonth.forEach((schedule) => {
      const rule = matchPaymentRuleForScope(activeRules, {
        lecturerId: schedule.lecturerId,
        courseId: schedule.courseId,
        batchId: schedule.batchId,
        periodMonth: monthKey,
      })
      if (!rule) return
      byRuleId[rule.id] = byRuleId[rule.id] ?? []
      byRuleId[rule.id].push(schedule)
    })

    return activeRules.flatMap((rule) => {
      const { totalScheduled, completedSchedules: allCompletedSchedules } = summarizeMonth(byRuleId[rule.id] ?? [])
      const completedSchedules = allCompletedSchedules.filter(
        (schedule) => reportByScheduleId[schedule.id]?.paymentProcessed !== true
      )
      const payableCompleted = completedSchedules.length
      const paidKey = `${rule.id}__${monthKey}`
      const paidPayment = paidPaymentByRuleMonth[paidKey]
      const rowsForRule = []
      // Readiness is driven by completed classes against the rule's
      // configured monthlyClassCount, not by how many classes were actually
      // scheduled that month (totalScheduled is informational display only —
      // see calculateMonthlyPayment in monthlyCalc.js).
      if (!paidPayment || payableCompleted > 0) {
        rowsForRule.push({
          rowKey: `${rule.id}__pending__${monthKey}`,
          kind: 'pending',
          rule,
          monthKey,
          totalScheduled,
          completed: payableCompleted,
          payableCompleted,
          completedSchedules,
          alreadyPaid: false,
          isReady: payableCompleted > 0,
        })
      }

      if (paidPayment) {
        rowsForRule.push({
          rowKey: `${rule.id}__paid__${paidPayment.id ?? monthKey}`,
          kind: 'paid',
          rule,
          payment: paidPayment,
          monthKey,
          totalScheduled,
          completed: paidPayment.completedClassCount ?? 0,
          payableCompleted: 0,
          completedSchedules: [],
          alreadyPaid: true,
          isReady: false,
        })
      }

      return rowsForRule
    })
  }, [schedules, activeRules, monthKey, paidPaymentByRuleMonth, reportByScheduleId])

  return {
    loading: rulesLoading || schedulesLoading || paymentsLoading || reportsLoading,
    monthKey,
    rows,
    readyCount: rows.filter((r) => r.isReady).length,
  }
}
