import { useMemo } from 'react'
import { BookOpenCheck, CalendarCheck2, CheckCircle2, Clock3, GraduationCap, Layers, Wallet } from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/common/EmptyState'
import { PageHeader } from '@/components/common/PageHeader'
import { StatusPill } from '@/components/common/StatusPill'
import { BATCH_STATUS, SCHEDULE_STATUS } from '@/constants/statuses'
import { useLecturerBatches } from '@/features/batches/hooks/useBatches'
import { deriveBatchStatus } from '@/features/batches/services/batchService'
import { useCourses } from '@/features/courses/hooks/useCourses'
import { LecturerPaymentSummaryRow } from '@/features/payments/components/LecturerPaymentSummaryRow'
import { usePaymentReadinessSummary } from '@/features/payments/hooks/usePaymentReadinessSummary'
import {
  calculateMonthlyPayment,
  formatCurrency,
  monthKeyFor,
  monthKeyLabel,
} from '@/features/payments/utils/monthlyCalc'
import { usePaymentRuleAmounts } from '@/features/paymentRules/hooks/usePaymentRules'
import { useLecturerSchedules } from '@/features/schedules/hooks/useSchedules'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'
import { toDate } from '@/utils/formatters'

const TILE_TONES = {
  red: 'bg-primary/10 text-primary',
  green: 'bg-success/10 text-success',
  orange: 'bg-warning/10 text-warning',
  teal: 'bg-emerald-500/10 text-emerald-600',
}

function SummaryTile({ icon: Icon, label, value, hint, tone = 'red', valueClassName }) {
  return (
    <div className="rounded-xl border border-border/80 bg-card p-5 shadow-sm">
      <div className="flex items-start gap-4">
        <div className={cn('flex size-11 shrink-0 items-center justify-center rounded-lg', TILE_TONES[tone])}>
          <Icon className="size-5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <p className={cn('mt-1 text-2xl font-bold tabular-nums text-foreground', valueClassName)}>{value}</p>
          <p className="mt-2 text-xs text-muted-foreground">{hint}</p>
        </div>
      </div>
    </div>
  )
}

function rowBelongsToBatch(row, batch) {
  if (!batch) return false
  if (row.rule.batchId) return row.rule.batchId === batch.id
  return row.rule.courseId === batch.courseId
}

