import { useMemo } from 'react'

import { PAYMENT_CYCLE_STATUS } from '@/constants/statuses'
import { useLecturerPaymentRules, usePaymentRules } from '@/features/paymentRules/hooks/usePaymentRules'
import { matchPaymentRuleForScope } from '@/features/paymentRules/utils/matchRule'
import { useLecturerPayments, usePayments } from '@/features/payments/hooks/usePayments'
import { monthKeyFor, summarizeMonth } from '@/features/payments/utils/monthlyCalc'
import { useLecturerSchedules, useSchedules } from '@/features/schedules/hooks/useSchedules'
import { toDate } from '@/utils/formatters'

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

  const { data: rules, loading: rulesLoading } = lecturerId ? ownRules : allRules
  const { data: schedules, loading: schedulesLoading } = lecturerId ? ownSchedules : allSchedules
  const { data: payments, loading: paymentsLoading } = lecturerId ? ownPayments : allPayments

  const activeRules = useMemo(
    () => rules.filter((r) => r.active !== false && (!lecturerId || r.lecturerId === lecturerId)),
    [rules, lecturerId]
  )

  // Which (paymentRuleId, month) combos are already spoken for — an approved
  // or paid payment locks that rule's month from being paid out a second
  // time (see approvePayment's periodMonth uniqueness).
  const paidRuleMonths = useMemo(() => {
    const set = new Set()
    payments
      .filter((p) => [PAYMENT_CYCLE_STATUS.APPROVED, PAYMENT_CYCLE_STATUS.PAID].includes(p.status))
      .forEach((p) => set.add(`${p.paymentRuleId}__${p.periodMonth}`))
    return set
  }, [payments])

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
      })
      if (!rule) return
      byRuleId[rule.id] = byRuleId[rule.id] ?? []
      byRuleId[rule.id].push(schedule)
    })

    return activeRules.map((rule) => {
      const { totalScheduled, completed, completedSchedules } = summarizeMonth(byRuleId[rule.id] ?? [])
      const alreadyPaid = paidRuleMonths.has(`${rule.id}__${monthKey}`)
      // Readiness is driven by completed classes against the rule's
      // configured monthlyClassCount, not by how many classes were actually
      // scheduled that month (totalScheduled is informational display only —
      // see calculateMonthlyPayment in monthlyCalc.js).
      const isReady = completed > 0 && !alreadyPaid
      return { rule, monthKey, totalScheduled, completed, completedSchedules, alreadyPaid, isReady }
    })
  }, [schedules, activeRules, monthKey, paidRuleMonths])

  return {
    loading: rulesLoading || schedulesLoading || paymentsLoading,
    monthKey,
    rows,
    readyCount: rows.filter((r) => r.isReady).length,
  }
}
