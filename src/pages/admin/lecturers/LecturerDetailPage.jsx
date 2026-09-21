import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { format } from 'date-fns'
import { ArrowLeft, Layers, Mail, Trash2, UserRoundCheck, UserRoundX } from 'lucide-react'
import toast from 'react-hot-toast'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { EmptyState } from '@/components/common/EmptyState'
import { PageHeader } from '@/components/common/PageHeader'
import { StatusPill } from '@/components/common/StatusPill'
import { ROUTES } from '@/constants/routes'
import { LECTURER_STATUS } from '@/constants/statuses'
import { useCourses } from '@/features/courses/hooks/useCourses'
import { deriveBatchStatus } from '@/features/batches/services/batchService'
import { useLecturerBatches } from '@/features/batches/hooks/useBatches'
import { LecturerFormDialog } from '@/features/lecturers/components/LecturerFormDialog'
import {
  useDeleteLecturer,
  useLecturer,
  useSetLecturerStatus,
} from '@/features/lecturers/hooks/useLecturers'
import { useBreadcrumbLabel } from '@/hooks/useBreadcrumbLabel'
import { getInitials, toDate } from '@/utils/formatters'

export default function LecturerDetailPage() {
  const { lecturerId } = useParams()
  const navigate = useNavigate()
  const { data: lecturer, loading } = useLecturer(lecturerId)
  const { data: batches, loading: batchesLoading } = useLecturerBatches(lecturerId)
  const { data: courses } = useCourses()
  const setLecturerStatus = useSetLecturerStatus()
  const deleteLecturer = useDeleteLecturer()

  const courseById = useMemo(() => Object.fromEntries(courses.map((c) => [c.id, c])), [courses])

  const [editOpen, setEditOpen] = useState(false)
  const [confirmStatusOpen, setConfirmStatusOpen] = useState(false)
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)

  useBreadcrumbLabel(lecturerId, lecturer?.fullName)

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
      </div>
    )
  }

  if (!lecturer) {
    return (
      <EmptyState
        title="Lecturer not found"
        description="This lecturer may have been removed."
        action={
          <Button variant="outline" onClick={() => navigate(ROUTES.ADMIN_LECTURERS)}>
            <ArrowLeft className="size-4" /> Back to lecturers
          </Button>
        }
      />
    )
  }

  const isActive = lecturer.active !== false
  const status = isActive ? LECTURER_STATUS.ACTIVE : LECTURER_STATUS.INACTIVE

  const handleConfirmStatusChange = async () => {
    try {
      await setLecturerStatus.mutateAsync({ lecturer, active: !isActive })
      toast.success(isActive ? 'Lecturer deactivated' : 'Lecturer reactivated')
      setConfirmStatusOpen(false)
    } catch {
      toast.error('Failed to update lecturer status')
    }
  }

  const handleConfirmDelete = async () => {
    try {
      await deleteLecturer.mutateAsync(lecturer)
      toast.success('Lecturer permanently deleted')
      setConfirmDeleteOpen(false)
      navigate(ROUTES.ADMIN_LECTURERS)
    } catch (error) {
      toast.error(error.message || 'Failed to delete lecturer')
    }
  }

  return (
    <div className="space-y-6">
      <Button
        variant="ghost"
        size="sm"
        className="text-muted-foreground"
        onClick={() => navigate(ROUTES.ADMIN_LECTURERS)}
      >
        <ArrowLeft className="size-4" /> Back to lecturers
      </Button>

      <PageHeader
        title={lecturer.fullName}
        description="Lecturer profile and assignments."
        actions={
          <>
            <Button variant="outline" onClick={() => setEditOpen(true)}>
              Edit
            </Button>
            <Button
              variant={isActive ? 'destructive' : 'default'}
              onClick={() => setConfirmStatusOpen(true)}
            >
              {isActive ? (
                <>
                  <UserRoundX className="size-4" /> Deactivate
                </>
              ) : (
                <>
                  <UserRoundCheck className="size-4" /> Reactivate
                </>
              )}
            </Button>
            <Button variant="destructive" onClick={() => setConfirmDeleteOpen(true)}>
              <Trash2 className="size-4" /> Delete
            </Button>
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardContent className="space-y-4 p-5">
            <div className="flex items-center gap-3">
              <Avatar className="size-14">
                <AvatarFallback className="bg-primary/10 text-lg font-semibold text-primary">
                  {getInitials(lecturer.fullName, lecturer.email)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold text-foreground">{lecturer.fullName}</p>
                <StatusPill status={status} className="mt-1" />
              </div>
            </div>

            <div className="space-y-2 border-t border-border pt-4 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="size-4 shrink-0" />
                <span className="truncate">{lecturer.email}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Assigned Batches</CardTitle>
          </CardHeader>
          <CardContent>
            {batchesLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
              </div>
            ) : batches.length === 0 ? (
              <EmptyState
                icon={Layers}
                title="No batches assigned yet"
                description="Batches assigned to this lecturer will appear here."
                className="border-none bg-transparent py-10"
              />
            ) : (
              <div className="space-y-3">
                {batches.map((batch) => {
                  const percent =
                    batch.plannedClassCount > 0
                      ? Math.min(100, Math.round((batch.completedClassCount / batch.plannedClassCount) * 100))
                      : 0
                  const startDate = toDate(batch.startDate)
                  return (
                    <button
                      key={batch.id}
                      type="button"
                      onClick={() =>
                        navigate(ROUTES.ADMIN_BATCH_DETAIL.replace(':batchId', batch.id))
                      }
                      className="w-full space-y-2 rounded-lg border border-border p-4 text-left transition-colors hover:bg-accent/50"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <p className="font-medium text-foreground">{batch.batchCode}</p>
                          <p className="text-xs text-muted-foreground">
                            {courseById[batch.courseId]?.name ?? 'Unknown course'}
                            {startDate ? ` · Starts ${format(startDate, 'MMM d, yyyy')}` : ''}
                          </p>
                        </div>
                        <StatusPill status={deriveBatchStatus(batch)} />
                      </div>
                      <Progress value={percent} className="h-1.5" />
                    </button>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <LecturerFormDialog
        key={lecturer.id}
        open={editOpen}
        onOpenChange={setEditOpen}
        lecturer={lecturer}
      />

      <ConfirmDialog
        open={confirmStatusOpen}
        onOpenChange={setConfirmStatusOpen}
        title={isActive ? 'Deactivate lecturer?' : 'Reactivate lecturer?'}
        description={
          isActive
            ? `${lecturer.fullName} will no longer be able to sign in or receive new class assignments.`
            : `${lecturer.fullName} will regain access to sign in and be assignable to classes.`
        }
        confirmLabel={isActive ? 'Deactivate' : 'Reactivate'}
        destructive={isActive}
        loading={setLecturerStatus.isPending}
        onConfirm={handleConfirmStatusChange}
      />

      <ConfirmDialog
        open={confirmDeleteOpen}
        onOpenChange={setConfirmDeleteOpen}
        title="Delete this lecturer?"
        description={`${lecturer.fullName} will be permanently deleted from Lecturers and Users. Existing class, batch, report, and payment history will not be removed automatically.`}
        confirmLabel="Delete"
        destructive
        loading={deleteLecturer.isPending}
        onConfirm={handleConfirmDelete}
      />
    </div>
  )
}
