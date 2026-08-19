import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BookOpenCheck,
  CalendarCheck2,
  CheckCircle2,
  ChevronRight,
  Clock3,
  CreditCard,
  GraduationCap,
  Layers,
  Loader2,
  Sparkles,
  Wallet,
} from 'lucide-react'
import toast from 'react-hot-toast'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/common/EmptyState'
import { ROUTES } from '@/constants/routes'
import { BATCH_STATUS, PAYMENT_CYCLE_STATUS, SCHEDULE_STATUS } from '@/constants/statuses'
import { useLecturerBatches } from '@/features/batches/hooks/useBatches'
import { deriveBatchStatus } from '@/features/batches/services/batchService'
import { useCourses } from '@/features/courses/hooks/useCourses'
import { LecturerPaymentSummaryRow } from '@/features/payments/components/LecturerPaymentSummaryRow'
import { usePaymentReadinessSummary } from '@/features/payments/hooks/usePaymentReadinessSummary'
import { useConfirmPaymentReceived } from '@/features/payments/hooks/usePayments'
import {
  calculateMonthlyPayment,
  formatCurrency,
  monthKeyFor,
} from '@/features/payments/utils/monthlyCalc'
import { usePaymentRuleAmounts } from '@/features/paymentRules/hooks/usePaymentRules'
import { useLecturerSchedules } from '@/features/schedules/hooks/useSchedules'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'
import { toDate } from '@/utils/formatters'

const TILE_TONES = {
  red: 'bg-primary/10 text-primary border-primary/15',
  green: 'bg-success/10 text-success border-success/15',
  orange: 'bg-warning/10 text-warning border-warning/15',
  teal: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/15',
}

const TILE_BACKGROUNDS = {
  red: 'bg-gradient-to-br from-primary/10 via-card to-card',
  green: 'bg-gradient-to-br from-success/10 via-card to-card',
  orange: 'bg-gradient-to-br from-warning/10 via-card to-card',
  teal: 'bg-gradient-to-br from-emerald-500/10 via-card to-card',
}

function SummaryTile({ icon: Icon, label, value, hint, tone = 'red', valueClassName }) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border border-border p-4 shadow-sm',
        TILE_BACKGROUNDS[tone]
      )}
    >
      <Sparkles className="absolute top-3 right-3 size-3.5 text-muted-foreground/30" />
      <div className="relative flex items-start gap-3">
        <div className={cn('flex size-11 shrink-0 items-center justify-center rounded-full border', TILE_TONES[tone])}>
          <Icon className="size-5" />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-medium text-muted-foreground">{label}</p>
          <p className={cn('mt-1 text-2xl font-bold leading-none tabular-nums text-foreground', valueClassName)}>{value}</p>
          <p className="mt-2 text-[11px] text-muted-foreground">{hint}</p>
        </div>
      </div>
    </div>
  )
}

function MiniMetric({ icon: Icon, label, value, tone = 'red', action }) {
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-3 rounded-md border px-3 py-2',
        tone === 'green'
          ? 'border-success/15 bg-success/10'
          : tone === 'orange'
            ? 'border-warning/15 bg-warning/10'
            : 'border-border bg-muted/40'
      )}
    >
      <span
        className={cn(
          'flex size-8 shrink-0 items-center justify-center rounded-lg',
          tone === 'green'
            ? 'bg-success/10 text-success'
            : tone === 'orange'
              ? 'bg-warning/10 text-warning'
              : 'bg-card text-muted-foreground'
        )}
      >
        <Icon className="size-4" />
      </span>
      <span className="flex min-w-0 flex-1 items-center justify-between gap-2">
        <span className="min-w-0">
          <p className="text-[10px] font-medium text-muted-foreground">{label}</p>
          <p
            className={cn(
              'truncate text-sm font-bold tabular-nums',
              tone === 'green' ? 'text-success' : tone === 'orange' ? 'text-warning' : 'text-foreground'
            )}
          >
            {value}
          </p>
        </span>
        {action}
      </span>
    </div>
  )
}

