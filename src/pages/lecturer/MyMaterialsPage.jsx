import { useMemo, useState } from 'react'
import { format } from 'date-fns'
import { AlertTriangle, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { DataTable } from '@/components/common/DataTable'
import { EmptyState } from '@/components/common/EmptyState'
import { PageHeader } from '@/components/common/PageHeader'
import { REPORT_STATUS } from '@/constants/statuses'
import { useBatches } from '@/features/batches/hooks/useBatches'
import { useCourses } from '@/features/courses/hooks/useCourses'
import { useLecturerReports } from '@/features/classReports/hooks/useClassReports'
import { useDeleteMaterial, useLecturerMaterials } from '@/features/materials/hooks/useMaterials'
import { getMaterialDownloadUrl } from '@/features/materials/services/materialService'
import { useAuth } from '@/hooks/useAuth'
import { toDate } from '@/utils/formatters'

export default function MyMaterialsPage() {
  const { profile } = useAuth()
  const { data: materials, loading, error, refetch } = useLecturerMaterials(profile?.lecturerId)
  const { data: reports } = useLecturerReports(profile?.lecturerId)
  const { data: courses } = useCourses()
  const { data: batches } = useBatches()
  const deleteMaterial = useDeleteMaterial()
  const [removeTarget, setRemoveTarget] = useState(null)

  const courseById = useMemo(() => Object.fromEntries(courses.map((c) => [c.id, c])), [courses])
  const batchById = useMemo(() => Object.fromEntries(batches.map((b) => [b.id, b])), [batches])
  const reportStatusByScheduleId = useMemo(
    () => Object.fromEntries(reports.map((r) => [r.id, r.status])),
    [reports]
  )

  const handleDownload = async (material) => {
    const url = await getMaterialDownloadUrl(material)
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const handleConfirmRemove = async () => {
    if (!removeTarget) return
    try {
      await deleteMaterial.mutateAsync(removeTarget)
      toast.success('Material removed')
      setRemoveTarget(null)
      refetch()
    } catch {
      toast.error('Failed to remove material')
    }
  }

  const columns = [
    {
      key: 'fileName',
      header: 'File',
      render: (row) => (
        <button
          type="button"
          onClick={() => handleDownload(row)}
          className="font-medium text-foreground hover:text-primary hover:underline"
        >
          {row.fileName}
        </button>
      ),
    },
    {
      key: 'class',
      header: 'Class',
      render: (row) => (
        <span className="text-sm text-muted-foreground">
          {courseById[row.courseId]?.name ?? '-'} / {batchById[row.batchId]?.batchCode ?? '-'}
        </span>
      ),
    },
    {
      key: 'uploadedAt',
      header: 'Uploaded',
      render: (row) => {
        const date = toDate(row.uploadedAt)
        return date ? format(date, 'MMM d, yyyy') : '-'
      },
    },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (row) =>
        reportStatusByScheduleId[row.scheduleId] === REPORT_STATUS.DRAFT ? (
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Remove material"
            onClick={() => setRemoveTarget(row)}
          >
            <Trash2 className="size-4 text-destructive" />
          </Button>
        ) : null,
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Materials"
        description="Materials you've uploaded while completing classes."
      />

      {error ? (
        <EmptyState
          icon={AlertTriangle}
          title="Couldn't load your materials"
          description="Something went wrong talking to the server. Please refresh and try again."
        />
      ) : (
        <DataTable
          columns={columns}
          data={materials}
          loading={loading}
          emptyTitle="No materials yet"
          emptyDescription="Materials you upload while submitting class reports will show up here."
        />
      )}

      <ConfirmDialog
        open={Boolean(removeTarget)}
        onOpenChange={(open) => !open && setRemoveTarget(null)}
        title="Remove this material?"
        description={removeTarget ? `"${removeTarget.fileName}" will be permanently removed.` : undefined}
        confirmLabel="Remove"
        destructive
        loading={deleteMaterial.isPending}
        onConfirm={handleConfirmRemove}
      />
    </div>
  )
}