export default function LecturerDashboardPage() {
  const { profile } = useAuth()
  const lecturerId = profile?.lecturerId
  const monthKey = monthKeyFor()

  const { data: batches, loading: batchesLoading } = useLecturerBatches(lecturerId)
  const { data: schedules, loading: schedulesLoading } = useLecturerSchedules(lecturerId)
  const { data: courses } = useCourses()
  const { rows, loading: paymentRowsLoading } = usePaymentReadinessSummary(lecturerId, monthKey)

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

  const currentBatch = useMemo(() => {
    return (
      dashboardBatches.find((batch) => {
        const batchRows = enrichedRows.filter((row) => rowBelongsToBatch(row, batch))
        const classesCompleted = batch.planned > 0 && batch.completed >= batch.planned
        const hasPendingPayment = batchRows.some((row) => !row.alreadyPaid)
        const hasReceivedPayment = batchRows.some((row) => row.alreadyPaid)
        return !(classesCompleted && hasReceivedPayment && !hasPendingPayment)
      }) ?? null
    )
  }, [dashboardBatches, enrichedRows])

  const currentRows = useMemo(
    () => enrichedRows.filter((row) => rowBelongsToBatch(row, currentBatch)),
    [enrichedRows, currentBatch]
  )
  const pendingRows = useMemo(() => currentRows.filter((row) => !row.alreadyPaid), [currentRows])
  const paidRows = useMemo(() => currentRows.filter((row) => row.alreadyPaid), [currentRows])
  const activeCompleted = currentBatch?.completed ?? 0
  const activePlanned = currentBatch?.planned ?? 0
  const activeProgressPercent = activePlanned > 0 ? Math.min(100, Math.round((activeCompleted / activePlanned) * 100)) : 0
  const pendingPayment = pendingRows.reduce((sum, row) => sum + row.finalPayment, 0)
  const receivedPayment = paidRows.reduce((sum, row) => sum + row.finalPayment, 0)
  const currency = currentRows.find((row) => row.amount?.currency)?.amount?.currency ?? ''
  const loading = batchesLoading || schedulesLoading || paymentRowsLoading || amountsLoading

  const scopeLabelFor = (row) => {
    const batch = row.rule.batchId ? dashboardBatches.find((item) => item.id === row.rule.batchId) : null
    return [courseById[row.rule.courseId]?.name, batch?.batchCode].filter(Boolean).join(' / ')
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome back, ${profile?.fullName?.split(' ')[0] ?? 'there'}`}
        description="Your current course, batch, classes, and payment details."
      />

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-44 w-full" />
          <Skeleton className="h-56 w-full" />
        </div>
      ) : !currentBatch ? (
        <EmptyState
          icon={Layers}
          title="No current batch"
          description="When the next course batch is assigned, its class and payment details will show here."
        />
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <SummaryTile
              icon={Layers}
              label="Current batch"
              value={currentBatch.batchCode}
              hint={courseById[currentBatch.courseId]?.name ?? 'Course'}
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

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarCheck2 className="size-4 text-primary" />
                Current Course & Batch
              </CardTitle>
              <CardDescription className="font-medium text-foreground">{monthKeyLabel(monthKey)}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[currentBatch].map((batch) => {
                const percent = batch.planned > 0 ? Math.min(100, Math.round((batch.completed / batch.planned) * 100)) : 0
                return (
                  <div key={batch.id} className="rounded-xl border border-border bg-background p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex min-w-0 items-start gap-3">
                        <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <GraduationCap className="size-6" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-base font-bold text-foreground">
                            {courseById[batch.courseId]?.name ?? 'Course'}
                          </p>
                          <p className="mt-1 text-sm font-medium text-muted-foreground">{batch.batchCode}</p>
                        </div>
                      </div>
                      <StatusPill status={batch.status} />
                    </div>
                    <div className="mt-4">
                      <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                        Batch Class Progress
                      </p>
                      <div className="mt-1 flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-foreground">
                          {batch.completed} / {batch.planned || '-'} classes
                        </p>
                        <p className="text-sm font-bold tabular-nums text-foreground">{percent}%</p>
                      </div>
                      <Progress
                        value={percent}
                        className="mt-2 h-1.5 [&_[data-slot=progress-indicator]]:bg-primary"
                      />
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpenCheck className="size-4 text-warning" />
                Current Payment Details
              </CardTitle>
              <CardDescription className="font-medium text-foreground">{monthKeyLabel(monthKey)}</CardDescription>
            </CardHeader>
            <CardContent>
              {currentRows.length === 0 ? (
                <EmptyState
                  icon={Wallet}
                  title="No payment rule for current batch"
                  description="Once the office adds a payment rule for this course and batch, details will show here."
                  className="border-none bg-transparent py-10"
                />
              ) : (
                <div className="space-y-6">
                  {pendingRows.length > 0 ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                        <Clock3 className="size-4 text-warning" />
                        Pending Payment
                      </div>
                      <div className="space-y-3">
                        {pendingRows.map((row) => (
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
                    </div>
                  ) : null}

                  {paidRows.length > 0 ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                        <CheckCircle2 className="size-4 text-success" />
                        Payment Received
                      </div>
                      <div className="space-y-3">
                        {paidRows.map((row) => (
                          <LecturerPaymentSummaryRow
                            key={row.rowKey ?? row.rule.id}
                            scopeLabel={scopeLabelFor(row)}
                            completed={row.completed}
                            target={row.rule.monthlyClassCount}
                            amount={row.amount}
                            finalPayment={row.finalPayment}
                            paid
                          />
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
