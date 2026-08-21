import { useMemo, useState } from 'react'
import { format } from 'date-fns'
import { AlertTriangle, Circle, Search } from 'lucide-react'

import { Input } from '@/components/ui/input'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { DataTable } from '@/components/common/DataTable'
import { EmptyState } from '@/components/common/EmptyState'
import { FilterBar } from '@/components/common/FilterBar'
import { PageHeader } from '@/components/common/PageHeader'
import { StatusPill } from '@/components/common/StatusPill'
import { REPORT_STATUS } from '@/constants/statuses'
import { useBatches } from '@/features/batches/hooks/useBatches'
import { useClassReports } from '@/features/classReports/hooks/useClassReports'
import { useCourses } from '@/features/courses/hooks/useCourses'
import { useLecturers } from '@/features/lecturers/hooks/useLecturers'
import { LectureMaterialsList } from '@/features/materials/components/LectureMaterialsList'
import { useCourseMaterials } from '@/features/materials/hooks/useLectureMaterials'
import { monthKeyFor } from '@/features/payments/utils/monthlyCalc'
import { paymentsCollection } from '@/features/payments/services/paymentService'
import { useSchedules } from '@/features/schedules/hooks/useSchedules'
import { useFirestoreDoc } from '@/hooks/useFirestoreDoc'
import { toDate } from '@/utils/formatters'

/**
 * There's no real activity/audit-log collection in this system — just
 * point-in-time fields on a few docs. This synthesizes a best-effort
 * timeline from whichever of those are actually set, rather than tracking
 * "action history" as its own feature. Order is chronological, not
 * insertion order, since e.g. a payment can be approved well after the
 * report itself was last edited.
 */
function buildTimeline({ schedule, report, payment, materials }) {
  const events = []
  const add = (label, value) => {
    const date = toDate(value)
    if (date) events.push({ label, date })
  }

  add('Class scheduled', schedule?.createdAt)
  add('Report draft started', report?.createdAt)
  materials.forEach((material) => add(`Material uploaded — ${material.title ?? material.originalFilename}`, material.uploadedAt))
  add('Report submitted — class completed', report?.submittedAt)
  add('Payment approved', payment?.approvedAt)
  add('Payment marked paid', payment?.paidAt)

  return events.sort((a, b) => a.date - b.date)
}

const EMPTY_FILTERS = { lecturerId: '', courseId: '', batchId: '', status: '' }

