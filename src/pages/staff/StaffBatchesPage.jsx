import { useMemo, useState } from 'react'
import { format } from 'date-fns'
import { Search } from 'lucide-react'

import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { DataTable } from '@/components/common/DataTable'
import { PageHeader } from '@/components/common/PageHeader'
import { StatusPill } from '@/components/common/StatusPill'
import { useBatches } from '@/features/batches/hooks/useBatches'
import { deriveBatchStatus } from '@/features/batches/services/batchService'
import { useCourses } from '@/features/courses/hooks/useCourses'
import { useLecturers } from '@/features/lecturers/hooks/useLecturers'
import { toDate } from '@/utils/formatters'

export default function StaffBatchesPage() {
  const { data: batches, loading } = useBatches()
  const { data: courses } = useCourses()
  const { data: lecturers } = useLecturers()
  const [search, setSearch] = useState('')

  const courseById = useMemo(() => Object.fromEntries(courses.map((c) => [c.id, c])), [courses])
  const lecturerById = useMemo(
    () => Object.fromEntries(lecturers.map((l) => [l.id, l])),
    [lecturers]
  )

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return batches
    return batches.filter((batch) => {
      const course = courseById[batch.courseId]
      const lecturer = lecturerById[batch.lecturerId]
      return (
        batch.batchCode?.toLowerCase().includes(query) ||
        course?.name?.toLowerCase().includes(query) ||
        lecturer?.fullName?.toLowerCase().includes(query)
      )
    })
  }, [batches, search, courseById, lecturerById])

  const columns = [
    {
      key: 'batch',
      header: 'Batch',
      render: (row) => (
        <div>
          <p className="font-medium text-foreground">{row.batchCode}</p>
          <p className="text-xs text-muted-foreground">{courseById[row.courseId]?.name ?? '—'}</p>
        </div>
      ),
    },
    { key: 'lecturer', header: 'Lecturer', render: (row) => lecturerById[row.lecturerId]?.fullName ?? '—' },
    {
      key: 'dates',
      header: 'Dates',
      render: (row) => {
        const start = toDate(row.startDate)
        const end = toDate(row.endDate)
        return (
          <span className="text-sm text-muted-foreground">
            {start ? format(start, 'MMM d, yyyy') : '—'} – {end ? format(end, 'MMM d, yyyy') : '—'}
          </span>
        )
      },
    },
    {
      key: 'progress',
      header: 'Progress',
      render: (row) => {
        const planned = row.plannedClassCount || 0
        const completed = row.completedClassCount || 0
        const percent = planned > 0 ? Math.min(100, Math.round((completed / planned) * 100)) : 0
        return (
          <div className="w-32 space-y-1">
            <Progress value={percent} className="h-1.5" />
            <p className="text-xs text-muted-foreground">
              {completed}/{planned} classes
            </p>
          </div>
        )
      },
    },
    { key: 'status', header: 'Status', render: (row) => <StatusPill status={deriveBatchStatus(row)} /> },
  ]

  return (
    <div className="space-y-6">
      <PageHeader title="Batches" description="All batches across the academy." />

      <div className="relative max-w-xs">
        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by batch, course, lecturer..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <DataTable columns={columns} data={filtered} loading={loading} emptyTitle="No batches yet" />
    </div>
  )
}
