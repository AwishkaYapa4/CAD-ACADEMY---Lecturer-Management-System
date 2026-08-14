import { useState } from 'react'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FilterBar } from '@/components/common/FilterBar'
import { PageHeader } from '@/components/common/PageHeader'
import { PAYMENT_CYCLE_STATUS, STATUS_LABELS } from '@/constants/statuses'
import { useBatches } from '@/features/batches/hooks/useBatches'
import { useCourses } from '@/features/courses/hooks/useCourses'
import { useLecturers } from '@/features/lecturers/hooks/useLecturers'
import { PaymentHistoryList } from '@/features/payments/components/PaymentHistoryList'
import { PaymentReadinessList } from '@/features/payments/components/PaymentReadinessList'
import { monthKeyFor } from '@/features/payments/utils/monthlyCalc'

const EMPTY_FILTERS = { lecturerId: '', courseId: '', batchId: '', status: '', dateFrom: '', dateTo: '' }

export default function PaymentReadinessPage() {
  const { data: lecturers } = useLecturers()
  const { data: courses } = useCourses()
  const { data: batches } = useBatches()
  const [filters, setFilters] = useState(EMPTY_FILTERS)
  const [monthKey, setMonthKey] = useState(monthKeyFor())

  const setFilter = (key, value) => setFilters((prev) => ({ ...prev, [key]: value }))
  const filtersActive = Object.values(filters).some(Boolean)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payment Readiness"
        description="Each lecturer's monthly payment, prorated by scheduled vs. completed classes."
        actions={
          <div className="space-y-1.5">
            <Label htmlFor="readiness-month" className="text-xs text-muted-foreground">
              Month
            </Label>
            <Input
              id="readiness-month"
              type="month"
              className="w-40"
              value={monthKey}
              onChange={(e) => setMonthKey(e.target.value || monthKeyFor())}
            />
          </div>
        }
      />

      <FilterBar
        filters={[
          {
            key: 'lecturerId',
            label: 'Lecturers',
            options: lecturers.map((l) => ({ value: l.id, label: l.fullName })),
          },
          {
            key: 'courseId',
            label: 'Courses',
            options: courses.map((c) => ({ value: c.id, label: c.name })),
          },
          {
            key: 'batchId',
            label: 'Batches',
            options: batches.map((b) => ({ value: b.id, label: b.batchCode })),
          },
          {
            key: 'status',
            label: 'Statuses',
            options: [PAYMENT_CYCLE_STATUS.APPROVED, PAYMENT_CYCLE_STATUS.PAID].map((value) => ({
              value,
              label: STATUS_LABELS[value] ?? value,
            })),
          },
        ]}
        values={filters}
        onChange={setFilter}
        dateRange={{
          from: filters.dateFrom,
          to: filters.dateTo,
          onFromChange: (value) => setFilter('dateFrom', value),
          onToChange: (value) => setFilter('dateTo', value),
        }}
        active={filtersActive}
        onClear={() => setFilters(EMPTY_FILTERS)}
      />

      <PaymentReadinessList showAmount canApprove monthKey={monthKey} filters={filters} />

      <div className="space-y-4">
        <h2 className="text-sm font-medium text-muted-foreground">Payment history</h2>
        <PaymentHistoryList showAmount canManage filters={filters} />
      </div>
    </div>
  )
}
