import { useMemo } from 'react'

import { EmptyState } from '@/components/common/EmptyState'
import { PAYMENT_CYCLE_STATUS } from '@/constants/statuses'
import { useBatches } from '@/features/batches/hooks/useBatches'
import { useCourses } from '@/features/courses/hooks/useCourses'
import { useLecturers } from '@/features/lecturers/hooks/useLecturers'
import { usePayments } from '@/features/payments/hooks/usePayments'
import { PaymentHistoryRow } from '@/features/payments/components/PaymentHistoryRow'
import { toDate } from '@/utils/formatters'

const NO_FILTERS = {}

/** Approved + Paid payment records — the persisted half of the payment lifecycle. */
export function PaymentHistoryList({ showAmount, canManage, filters = NO_FILTERS }) {
  const { data: payments, loading } = usePayments()
  const { data: lecturers } = useLecturers()
  const { data: courses } = useCourses()
  const { data: batches } = useBatches()

  const lecturerById = useMemo(
    () => Object.fromEntries(lecturers.map((l) => [l.id, l])),
    [lecturers]
  )
  const courseById = useMemo(() => Object.fromEntries(courses.map((c) => [c.id, c])), [courses])
  const batchById = useMemo(() => Object.fromEntries(batches.map((b) => [b.id, b])), [batches])

  const visible = useMemo(
    () =>
      payments.filter((p) => {
        if (![PAYMENT_CYCLE_STATUS.APPROVED, PAYMENT_CYCLE_STATUS.PAID].includes(p.status)) return false
        if (filters.lecturerId && p.lecturerId !== filters.lecturerId) return false
        if (filters.courseId && p.courseId !== filters.courseId) return false
        if (filters.batchId && p.batchId !== filters.batchId) return false
        if (filters.status && p.status !== filters.status) return false

        const eventDate = toDate(p.paidAt ?? p.approvedAt ?? p.createdAt)
        if (filters.dateFrom && eventDate && eventDate < new Date(filters.dateFrom)) return false
        if (filters.dateTo && eventDate && eventDate > new Date(`${filters.dateTo}T23:59:59`)) return false

        return true
      }),
    [payments, filters]
  )

  if (loading) return null

  if (visible.length === 0) {
    return (
      <EmptyState
        title="No payments yet"
        description="Approved and paid payments will show up here."
      />
    )
  }

  return (
    <div className="space-y-4">
      {visible.map((payment) => (
        <PaymentHistoryRow
          key={payment.id}
          payment={payment}
          lecturer={lecturerById[payment.lecturerId]}
          course={payment.courseId ? courseById[payment.courseId] : null}
          batch={payment.batchId ? batchById[payment.batchId] : null}
          showAmount={showAmount}
          canManage={canManage}
        />
      ))}
    </div>
  )
}
