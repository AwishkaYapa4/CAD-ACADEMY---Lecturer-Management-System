import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MoreHorizontal, Plus, Search } from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { DataTable } from '@/components/common/DataTable'
import { PageHeader } from '@/components/common/PageHeader'
import { StatusPill } from '@/components/common/StatusPill'
import { ROUTES } from '@/constants/routes'
import { useBatches, useDeleteBatch, useSetBatchActive } from '@/features/batches/hooks/useBatches'
import { deriveBatchStatus } from '@/features/batches/services/batchService'
import { BatchFormDialog } from '@/features/batches/components/BatchFormDialog'
import { useCourses } from '@/features/courses/hooks/useCourses'
import { useLecturers } from '@/features/lecturers/hooks/useLecturers'
import { toDate } from '@/utils/formatters'

export default function BatchesListPage() {
  const navigate = useNavigate()
  const { data: batches, loading } = useBatches()
  const { data: courses } = useCourses()
  const { data: lecturers } = useLecturers()
  const setBatchActive = useSetBatchActive()
  const deleteBatch = useDeleteBatch()

  const [search, setSearch] = useState('')
  const [formState, setFormState] = useState({ open: false, batch: null })
  const [activeTarget, setActiveTarget] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

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
          <p className="text-xs text-muted-foreground">
            {courseById[row.courseId]?.name ?? 'Unknown course'}
          </p>
        </div>
      ),
    },
    {
      key: 'lecturer',
      header: 'Lecturer',
      render: (row) => lecturerById[row.lecturerId]?.fullName ?? '—',
    },
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
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StatusPill status={deriveBatchStatus(row)} />,
    },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (row) => (
        <div onClick={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm">
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setFormState({ open: true, batch: row })}>
                Edit
              </DropdownMenuItem>
              {row.active === false ? (
                <DropdownMenuItem onClick={() => setActiveTarget(row)}>Activate</DropdownMenuItem>
              ) : (
                <DropdownMenuItem variant="destructive" onClick={() => setActiveTarget(row)}>
                  Deactivate
                </DropdownMenuItem>
              )}
              <DropdownMenuItem variant="destructive" onClick={() => setDeleteTarget(row)}>
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ]

  const handleConfirmActiveChange = async () => {
    if (!activeTarget) return
    const nextActive = activeTarget.active === false

    try {
      await setBatchActive.mutateAsync({ batchId: activeTarget.id, active: nextActive })
      toast.success(nextActive ? 'Batch activated' : 'Batch deactivated')
      setActiveTarget(null)
    } catch {
      toast.error('Failed to update batch')
    }
  }

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return
    try {
      await deleteBatch.mutateAsync(deleteTarget.id)
      toast.success('Batch deleted')
      setDeleteTarget(null)
    } catch (error) {
      toast.error(error.message || 'Failed to delete batch')
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Batches"
        description="Manage batches and lecturer assignments."
        actions={
          <Button onClick={() => setFormState({ open: true, batch: null })}>
            <Plus className="size-4" /> Add Batch
          </Button>
        }
      />

      <div className="relative max-w-xs">
        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by batch, course, lecturer..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        loading={loading}
        onRowClick={(row) => navigate(ROUTES.ADMIN_BATCH_DETAIL.replace(':batchId', row.id))}
        emptyTitle="No batches yet"
        emptyDescription="Add your first batch and assign a lecturer to it."
      />

      <BatchFormDialog
        key={formState.batch?.id ?? 'create'}
        open={formState.open}
        onOpenChange={(open) => setFormState({ open, batch: open ? formState.batch : null })}
        batch={formState.batch}
      />

      <ConfirmDialog
        open={Boolean(activeTarget)}
        onOpenChange={(open) => !open && setActiveTarget(null)}
        title={activeTarget?.active === false ? 'Activate batch?' : 'Deactivate batch?'}
        description={
          activeTarget?.active === false
            ? `${activeTarget?.batchCode} will be active again.`
            : `${activeTarget?.batchCode} will be marked inactive.`
        }
        confirmLabel={activeTarget?.active === false ? 'Activate' : 'Deactivate'}
        destructive={activeTarget?.active !== false}
        loading={setBatchActive.isPending}
        onConfirm={handleConfirmActiveChange}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete this batch?"
        description={
          deleteTarget
            ? `"${deleteTarget.batchCode}" will be permanently deleted. Class schedules, reports, and payment rules already linked to it are not removed automatically — only delete a batch with no recorded activity.`
            : undefined
        }
        confirmLabel="Delete"
        destructive
        loading={deleteBatch.isPending}
        onConfirm={handleConfirmDelete}
      />
    </div>
  )
}