function ReportDetailSheet({ report, lecturer, batch, schedule, open, onOpenChange }) {
  const { data: courseMaterials, loading: materialsLoading } = useCourseMaterials(report?.courseId)
  const { data: payment } = useFirestoreDoc(paymentsCollection.subscribeToDoc, report?.paymentId)
  const materials = useMemo(
    () => courseMaterials.filter((material) => material.scheduleId === report?.id),
    [courseMaterials, report?.id]
  )

  const scheduledDate = toDate(schedule?.classDate)
  const completedDate = toDate(schedule?.completedAt)
  const submittedDate = toDate(report?.submittedAt)
  const updatedDate = toDate(report?.updatedAt)
  const timeline = useMemo(
    () => buildTimeline({ schedule, report, payment, materials }),
    [schedule, report, payment, materials]
  )

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{report?.topicCovered ?? 'Class report'}</SheetTitle>
          <SheetDescription>
            {batch?.batchCode ? `Batch ${batch.batchCode} · ` : ''}Submitted class report — read-only.
          </SheetDescription>
        </SheetHeader>
        {report ? (
          <div className="space-y-4 px-4 pb-4 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Submitted by" value={lecturer?.fullName} />
              <Field label="Class status" value={schedule ? <StatusPill status={schedule.status} /> : '—'} />
              <Field label="Report status" value={<StatusPill status={report.status} />} />
              <Field label="Materials" value={report.materialCount || 0} />
              <Field label="Scheduled" value={scheduledDate ? format(scheduledDate, 'MMM d, yyyy') : '—'} />
              <Field label="Completed" value={completedDate ? format(completedDate, 'MMM d, yyyy') : '—'} />
              <Field
                label="Submitted at"
                value={submittedDate ? format(submittedDate, 'MMM d, yyyy p') : '—'}
              />
              <Field
                label="Last updated"
                value={updatedDate ? format(updatedDate, 'MMM d, yyyy p') : '—'}
              />
            </div>
            <Field label="Description" value={report.description} />
            <Field label="Activities completed" value={report.activitiesCompleted} />
            <Field label="Homework" value={report.homework} />
            <Field label="Remarks" value={report.remarks} />
            <Field label="Actual time" value={`${report.actualStartTime ?? '—'}–${report.actualEndTime ?? '—'}`} />
            {materials.length > 0 ? (
              <div className="space-y-2 border-t border-border pt-4">
                <p className="text-xs font-medium text-muted-foreground uppercase">Materials</p>
                <LectureMaterialsList materials={materials} loading={materialsLoading} />
              </div>
            ) : (
              <p className="border-t border-border pt-4 text-xs text-muted-foreground">
                No materials were uploaded for this class.
              </p>
            )}
            {timeline.length > 0 ? (
              <div className="space-y-3 border-t border-border pt-4">
                <p className="text-xs font-medium text-muted-foreground uppercase">History</p>
                <ul className="space-y-3">
                  {timeline.map((event, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Circle className="mt-1 size-2 shrink-0 fill-muted-foreground text-muted-foreground" />
                      <div>
                        <p className="text-foreground">{event.label}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(event.date, 'MMM d, yyyy p')}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}

function Field({ label, value }) {
  if (value === undefined || value === null || value === '') return null
  return (
    <div>
      <p className="mb-1 text-xs font-medium text-muted-foreground uppercase">{label}</p>
      <p className="text-foreground">{value}</p>
    </div>
  )
}

export default function ClassReportsPage() {
  const { data: reports, loading, error } = useClassReports()
  const { data: courses } = useCourses()
  const { data: batches } = useBatches()
  const { data: lecturers } = useLecturers()
  const { data: schedules } = useSchedules()
  const [search, setSearch] = useState('')
  const [selectedMonth, setSelectedMonth] = useState(monthKeyFor())
  const [selected, setSelected] = useState(null)
  const [filters, setFilters] = useState(EMPTY_FILTERS)

  const courseById = useMemo(() => Object.fromEntries(courses.map((c) => [c.id, c])), [courses])
  const batchById = useMemo(() => Object.fromEntries(batches.map((b) => [b.id, b])), [batches])
  const lecturerById = useMemo(
    () => Object.fromEntries(lecturers.map((l) => [l.id, l])),
    [lecturers]
  )
  // Report doc id === scheduleId, so this maps a report straight to its schedule.
  const scheduleById = useMemo(() => Object.fromEntries(schedules.map((s) => [s.id, s])), [schedules])

  const setFilter = (key, value) => setFilters((prev) => ({ ...prev, [key]: value }))
  const filtersActive = Object.values(filters).some(Boolean)

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    return reports.filter((report) => {
      if (filters.lecturerId && report.lecturerId !== filters.lecturerId) return false
      if (filters.courseId && report.courseId !== filters.courseId) return false
      if (filters.batchId && report.batchId !== filters.batchId) return false
      if (filters.status && report.status !== filters.status) return false

      const reportMonthDate = toDate(scheduleById[report.id]?.classDate ?? report.submittedAt ?? report.createdAt)
      if (selectedMonth && (!reportMonthDate || monthKeyFor(reportMonthDate) !== selectedMonth)) return false

      if (!query) return true
      const lecturer = lecturerById[report.lecturerId]
      const course = courseById[report.courseId]
      return (
        report.topicCovered?.toLowerCase().includes(query) ||
        lecturer?.fullName?.toLowerCase().includes(query) ||
        course?.name?.toLowerCase().includes(query)
      )
    })
  }, [reports, search, selectedMonth, filters, lecturerById, courseById, scheduleById])

  const columns = [
    {
      key: 'lecturer',
      header: 'Lecturer',
      render: (row) => lecturerById[row.lecturerId]?.fullName ?? '—',
    },
    {
      key: 'class',
      header: 'Class',
      render: (row) => (
        <div>
          <p className="font-medium text-foreground">{courseById[row.courseId]?.name ?? '—'}</p>
          <p className="text-xs text-muted-foreground">{batchById[row.batchId]?.batchCode ?? '—'}</p>
        </div>
      ),
    },
    { key: 'topicCovered', header: 'Topic', render: (row) => row.topicCovered || '—' },
    {
      key: 'classStatus',
      header: 'Class status',
      render: (row) => {
        const schedule = scheduleById[row.id]
        return schedule ? <StatusPill status={schedule.status} /> : '—'
      },
    },
    {
      key: 'scheduled',
      header: 'Scheduled',
      render: (row) => {
        const date = toDate(scheduleById[row.id]?.classDate)
        return date ? format(date, 'MMM d, yyyy') : '—'
      },
    },
    {
      key: 'completed',
      header: 'Completed',
      render: (row) => {
        const date = toDate(scheduleById[row.id]?.completedAt)
        return date ? format(date, 'MMM d, yyyy') : '—'
      },
    },
    {
      key: 'materialCount',
      header: 'Materials',
      render: (row) => row.materialCount || 0,
    },
    { key: 'status', header: 'Report status', render: (row) => <StatusPill status={row.status} /> },
    {
      key: 'submittedAt',
      header: 'Submitted',
      render: (row) => {
        const date = toDate(row.submittedAt)
        return date ? format(date, 'MMM d, yyyy p') : '—'
      },
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader title="Class Reports" description="All lecturer-submitted class reports." />

      <div className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative max-w-xs">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by lecturer, course, topic..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="w-full sm:w-44"
          />
        </div>
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
              options: Object.values(REPORT_STATUS).map((value) => ({
                value,
                label: value.replace(/_/g, ' '),
              })),
            },
          ]}
          values={filters}
          onChange={setFilter}
          active={filtersActive}
          onClear={() => setFilters(EMPTY_FILTERS)}
        />
      </div>

      {error ? (
        <EmptyState
          icon={AlertTriangle}
          title="Couldn't load class reports"
          description="Something went wrong talking to the server. Please refresh and try again."
        />
      ) : (
        <DataTable
          columns={columns}
          data={filtered}
          loading={loading}
          onRowClick={(row) => setSelected(row)}
          emptyTitle="No class reports yet"
          emptyDescription="Reports lecturers submit will appear here."
        />
      )}

      <ReportDetailSheet
        report={selected}
        lecturer={selected ? lecturerById[selected.lecturerId] : null}
        batch={selected ? batchById[selected.batchId] : null}
        schedule={selected ? scheduleById[selected.id] : null}
        open={Boolean(selected)}
        onOpenChange={(open) => !open && setSelected(null)}
      />
    </div>
  )
}
