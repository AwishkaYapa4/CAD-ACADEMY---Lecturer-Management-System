import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2, Clock, Wallet } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/common/EmptyState'
import { useBatches } from '@/features/batches/hooks/useBatches'
import { useCourses } from '@/features/courses/hooks/useCourses'
import { useLecturers } from '@/features/lecturers/hooks/useLecturers'
import { LecturerPaymentSummaryRow } from '@/features/payments/components/LecturerPaymentSummaryRow'
import { usePaymentReadinessSummary } from '@/features/payments/hooks/usePaymentReadinessSummary'
import { usePaymentRuleAmounts } from '@/features/paymentRules/hooks/usePaymentRules'
import { calculateMonthlyPayment, monthKeyFor, monthKeyLabel } from '@/features/payments/utils/monthlyCalc'

/**
 * The entire dashboard payment section — per the 2026-08-10 "simplify" spec,
 * this is deliberately the ONLY thing the three dashboards show (besides a
 * page header): Month, Lecturer, Completed Classes, Class Progress, Current
 * Payment, and Monthly Payment, nothing else. One shared component so the
 * figure is identical everywhere ("Admin, Staff, and Lecturer dashboards
 * must all show the correct monthly payment amount using the same payment
 * calculation data") rather than three re-derived versions of the same math.
 *
 * No aggregate/total-across-lecturers hero anymore (an earlier version of
 * this component had one) — every one of the six required fields is
 * per-lecturer/per-rule, so each LecturerPaymentSummaryRow *is* the whole
 * dashboard content, not a breakdown underneath a separate summary.
 *
 * Rows are split into two labeled groups by `alreadyPaid` (2026-08-10, per
 * explicit "show lecturers who have completed their payment separately"):
 * "Pending Payment" first, then "Payment Received" — a group is only
 * rendered when it has at least one row, so a month with nothing paid out
 * yet doesn't show an empty "Payment Received" heading.
 *
 * Pass `lecturerId` for a single lecturer's own dashboard (Lecturer role);
 * omit it for the all-lecturers view (Admin/Staff) — `usePaymentReadinessSummary`
 * already knows how to switch between constrained/unconstrained queries for
 * each case. `showLecturerNames` defaults to true — turn it off on the
 * Lecturer's own dashboard where every row is already theirs, a name would
 * be redundant.
 */
export function LecturerPaymentHighlights({
  lecturerId,
  monthKey = monthKeyFor(),
  showLecturerNames = true,
  title = 'Completed Classes & Payment',
  viewAllHref,
  viewAllLabel = 'View all',
}) {
  const navigate = useNavigate()
  const { rows, loading: rowsLoading } = usePaymentReadinessSummary(lecturerId, monthKey)
  const { data: lecturers } = useLecturers()
  const { data: courses } = useCourses()
  const { data: batches } = useBatches()

  const ruleIds = useMemo(() => rows.map((row) => row.rule.id), [rows])
  const { data: amounts, loading: amountsLoading } = usePaymentRuleAmounts(ruleIds)

  const lecturerById = useMemo(() => Object.fromEntries(lecturers.map((l) => [l.id, l])), [lecturers])
  const courseById = useMemo(() => Object.fromEntries(courses.map((c) => [c.id, c])), [courses])
  const batchById = useMemo(() => Object.fromEntries(batches.map((b) => [b.id, b])), [batches])

  const enrichedRows = useMemo(() => {
    return rows
      .map((row) => {
        const amount = amounts[row.rule.id] ?? null
        const { finalPayment } = calculateMonthlyPayment({
          monthlyAmount: amount?.monthlyAmount,
          monthlyClassCount: row.rule.monthlyClassCount,
          completed: row.completed,
        })
        return { ...row, amount, finalPayment }
      })
      .sort((a, b) => b.completed - a.completed || b.finalPayment - a.finalPayment)
  }, [rows, amounts])

  const pendingRows = useMemo(() => enrichedRows.filter((row) => !row.alreadyPaid), [enrichedRows])
  const paidRows = useMemo(() => enrichedRows.filter((row) => row.alreadyPaid), [enrichedRows])

  const loading = rowsLoading || amountsLoading

  const renderRow = (row) => (
    <LecturerPaymentSummaryRow
      key={row.rule.id}
      lecturerName={showLecturerNames ? (lecturerById[row.rule.lecturerId]?.fullName ?? 'Unknown lecturer') : null}
      scopeLabel={[courseById[row.rule.courseId]?.name, batchById[row.rule.batchId]?.batchCode]
        .filter(Boolean)
        .join(' · ')}
      completed={row.completed}
      target={row.rule.monthlyClassCount}
      amount={row.amount}
      finalPayment={row.finalPayment}
    />
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription className="font-medium text-foreground">{monthKeyLabel(monthKey)}</CardDescription>
        {viewAllHref ? (
          <CardAction>
            <Button variant="outline" size="sm" onClick={() => navigate(viewAllHref)}>
              {viewAllLabel}
            </Button>
          </CardAction>
        ) : null}
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : enrichedRows.length === 0 ? (
          <EmptyState
            icon={Wallet}
            title="No payment rules yet"
            description={
              showLecturerNames
                ? 'Set up a payment rule for a lecturer to start tracking completed classes and payment.'
                : "Once the office sets up a payment rule for you, your completed classes and payment will show up here."
            }
            className="border-none bg-transparent py-10"
          />
        ) : (
          <div className="space-y-6">
            {pendingRows.length > 0 ? (
              <div className="space-y-3">
                <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                  <Clock className="size-4 text-warning" />
                  Pending Payment
                </div>
                <div className="space-y-3">{pendingRows.map(renderRow)}</div>
              </div>
            ) : null}

            {paidRows.length > 0 ? (
              <div className="space-y-3">
                <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                  <CheckCircle2 className="size-4 text-success" />
                  Payment Received
                </div>
                <div className="space-y-3">{paidRows.map(renderRow)}</div>
              </div>
            ) : null}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
