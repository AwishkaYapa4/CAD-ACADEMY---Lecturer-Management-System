import { useMemo, useState } from 'react'
import { MoreHorizontal, Plus, Search, Video } from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { DataTable } from '@/components/common/DataTable'
import { FilterBar } from '@/components/common/FilterBar'
import { PageHeader } from '@/components/common/PageHeader'
import { StatusPill } from '@/components/common/StatusPill'
import { SCHEDULE_STATUS, STATUS_LABELS } from '@/constants/statuses'
import { useBatches } from '@/features/batches/hooks/useBatches'
import { useCourses } from '@/features/courses/hooks/useCourses'
import { useLecturers } from '@/features/lecturers/hooks/useLecturers'
import { ScheduleFormDialog } from '@/features/schedules/components/ScheduleFormDialog'
import { useCancelSchedule, useSchedules } from '@/features/schedules/hooks/useSchedules'
import { toDate } from '@/utils/formatters'

const EMPTY_FILTERS = { lecturerId: '', courseId: '', batchId: '', status: '', dateFrom: '', dateTo: '' }

export default function SchedulesListPage() {
  const { data: schedules, loading, refetch } = useSchedules()
  const { data: batches } = useBatches()
  const { data: courses } = useCourses()
  const { data: lecturers } = useLecturers()
  const cancelSchedule = useCancelSchedule()

  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState(EMPTY_FILTERS)
  const [formState, setFormState] = useState({ open: false, schedule: null })
  const [cancelTarget, setCancelTarget] = useState(null)

  const batchById = useMemo(() => Object.fromEntries(batches.map((b) => [b.id, b])), [batches])
  const courseById = useMemo(() => Object.fromEntries(courses.map((c) => [c.id, c])), [courses])
  const lecturerById = useMemo(
    () => Object.fromEntries(lecturers.map((l) => [l.id, l])),
    [lecturers]
  )

  const setFilter = (key, value) => setFilters((prev) => ({ ...prev, [key]: value }))
  const filtersActive = Object.values(filters).some(Boolean)

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    return schedules.filter((schedule) => {
      if (filters.lecturerId && schedule.lecturerId !== filters.lecturerId) return false
      if (filters.courseId && schedule.courseId !== filters.courseId) return false
      if (filters.batchId && schedule.batchId !== filters.batchId) return false
      if (filters.status && schedule.status !== filters.status) return false

      const classDate = toDate(schedule.classDate)
      if (filters.dateFrom && classDate && classDate < new Date(filters.dateFrom)) return false
      if (filters.dateTo && classDate && classDate > new Date(`${filters.dateTo}T23:59:59`)) return false

      if (!query) return true
      const course = courseById[schedule.courseId]
      const lecturer = lecturerById[schedule.lecturerId]
      const batch = batchById[schedule.batchId]
      return (
        course?.name?.toLowerCase().includes(query) ||
        lecturer?.fullName?.toLowerCase().includes(query) ||
        batch?.batchCode?.toLowerCase().includes(query)
      )
    })
  }, [schedules, search, filters, courseById, lecturerById, batchById])

  const columns = [
    {
      key: 'class',
      header: 'Class',
      render: (row) => (
        <div>
          <p className="font-medium text-foreground">
            {courseById[row.courseId]?.name ?? 'Unknown course'}
          </p>
          <p className="text-xs text-muted-foreground">
            {batchById[row.batchId]?.batchCode ?? '—'} · {lecturerById[row.lecturerId]?.fullName ?? '—'}
          </p>
        </div>
      ),
    },
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
    {
      key: 'location',
      header: 'Location',
      render: (row) =>
        row.locationType === 'online' ? (
          <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
            <Video className="size-3.5" /> Online
          </span>
        ) : (
          <span className="text-sm text-muted-foreground">{row.location || 'Physical'}</span>
        ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StatusPill status={row.status} />,
    },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (row) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm">
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {row.status === SCHEDULE_STATUS.SCHEDULED ? (
              <>
                <DropdownMenuItem onClick={() => setFormState({ open: true, schedule: row })}>
                  Edit / Reschedule
                </DropdownMenuItem>
                <DropdownMenuItem variant="destructive" onClick={() => setCancelTarget(row)}>
                  Cancel
                </DropdownMenuItem>
              </>
            ) : (
              <DropdownMenuItem disabled>No actions available</DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]

  const handleConfirmCancel = async () => {
    if (!cancelTarget) return
    try {
      await cancelSchedule.mutateAsync(cancelTarget.id)
      toast.success('Class cancelled')
      setCancelTarget(null)
    } catch {
      toast.error('Failed to cancel class')
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Class Schedules"
        description="Schedule and manage upcoming classes."
        actions={
          <Button onClick={() => setFormState({ open: true, schedule: null })}>
            <Plus className="size-4" /> Schedule Class
          </Button>
        }
      />

      <div className="space-y-3">
        <div className="relative max-w-xs">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by course, batch, lecturer..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
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
              options: Object.values(SCHEDULE_STATUS).map((value) => ({
                value,
                label: STATUS_LABELS[value] ?? value.replace(/_/g, ' '),
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
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        loading={loading}
        emptyTitle="No classes scheduled"
        emptyDescription="Schedule your first class once you have a batch set up."
      />

      <ScheduleFormDialog
        key={formState.schedule?.id ?? 'create'}
        open={formState.open}
        onOpenChange={(open) => setFormState({ open, schedule: open ? formState.schedule : null })}
        schedule={formState.schedule}
        onSuccess={refetch}
      />

      <ConfirmDialog
        open={Boolean(cancelTarget)}
        onOpenChange={(open) => !open && setCancelTarget(null)}
        title="Cancel this class?"
        description="The lecturer will no longer be able to submit a report for this class."
        confirmLabel="Cancel class"
        destructive
        loading={cancelSchedule.isPending}
        onConfirm={handleConfirmCancel}
      />
    </div>
  )
}
