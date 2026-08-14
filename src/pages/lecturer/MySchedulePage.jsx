import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { Plus, Trash2, Video } from 'lucide-react'
import toast from 'react-hot-toast'

import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { DataTable } from '@/components/common/DataTable'
import { PageHeader } from '@/components/common/PageHeader'
import { StatusPill } from '@/components/common/StatusPill'
import { ROUTES } from '@/constants/routes'
import { SCHEDULE_STATUS } from '@/constants/statuses'
import { useBatches } from '@/features/batches/hooks/useBatches'
import { useCourses } from '@/features/courses/hooks/useCourses'
import { ScheduleFormDialog } from '@/features/schedules/components/ScheduleFormDialog'
import { useDeleteSchedule, useLecturerSchedules } from '@/features/schedules/hooks/useSchedules'
import { useAuth } from '@/hooks/useAuth'
import { toDate } from '@/utils/formatters'

export default function MySchedulePage() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const { data: schedules, loading, refetch } = useLecturerSchedules(profile?.lecturerId)
  const { data: courses } = useCourses()
  const { data: batches } = useBatches()
  const [formOpen, setFormOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const deleteSchedule = useDeleteSchedule()

  const courseById = useMemo(() => Object.fromEntries(courses.map((c) => [c.id, c])), [courses])
  const batchById = useMemo(() => Object.fromEntries(batches.map((b) => [b.id, b])), [batches])

  // Once a class is completed it belongs on "My Class History", not here —
  // "My Classes" is only ever active/upcoming work.
  const activeSchedules = useMemo(
    () => schedules.filter((s) => s.status !== SCHEDULE_STATUS.COMPLETED),
    [schedules]
  )

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return
    try {
      await deleteSchedule.mutateAsync({ scheduleId: deleteTarget.id, lecturerId: deleteTarget.lecturerId })
      toast.success('Class deleted')
      setDeleteTarget(null)
      refetch()
    } catch (error) {
      toast.error(error.message || 'Failed to delete class. Please try again.')
    }
  }

  const columns = [
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
        <div className="flex items-center justify-end gap-2">
          {row.status === SCHEDULE_STATUS.SCHEDULED || row.status === SCHEDULE_STATUS.DRAFT_REPORT ? (
            <Button
              size="sm"
              onClick={() =>
                navigate(ROUTES.LECTURER_SUBMIT_REPORT.replace(':scheduleId', row.id))
              }
            >
              {row.status === SCHEDULE_STATUS.DRAFT_REPORT ? 'Continue Draft' : 'Complete Class'}
            </Button>
          ) : null}
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Delete class"
            onClick={() => setDeleteTarget(row)}
          >
            <Trash2 className="size-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Classes"
        description="Your active and upcoming classes."
        actions={
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="size-4" /> Add Class
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={activeSchedules}
        loading={loading}
        emptyTitle="No classes scheduled"
        emptyDescription="Add your first class, or wait for the office to assign one."
      />

      <ScheduleFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        schedule={null}
        lecturerId={profile?.lecturerId}
        onSuccess={refetch}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete this class?"
        description={
          deleteTarget?.status === SCHEDULE_STATUS.COMPLETED ||
          deleteTarget?.status === SCHEDULE_STATUS.DRAFT_REPORT
            ? "This permanently removes the class along with its report and any uploaded materials. This can't be undone."
            : "This permanently removes the class. This can't be undone."
        }
        confirmLabel="Delete class"
        destructive
        loading={deleteSchedule.isPending}
        onConfirm={handleConfirmDelete}
      />
    </div>
  )
}