function rowBelongsToBatch(row, batch) {
  if (row.rule.batchId) return row.rule.batchId === batch.id
  return row.rule.courseId === batch.courseId
}

function previousMonthKeyFor(monthKey) {
  const date = new Date(`${monthKey}-01T00:00:00`)
  date.setMonth(date.getMonth() - 1)
  return monthKeyFor(date)
}

export default function LecturerDashboardPage() {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const lecturerId = profile?.lecturerId
  const monthKey = monthKeyFor()
  const previousMonthKey = previousMonthKeyFor(monthKey)

  const { data: batches, loading: batchesLoading } = useLecturerBatches(lecturerId)
  const { data: schedules, loading: schedulesLoading } = useLecturerSchedules(lecturerId)
  const { data: courses } = useCourses()
  const { rows, loading: paymentRowsLoading } = usePaymentReadinessSummary(lecturerId, monthKey)
  const { rows: previousRows, loading: previousRowsLoading } = usePaymentReadinessSummary(lecturerId, previousMonthKey)
  const confirmReceived = useConfirmPaymentReceived()

  const dashboardBatches = useMemo(() => {
    return batches
      .map((batch) => {
        const batchSchedules = schedules.filter((schedule) => schedule.batchId === batch.id)
        const completed = batchSchedules.filter((schedule) => schedule.status === SCHEDULE_STATUS.COMPLETED).length
        const planned = Number(batch.plannedClassCount) || 0
        const status = planned > 0 && completed >= planned ? BATCH_STATUS.COMPLETED : deriveBatchStatus(batch)
        return { ...batch, completed, planned, status }
      })
      .filter((batch) => batch.active !== false)
      .sort((a, b) => {
        const aStart = toDate(a.startDate)?.getTime() ?? 0
        const bStart = toDate(b.startDate)?.getTime() ?? 0
        return aStart - bStart
      })
  }, [batches, schedules])

  const dashboardBatchIds = useMemo(() => new Set(dashboardBatches.map((batch) => batch.id)), [dashboardBatches])
  const dashboardCourseIds = useMemo(() => new Set(dashboardBatches.map((batch) => batch.courseId)), [dashboardBatches])
  const courseById = useMemo(() => Object.fromEntries(courses.map((course) => [course.id, course])), [courses])

  const activeRows = useMemo(
    () =>
      rows.filter((row) => {
        if (row.rule.batchId) return dashboardBatchIds.has(row.rule.batchId)
        return dashboardCourseIds.has(row.rule.courseId)
      }),
    [rows, dashboardBatchIds, dashboardCourseIds]
  )

  const ruleIds = useMemo(() => activeRows.map((row) => row.rule.id), [activeRows])
  const { data: amounts, loading: amountsLoading } = usePaymentRuleAmounts(ruleIds)
  const previousActiveRows = useMemo(
    () =>
      previousRows.filter((row) => {
        if (row.rule.batchId) return dashboardBatchIds.has(row.rule.batchId)
        return dashboardCourseIds.has(row.rule.courseId)
      }),
    [previousRows, dashboardBatchIds, dashboardCourseIds]
  )
  const previousRuleIds = useMemo(() => previousActiveRows.map((row) => row.rule.id), [previousActiveRows])
  const { data: previousAmounts, loading: previousAmountsLoading } = usePaymentRuleAmounts(previousRuleIds)

  const enrichedRows = useMemo(
    () =>
      activeRows.map((row) => {
        const amount = amounts[row.rule.id] ?? null
        const { finalPayment } = calculateMonthlyPayment({
          monthlyAmount: amount?.monthlyAmount,
          monthlyClassCount: row.rule.monthlyClassCount,
          completed: row.completed,
        })
        return { ...row, amount, finalPayment }
      }),
    [activeRows, amounts]
  )
  const previousEnrichedRows = useMemo(
    () =>
      previousActiveRows.map((row) => {
        const amount = previousAmounts[row.rule.id] ?? null
        const { finalPayment } = calculateMonthlyPayment({
          monthlyAmount: amount?.monthlyAmount,
          monthlyClassCount: row.rule.monthlyClassCount,
          completed: row.completed,
        })
        return { ...row, amount, finalPayment }
      }),
    [previousActiveRows, previousAmounts]
  )

  const pendingRows = useMemo(() => enrichedRows.filter((row) => !row.alreadyPaid), [enrichedRows])
  const pendingConfirmRows = useMemo(
    () => enrichedRows.filter((row) => row.payment?.status === PAYMENT_CYCLE_STATUS.APPROVED),
    [enrichedRows]
  )
  const paidRows = useMemo(
    () => enrichedRows.filter((row) => row.payment?.status === PAYMENT_CYCLE_STATUS.PAID),
    [enrichedRows]
  )
  const receivedRows = useMemo(() => [...pendingConfirmRows, ...paidRows], [pendingConfirmRows, paidRows])
  const visiblePaymentRows = pendingRows.length + receivedRows.length
  const previousPendingRows = useMemo(
    () => previousEnrichedRows.filter((row) => !row.alreadyPaid && row.completed > 0),
    [previousEnrichedRows]
  )
  const activeCompleted = dashboardBatches.reduce((sum, batch) => sum + batch.completed, 0)
  const activePlanned = dashboardBatches.reduce((sum, batch) => sum + batch.planned, 0)
  const activeProgressPercent = activePlanned > 0 ? Math.min(100, Math.round((activeCompleted / activePlanned) * 100)) : 0
  const pendingPayment = pendingRows.reduce((sum, row) => sum + row.finalPayment, 0)
  const receivedPayment = paidRows.reduce((sum, row) => sum + row.finalPayment, 0)
  const currency = enrichedRows.find((row) => row.amount?.currency)?.amount?.currency ?? ''
  const previousPendingPayment = previousPendingRows.reduce((sum, row) => sum + row.finalPayment, 0)
  const previousCurrency = previousPendingRows.find((row) => row.amount?.currency)?.amount?.currency ?? currency
  const loading =
    batchesLoading || schedulesLoading || paymentRowsLoading || previousRowsLoading || amountsLoading || previousAmountsLoading
  const batchPaymentMeta = (batch) => {
    const batchRows = enrichedRows.filter((row) => rowBelongsToBatch(row, batch))
    const batchPending = batchRows
      .filter((row) => !row.alreadyPaid)
      .reduce((sum, row) => sum + row.finalPayment, 0)
    const batchPaid = batchRows
      .filter((row) => row.payment?.status === PAYMENT_CYCLE_STATUS.PAID)
      .reduce((sum, row) => sum + row.finalPayment, 0)
    const batchCurrency = batchRows.find((row) => row.amount?.currency)?.amount?.currency ?? currency
    return { batchPending, batchPaid, batchCurrency }
  }

  const scopeLabelFor = (row) => {
    const batch = row.rule.batchId ? dashboardBatches.find((item) => item.id === row.rule.batchId) : null
    return [courseById[row.rule.courseId]?.name, batch?.batchCode].filter(Boolean).join(' / ')
  }

  const handleConfirmReceived = async (paymentId) => {
    try {
      await confirmReceived.mutateAsync(paymentId)
      toast.success('Payment marked as received')
    } catch (error) {
      toast.error(error.message || 'Failed to confirm payment')
    }
  }

  const handleConfirmBatchReceived = async (rowsToConfirm) => {
    try {
      await Promise.all(rowsToConfirm.map((row) => confirmReceived.mutateAsync(row.payment.id)))
      toast.success('Payment marked as received')
    } catch (error) {
      toast.error(error.message || 'Failed to confirm payment')
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-foreground">
          Welcome back, {profile?.fullName || 'there'} 👋
        </h1>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Your batches, classes, and monthly payment details.
        </p>
      </div>

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-44 w-full" />
          <Skeleton className="h-56 w-full" />
        </div>
      ) : dashboardBatches.length === 0 ? (
        <EmptyState
          icon={Layers}
          title="No assigned batches"
          description="When course batches are assigned, their class and payment details will show here."
        />
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <SummaryTile
              icon={Layers}
              label="Assigned batches"
              value={dashboardBatches.length}
              hint="Active batches on your profile"
              tone="red"
            />
            <SummaryTile
              icon={CheckCircle2}
              label="Batch progress"
              value={`${activeProgressPercent}%`}
              hint={`${activeCompleted} of ${activePlanned || '-'} classes completed`}
              tone="green"
            />
            <SummaryTile
              icon={Clock3}
              label="Pending payment"
              value={formatCurrency(pendingPayment, currency)}
              hint="Awaiting payment"
              tone="orange"
              valueClassName="text-warning"
            />
            <SummaryTile
              icon={Wallet}
              label="Payment received"
              value={formatCurrency(receivedPayment, currency)}
              hint="Total received"
              tone="teal"
              valueClassName="text-success"
            />
          </div>

          {previousPendingRows.length > 0 ? (
            <Card className="border-warning/40 bg-warning/10 shadow-sm ring-1 ring-warning/20">
              <CardContent className="space-y-4 p-5">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-start gap-4">
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-warning/15 text-warning">
                      <Clock3 className="size-5" />
                    </span>
                    <div>
                      <p className="text-sm font-bold text-foreground">
                        Earlier unpaid payment
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {previousPendingRows.length} pending {previousPendingRows.length === 1 ? 'rule' : 'rules'} still need payment.
                      </p>
                    </div>
                  </div>
                  <div className="text-left md:text-right">
                    <p className="text-xs font-medium text-muted-foreground">Pending amount</p>
                    <p className="text-2xl font-bold tabular-nums text-warning">
                      {formatCurrency(previousPendingPayment, previousCurrency)}
                    </p>
                  </div>
                </div>
                <div className="grid gap-3 xl:grid-cols-2">
                  {previousPendingRows.map((row) => (
                    <LecturerPaymentSummaryRow
                      key={row.rowKey ?? row.rule.id}
                      scopeLabel={scopeLabelFor(row)}
                      completed={row.completed}
                      target={row.rule.monthlyClassCount}
                      amount={row.amount}
                      finalPayment={row.finalPayment}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : null}

          <div>
            <Card className="border-border bg-card shadow-sm">
              <CardHeader className="flex-row items-center justify-between gap-3 p-4 pb-3">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <CalendarCheck2 className="size-4 text-primary" />
                    My Active Batches
                  </CardTitle>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1 text-xs"
                  onClick={() => navigate(ROUTES.LECTURER_SCHEDULE)}
                >
                  View all batches
                  <ChevronRight className="size-3.5" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-3 px-4 pb-4">
                {dashboardBatches.map((batch) => {
                  const percent =
                    batch.planned > 0 ? Math.min(100, Math.round((batch.completed / batch.planned) * 100)) : 0
                  const { batchPending, batchPaid, batchCurrency } = batchPaymentMeta(batch)
                  return (
                    <div
                      key={batch.id}
                      className="rounded-xl border border-border border-l-2 border-l-primary/60 bg-background p-4 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-start gap-3">
                          <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                            <GraduationCap className="size-5" />
                          </span>
                          <div className="min-w-0">
                            <p className="line-clamp-2 text-sm font-bold leading-tight text-foreground">
                              {courseById[batch.courseId]?.name ?? 'Course'}
                            </p>
                            <p className="mt-1 text-xs font-medium text-muted-foreground">{batch.batchCode}</p>
                          </div>
                        </div>
                        <Badge className="bg-success/10 text-success hover:bg-success/10">Active</Badge>
                      </div>

                      <div className="mt-4 grid gap-3 border-t border-border pt-3 sm:grid-cols-[0.42fr_1fr]">
                        <div>
                          <p className="text-[10px] font-medium text-muted-foreground">Classes completed</p>
                          <p className="text-sm font-bold text-primary">
                            {batch.completed} / {batch.planned || '-'} classes
                          </p>
                        </div>
                        <div>
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-[10px] font-medium text-muted-foreground">Progress</p>
                            <p className="text-xs font-bold tabular-nums text-foreground">{percent}%</p>
                          </div>
                          <Progress value={percent} className="mt-1.5 h-1.5 [&_[data-slot=progress-indicator]]:bg-primary" />
                        </div>
                      </div>

                      <div className="mt-3 grid gap-2 sm:grid-cols-3">
                        <MiniMetric icon={CalendarCheck2} label="Planned classes" value={`${batch.planned || '-'} classes`} />
                        <MiniMetric
                          icon={Clock3}
                          label="Pending payment"
                          value={formatCurrency(batchPending, batchCurrency)}
                          tone="orange"
                        />
                        <MiniMetric
                          icon={CreditCard}
                          label="Received payment"
                          value={formatCurrency(batchPaid, batchCurrency)}
                          tone="green"
                        />
                      </div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          </div>

          <Card className="border-border bg-card shadow-sm">
            <CardHeader className="p-4 pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <BookOpenCheck className="size-4 text-warning" />
                Payment Details
              </CardTitle>
              <CardDescription className="text-xs font-medium text-foreground">
                Payments connected to your active batches
              </CardDescription>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              {visiblePaymentRows === 0 ? (
                <EmptyState
                  icon={Wallet}
                  title="No payments pending"
                  description="Pending and received payments for your active batches will show here."
                  className="border-none bg-transparent py-10"
                />
              ) : (
                <div className="grid gap-4 xl:grid-cols-2">
                  <div className="rounded-lg border border-warning/30 bg-gradient-to-br from-warning/10 via-background to-warning/5 p-4">
                    <div className="mb-4 flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-1.5 text-sm font-semibold text-warning">
                        <Clock3 className="size-4 text-warning" />
                          Pending Payments
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {pendingRows.length} payment{pendingRows.length === 1 ? '' : 's'} awaiting payment
                        </p>
                      </div>
                    </div>
                    {pendingRows.length === 0 ? (
                      <EmptyState
                        icon={Clock3}
                        title="Nothing pending"
                        description="No unpaid payment items right now."
                        className="border-none bg-transparent py-8"
                      />
                    ) : (
                      <div className="space-y-3">
                        {pendingRows.map((row) => (
                          <LecturerPaymentSummaryRow
                            key={row.rowKey ?? row.rule.id}
                            scopeLabel={scopeLabelFor(row)}
                            completed={row.completed}
                            target={row.rule.monthlyClassCount}
                            amount={row.amount}
                            finalPayment={row.finalPayment}
                            compact
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="rounded-lg border border-success/30 bg-gradient-to-br from-success/10 via-background to-success/5 p-4">
                    <div className="mb-4 flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-1.5 text-sm font-semibold text-success">
                        <CreditCard className="size-4 text-success" />
                          Payment Received
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {receivedRows.length} payment{receivedRows.length === 1 ? '' : 's'} paid or received
                        </p>
                      </div>
                    </div>
                    {receivedRows.length === 0 ? (
                      <EmptyState
                        icon={CheckCircle2}
                        title="No received payments"
                        description="Paid payments will show here."
                        className="border-none bg-transparent py-8"
                      />
                    ) : (
                      <div className="space-y-3">
                        {pendingConfirmRows.map((row) => (
                          <LecturerPaymentSummaryRow
                            key={row.rowKey ?? row.rule.id}
                            scopeLabel={scopeLabelFor(row)}
                            completed={row.completed}
                            target={row.rule.monthlyClassCount}
                            amount={row.amount}
                            finalPayment={row.finalPayment}
                            paid
                            compact
                            action={
                              <Button
                                size="sm"
                                className="h-8 shrink-0 bg-success text-success-foreground hover:bg-success/90 disabled:opacity-80"
                                disabled={confirmReceived.isPending}
                                onClick={() => handleConfirmReceived(row.payment.id)}
                              >
                                {confirmReceived.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
                                Received
                              </Button>
                            }
                          />
                        ))}
                        {paidRows.map((row) => (
                          <LecturerPaymentSummaryRow
                            key={row.rowKey ?? row.rule.id}
                            scopeLabel={scopeLabelFor(row)}
                            completed={row.completed}
                            target={row.rule.monthlyClassCount}
                            amount={row.amount}
                            finalPayment={row.finalPayment}
                            paid
                            compact
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
