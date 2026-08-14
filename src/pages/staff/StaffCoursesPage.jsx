import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'

import { Input } from '@/components/ui/input'
import { DataTable } from '@/components/common/DataTable'
import { PageHeader } from '@/components/common/PageHeader'
import { StatusBadge } from '@/components/common/StatusBadge'
import { useCourses } from '@/features/courses/hooks/useCourses'
import { useLecturers } from '@/features/lecturers/hooks/useLecturers'

export default function StaffCoursesPage() {
  const { data: courses, loading } = useCourses()
  const { data: lecturers } = useLecturers()
  const [search, setSearch] = useState('')
  const lecturerName = (lecturerId) =>
    lecturers.find((lecturer) => lecturer.id === lecturerId)?.fullName

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return courses
    return courses.filter(
      (c) => c.name?.toLowerCase().includes(query) || c.code?.toLowerCase().includes(query)
    )
  }, [courses, search])

  const columns = [
    {
      key: 'name',
      header: 'Course',
      render: (row) => (
        <div>
          <p className="font-medium text-foreground">{row.name}</p>
          {row.code ? <p className="text-xs text-muted-foreground">{row.code}</p> : null}
        </div>
      ),
    },
    { key: 'duration', header: 'Duration', render: (row) => row.duration || '—' },
    {
      key: 'lecturerId',
      header: 'Lecturer',
      render: (row) => lecturerName(row.lecturerId) || '—',
    },
    {
      key: 'active',
      header: 'Status',
      render: (row) => (
        <StatusBadge tone={row.active === false ? 'muted' : 'success'}>
          {row.active === false ? 'Inactive' : 'Active'}
        </StatusBadge>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader title="Courses" description="The academy's course catalog." />

      <div className="relative max-w-xs">
        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by name or code..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <DataTable columns={columns} data={filtered} loading={loading} emptyTitle="No courses yet" />
    </div>
  )
}
