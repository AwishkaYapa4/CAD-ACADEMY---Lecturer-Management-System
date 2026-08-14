import { useMemo, useState } from 'react'
import { MoreHorizontal, Plus, Search } from 'lucide-react'
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
import { PageHeader } from '@/components/common/PageHeader'
import { StatusBadge } from '@/components/common/StatusBadge'
import { CourseFormDialog } from '@/features/courses/components/CourseFormDialog'
import { useCourses, useSetCourseActive } from '@/features/courses/hooks/useCourses'
import { useLecturers } from '@/features/lecturers/hooks/useLecturers'

export default function CoursesListPage() {
  const { data: courses, loading } = useCourses()
  const { data: lecturers } = useLecturers()
  const setCourseActive = useSetCourseActive()
  const lecturerName = (lecturerId) =>
    lecturers.find((lecturer) => lecturer.id === lecturerId)?.fullName

  const [search, setSearch] = useState('')
  const [formState, setFormState] = useState({ open: false, course: null })
  const [activeTarget, setActiveTarget] = useState(null)

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return courses
    return courses.filter(
      (course) =>
        course.name?.toLowerCase().includes(query) || course.code?.toLowerCase().includes(query)
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
    {
      key: 'duration',
      header: 'Duration',
      render: (row) => row.duration || <span className="text-muted-foreground">—</span>,
    },
    {
      key: 'lecturerId',
      header: 'Lecturer',
      render: (row) =>
        lecturerName(row.lecturerId) || <span className="text-muted-foreground">Unassigned</span>,
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
            <DropdownMenuItem onClick={() => setFormState({ open: true, course: row })}>
              Edit
            </DropdownMenuItem>
            {row.active === false ? (
              <DropdownMenuItem onClick={() => setActiveTarget(row)}>Activate</DropdownMenuItem>
            ) : (
              <DropdownMenuItem variant="destructive" onClick={() => setActiveTarget(row)}>
                Deactivate
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]

  const handleConfirmActiveChange = async () => {
    if (!activeTarget) return
    const nextActive = activeTarget.active === false

    try {
      await setCourseActive.mutateAsync({ courseId: activeTarget.id, active: nextActive })
      toast.success(nextActive ? 'Course activated' : 'Course deactivated')
      setActiveTarget(null)
    } catch {
      toast.error('Failed to update course')
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Courses"
        description="Manage the academy's course catalog."
        actions={
          <Button onClick={() => setFormState({ open: true, course: null })}>
            <Plus className="size-4" /> Add Course
          </Button>
        }
      />

      <div className="relative max-w-xs">
        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by name or code..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        loading={loading}
        emptyTitle="No courses yet"
        emptyDescription="Add your first course to start creating batches."
      />

      <CourseFormDialog
        key={formState.course?.id ?? 'create'}
        open={formState.open}
        onOpenChange={(open) => setFormState({ open, course: open ? formState.course : null })}
        course={formState.course}
      />

      <ConfirmDialog
        open={Boolean(activeTarget)}
        onOpenChange={(open) => !open && setActiveTarget(null)}
        title={activeTarget?.active === false ? 'Activate course?' : 'Deactivate course?'}
        description={
          activeTarget?.active === false
            ? `${activeTarget?.name} will be available for new batches again.`
            : `${activeTarget?.name} will no longer be available for new batches.`
        }
        confirmLabel={activeTarget?.active === false ? 'Activate' : 'Deactivate'}
        destructive={activeTarget?.active !== false}
        loading={setCourseActive.isPending}
        onConfirm={handleConfirmActiveChange}
      />
    </div>
  )
}
