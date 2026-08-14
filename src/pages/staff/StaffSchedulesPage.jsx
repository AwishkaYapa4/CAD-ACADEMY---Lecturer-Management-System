import { useMemo, useState } from 'react'
import { format } from 'date-fns'
import { Search, Video } from 'lucide-react'

import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DataTable } from '@/components/common/DataTable'
import { PageHeader } from '@/components/common/PageHeader'
import { StatusPill } from '@/components/common/StatusPill'
import { SCHEDULE_STATUS } from '@/constants/statuses'
import { useBatches } from '@/features/batches/hooks/useBatches'
import { useCourses } from '@/features/courses/hooks/useCourses'
import { useLecturers } from '@/features/lecturers/hooks/useLecturers'
import { useSchedules } from '@/features/schedules/hooks/useSchedules'
import { toDate } from '@/utils/formatters'

export default function StaffSchedulesPage() {
  const { data: schedules, loading } = useSchedules()
  const { data: batches } = useBatches()
  const { data: courses } = useCourses()
  const { data: lecturers } = useLecturers()

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const batchById = useMemo(() => Object.fromEntries(batches.map((b) => [b.id, b])), [batches])
  const courseById = useMemo(() => Object.fromEntries(courses.map((c) => [c.id, c])), [courses])
  const lecturerById = useMemo(
    () => Object.fromEntries(lecturers.map((l) => [l.id, l])),
    [lecturers]
  )

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    return schedules.filter((schedule) => {
      const matchesStatus = statusFilter === 'all' || schedule.status === statusFilter
      if (!matchesStatus) return false
      if (!query) return true
      return (
        courseById[schedule.courseId]?.name?.toLowerCase().includes(query) ||
        lecturerById[schedule.lecturerId]?.fullName?.toLowerCase().includes(query) ||
        batchById[schedule.batchId]?.batchCode?.toLowerCase().includes(query)
      )
    })
  }, [schedules, search, statusFilter, courseById, lecturerById, batchById])

  const columns = [
    {
      key: 'class',
      header: 'Class',
      render: (row) => (
        <div>
          <p className="font-medium text-foreground">{courseById[row.courseId]?.name ?? '—'}</p>
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
    { key: 'status', header: 'Status', render: (row) => <StatusPill status={row.status} /> },
  ]

  return (
    <div className="space-y-6">
      <PageHeader title="Class Schedules" description="All scheduled classes across the academy." />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by course, batch, lecturer..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value={SCHEDULE_STATUS.SCHEDULED}>Scheduled</SelectItem>
            <SelectItem value={SCHEDULE_STATUS.DRAFT_REPORT}>Draft report</SelectItem>
            <SelectItem value={SCHEDULE_STATUS.COMPLETED}>Completed</SelectItem>
            <SelectItem value={SCHEDULE_STATUS.CANCELLED}>Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataTable columns={columns} data={filtered} loading={loading} emptyTitle="No classes scheduled" />
    </div>
  )
}
