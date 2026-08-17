import { useMemo } from 'react'

import { EmptyState } from '@/components/common/EmptyState'
import { useBatches } from '@/features/batches/hooks/useBatches'
import { useCourses } from '@/features/courses/hooks/useCourses'
import { useLecturers } from '@/features/lecturers/hooks/useLecturers'
import { PaymentReadinessRow } from '@/features/payments/components/PaymentReadinessRow'
import { usePaymentReadinessSummary } from '@/features/payments/hooks/usePaymentReadinessSummary'

const NO_FILTERS = {}

export function PaymentReadinessList({ showAmount, canApprove, monthKey, filters = NO_FILTERS }) {
  const { rows, loading } = usePaymentReadinessSummary(undefined, monthKey)
  const { data: lecturers } = useLecturers()
  const { data: courses } = useCourses()
  const { data: batches } = useBatches()

  const lecturerById = useMemo(
    () => Object.fromEntries(lecturers.map((l) => [l.id, l])),
    [lecturers]
  )
  const courseById = useMemo(() => Object.fromEntries(courses.map((c) => [c.id, c])), [courses])
  const batchById = useMemo(() => Object.fromEntries(batches.map((b) => [b.id, b])), [batches])

  const visibleRows = useMemo(
    () =>
      rows.filter(({ rule }) => {
        if (filters.lecturerId && rule.lecturerId !== filters.lecturerId) return false
        if (filters.courseId && rule.courseId && rule.courseId !== filters.courseId) return false
        if (filters.batchId && rule.batchId && rule.batchId !== filters.batchId) return false
        return true
      }),
    [rows, filters]
  )

  if (loading) return null

  if (visibleRows.length === 0) {
    return (
      <EmptyState
        title="No payment rules set up"
        description="Add a payment rule to a lecturer to start tracking their monthly payment."
      />
    )
  }

  return (
    <div className="space-y-4">
      {visibleRows.filter((row) => row.kind !== 'paid').map(({ rowKey, rule, monthKey: rowMonth, totalScheduled, completed, completedSchedules, isReady }) => (
        <PaymentReadinessRow
          key={rowKey ?? rule.id}
          rule={rule}
          lecturer={lecturerById[rule.lecturerId]}
          course={rule.courseId ? courseById[rule.courseId] : null}
          batch={rule.batchId ? batchById[rule.batchId] : null}
          monthKey={rowMonth}
          totalScheduled={totalScheduled}
          completed={completed}
          completedSchedules={completedSchedules}
          isReady={isReady}
          showAmount={showAmount}
          canApprove={canApprove}
        />
      ))}
    </div>
  )
}
