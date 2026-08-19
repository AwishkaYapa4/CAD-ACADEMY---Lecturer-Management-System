import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, CheckCircle2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DashboardWelcomeBanner } from '@/components/common/DashboardWelcomeBanner'
import { ROUTES } from '@/constants/routes'
import { useBatches } from '@/features/batches/hooks/useBatches'
import { useCourses } from '@/features/courses/hooks/useCourses'
import { useLecturers } from '@/features/lecturers/hooks/useLecturers'
import { PaymentReceivedCard } from '@/features/payments/components/PaymentReceivedCard'
import { PaymentSummaryBar } from '@/features/payments/components/PaymentSummaryBar'
import { PendingPaymentsCard } from '@/features/payments/components/PendingPaymentsCard'
import { DashboardPaymentRow } from '@/features/payments/components/DashboardPaymentRow'
import { usePaymentReadinessSummary } from '@/features/payments/hooks/usePaymentReadinessSummary'
import { calculateMonthlyPayment, monthKeyFor } from '@/features/payments/utils/monthlyCalc'
import { usePaymentRuleAmounts } from '@/features/paymentRules/hooks/usePaymentRules'
import { useAuth } from '@/hooks/useAuth'

/**
 * Admin dashboard — regenerated 2026-08-10 to match the office's reference
 * mockup: a red/black welcome banner with at-a-glance totals, side-by-side
 * "Pending Payments"/"Payment Received" lecturer lists, and a bottom payment
 * summary strip with a collection-rate donut. Every figure is derived from
 * the same usePaymentReadinessSummary + calculateMonthlyPayment pipeline
 * every other payment view in the app uses (see PaymentReadinessPage,
 * LecturerPaymentHighlights) — nothing here is hardcoded.
 */
export default function AdminDashboardPage() {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const [monthKey, setMonthKey] = useState(monthKeyFor())

  const { rows, loading: rowsLoading } = usePaymentReadinessSummary(undefined, monthKey)
  const { data: lecturers, loading: lecturersLoading } = useLecturers()
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
        return {
          ...row,
          lecturerName: lecturerById[row.rule.lecturerId]?.fullName ?? 'Unknown lecturer',
          scopeLabel: [courseById[row.rule.courseId]?.name, batchById[row.rule.batchId]?.batchCode]
            .filter(Boolean)
            .join(' · '),
          currency: amount?.currency ?? '',
          monthlyAmount: amount?.monthlyAmount ?? 0,
          finalPayment,
        }
      })
      .sort((a, b) => b.finalPayment - a.finalPayment || b.completed - a.completed)
  }, [rows, amounts, lecturerById, courseById, batchById])

  const pendingRows = useMemo(() => enrichedRows.filter((row) => !row.alreadyPaid), [enrichedRows])
  const paidRows = useMemo(() => enrichedRows.filter((row) => row.alreadyPaid), [enrichedRows])
  const completedPendingRows = useMemo(
    () =>
      pendingRows.filter(
        (row) => Number(row.rule.monthlyClassCount) > 0 && row.completed >= Number(row.rule.monthlyClassCount)
      ),
    [pendingRows]
  )

  const currency = enrichedRows.find((row) => row.currency)?.currency ?? ''
  const totalPending = pendingRows.reduce((sum, row) => sum + row.finalPayment, 0)
  const totalReceived = paidRows.reduce((sum, row) => sum + row.finalPayment, 0)
  const classesCompleted = enrichedRows.reduce((sum, row) => sum + row.completed, 0)
  const activeLecturerCount = lecturers.filter((l) => l.active !== false).length

  const loading = rowsLoading || amountsLoading
  const heroLoading = loading || lecturersLoading

  return (
    <div className="space-y-6">
      <DashboardWelcomeBanner
        name={profile?.fullName?.split(' ')[0] ?? 'Admin'}
        monthKey={monthKey}
        onMonthChange={(value) => setMonthKey(value || monthKeyFor())}
        totalLecturers={activeLecturerCount}
        classesCompleted={classesCompleted}
        totalPending={totalPending}
        totalReceived={totalReceived}
        currency={currency}
        loading={heroLoading}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <PendingPaymentsCard rows={pendingRows} loading={loading} viewAllHref={ROUTES.ADMIN_PAYMENT_READINESS} />
        <PaymentReceivedCard rows={paidRows} loading={loading} viewAllHref={ROUTES.ADMIN_PAYMENT_READINESS} />
      </div>

      {!loading && completedPendingRows.length > 0 ? (
        <Card className="border-success/35 bg-success/5 shadow-sm ring-1 ring-success/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-success">
              <CheckCircle2 className="size-5" />
              Completed Classes Ready For Payment
            </CardTitle>
            <CardDescription>
              {completedPendingRows.length} payment {completedPendingRows.length === 1 ? 'rule has' : 'rules have'} completed this month&apos;s class target.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {completedPendingRows.slice(0, 5).map((row) => (
              <DashboardPaymentRow
                key={row.rowKey ?? row.rule.id}
                lecturerName={row.lecturerName}
                scopeLabel={row.scopeLabel}
                completed={row.completed}
                target={row.rule.monthlyClassCount}
                currency={row.currency}
                finalPayment={row.finalPayment}
                monthlyAmount={row.monthlyAmount}
                paid={false}
                onClick={() => navigate(ROUTES.ADMIN_PAYMENT_READINESS)}
              />
            ))}
            <Button
              variant="outline"
              className="w-full border-success/30 text-success hover:bg-success/10 hover:text-success"
              onClick={() => navigate(ROUTES.ADMIN_PAYMENT_READINESS)}
            >
              Review Ready Payments <ArrowRight />
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <PaymentSummaryBar
        totalPayable={totalPending + totalReceived}
        totalReceived={totalReceived}
        totalPending={totalPending}
        currency={currency}
        loading={loading}
      />
    </div>
  )
}
