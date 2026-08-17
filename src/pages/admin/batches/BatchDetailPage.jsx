import { useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { format } from 'date-fns'
import { ArrowLeft, CalendarClock, CheckCircle2, Clock, FileUp } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { DataTable } from '@/components/common/DataTable'
import { EmptyState } from '@/components/common/EmptyState'
import { PageHeader } from '@/components/common/PageHeader'
import { StatCard } from '@/components/common/StatCard'
import { StatusPill } from '@/components/common/StatusPill'
import { ROUTES } from '@/constants/routes'
import { SCHEDULE_STATUS } from '@/constants/statuses'
import { useBatch } from '@/features/batches/hooks/useBatches'
import { deriveBatchStatus } from '@/features/batches/services/batchService'
import { useBatchReports } from '@/features/classReports/hooks/useClassReports'
import { useCourse } from '@/features/courses/hooks/useCourses'
import { useLecturer } from '@/features/lecturers/hooks/useLecturers'
import { usePaymentRules } from '@/features/paymentRules/hooks/usePaymentRules'
import { matchPaymentRuleForScope } from '@/features/paymentRules/utils/matchRule'
import { PaymentReadinessRow } from '@/features/payments/components/PaymentReadinessRow'
import { monthKeyFor, summarizeMonth } from '@/features/payments/utils/monthlyCalc'
import { useBatchSchedules } from '@/features/schedules/hooks/useSchedules'
import { toDate } from '@/utils/formatters'

export default function BatchDetailPage() {
  const { batchId } = useParams()
  const navigate = useNavigate()

  const { data: batch, loading: batchLoading } = useBatch(batchId)
  const { data: course } = useCourse(batch?.courseId)
  const { data: lecturer } = useLecturer(batch?.lecturerId)
  const { data: schedules, loading: schedulesLoading } = useBatchSchedules(batchId)
  const { data: reports } = useBatchReports(batchId)
  const { data: rules } = usePaymentRules()

  const reportBySchedule = useMemo(
    () => Object.fromEntries(reports.map((r) => [r.scheduleId, r])),
    [reports]
  )

  const stats = useMemo(() => {
    const completed = schedules.filter((s) => s.status === SCHEDULE_STATUS.COMPLETED).length
    const pending = schedules.filter((s) =>
      [SCHEDULE_STATUS.SCHEDULED, SCHEDULE_STATUS.DRAFT_REPORT].includes(s.status)
    ).length
    const cancelled = schedules.filter((s) => s.status === SCHEDULE_STATUS.CANCELLED).length
    const materials = reports.reduce((sum, r) => sum + (r.materialCount || 0), 0)
    return { total: schedules.length, completed, pending, cancelled, materials }
  }, [schedules, reports])

  const currentMonthKey = monthKeyFor()

  const matchedRule = useMemo(() => {
    if (!batch) return null
    return matchPaymentRuleForScope(
      rules.filter((r) => r.active !== false && (!r.periodMonth || r.periodMonth === currentMonthKey)),
      { lecturerId: batch.lecturerId, courseId: batch.courseId, batchId: batch.id, periodMonth: currentMonthKey }
    )
  }, [rules, batch, currentMonthKey])

  // `schedules` here is already batch-scoped (useBatchSchedules), which is
  // strictly narrower than the matched rule's own scope, so no extra
  // rule-matching is needed — just narrow to the current calendar month.
  const monthSummary = useMemo(() => {
    const inMonth = schedules.filter((s) => {
      const date = toDate(s.classDate)
      return date && monthKeyFor(date) === currentMonthKey
    })
    return summarizeMonth(inMonth)
  }, [schedules, currentMonthKey])

  const columns = [
    {
      key: 'when',
      header: 'Date & time',
      render: (row) => {
        const date = toDate(row.classDate)
        return (
          <span className="text-sm text-muted-foreground">
            {date ? format(date, 'MMM d, yyyy') : '—'} · {row.startTime}–{row.endTime}
          </span>
        )
      },
    },
    { key: 'lecturer', header: 'Lecturer', render: () => lecturer?.fullName ?? '—' },
    {
      key: 'topic',
      header: 'Topic covered',
      render: (row) => reportBySchedule[row.id]?.topicCovered || '—',
    },
    {
      key: 'materials',
      header: 'Materials',
      render: (row) => reportBySchedule[row.id]?.materialCount || 0,
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StatusPill status={row.status} />,
    },
  ]

  if (batchLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (!batch) {
    return (
      <EmptyState
        title="Batch not found"
        description="This batch may have been removed."
        action={
          <Button variant="outline" onClick={() => navigate(ROUTES.ADMIN_BATCHES)}>
            <ArrowLeft className="size-4" /> Back to batches
          </Button>
        }
      />
    )
  }

  const startDate = toDate(batch.startDate)
  const endDate = toDate(batch.endDate)

  return (
    <div className="space-y-6">
      <Button
        variant="ghost"
        size="sm"
        className="text-muted-foreground"
        onClick={() => navigate(ROUTES.ADMIN_BATCHES)}
      >
        <ArrowLeft className="size-4" /> Back to batches
      </Button>

      <PageHeader
        title={batch.batchCode}
        description={course?.name ? `${course.name} · ${lecturer?.fullName ?? 'Unassigned'}` : undefined}
        actions={<StatusPill status={deriveBatchStatus(batch)} />}
      />

      <Card>
        <CardContent className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4">
          <InfoField label="Course" value={course?.name} />
          <InfoField label="Lecturer" value={lecturer?.fullName} />
          <InfoField
            label="Dates"
            value={
              startDate && endDate
                ? `${format(startDate, 'MMM d, yyyy')} – ${format(endDate, 'MMM d, yyyy')}`
                : '—'
            }
          />
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase">Planned progress</p>
            <Progress
              value={
                batch.plannedClassCount > 0
                  ? Math.min(100, Math.round((stats.completed / batch.plannedClassCount) * 100))
                  : 0
              }
              className="h-1.5"
            />
            <p className="text-xs text-muted-foreground">
              {stats.completed}/{batch.plannedClassCount || 0} classes
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total classes" value={stats.total} icon={CalendarClock} tone="primary" />
        <StatCard label="Completed" value={stats.completed} icon={CheckCircle2} tone="accent" />
        <StatCard label="Pending" value={stats.pending} icon={Clock} tone="warning" />
        <StatCard label="Materials" value={stats.materials} icon={FileUp} tone="muted" />
      </div>

      {matchedRule ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Payment progress</CardTitle>
          </CardHeader>
          <CardContent>
            <PaymentReadinessRow
              rule={matchedRule}
              lecturer={lecturer}
              monthKey={currentMonthKey}
              totalScheduled={monthSummary.totalScheduled}
              completed={monthSummary.completed}
              completedSchedules={monthSummary.completedSchedules}
              isReady={monthSummary.completed > 0}
              showAmount
              canApprove={false}
            />
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Classes</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={schedules}
            loading={schedulesLoading}
            emptyTitle="No classes yet"
            emptyDescription="Classes scheduled for this batch will appear here."
          />
        </CardContent>
      </Card>
    </div>
  )
}

function InfoField({ label, value }) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground uppercase">{label}</p>
      <p className="text-sm text-foreground">{value || '—'}</p>
    </div>
  )
}
