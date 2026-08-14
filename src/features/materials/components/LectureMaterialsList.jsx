import { useState } from 'react'
import { format } from 'date-fns'
import { Download, FileText, Loader2, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { EmptyState } from '@/components/common/EmptyState'
import { useDeleteLectureMaterial, useLectureMaterialDownload } from '@/features/materials/hooks/useLectureMaterials'
import { toDate } from '@/utils/formatters'

function formatSize(bytes) {
  if (!bytes) return '—'
  const mb = bytes / (1024 * 1024)
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`
}

function groupByWeek(materials) {
  const groups = new Map()
  for (const material of materials) {
    if (!groups.has(material.week)) groups.set(material.week, [])
    groups.get(material.week).push(material)
  }
  return [...groups.entries()].sort(([a], [b]) => a - b)
}

/**
 * Groups by course first, then by week within each course — used for the
 * "materials I've uploaded" view (My Materials page), which spans every
 * course a lecturer teaches rather than one course at a time.
 */
function groupByCourseThenWeek(materials, getCourseName) {
  const byCourse = new Map()
  for (const material of materials) {
    if (!byCourse.has(material.courseId)) byCourse.set(material.courseId, [])
    byCourse.get(material.courseId).push(material)
  }
  return [...byCourse.entries()]
    .map(([courseId, courseMaterials]) => [getCourseName(courseId) ?? 'Unknown course', groupByWeek(courseMaterials)])
    .sort(([a], [b]) => a.localeCompare(b))
}

/**
 * Lists Cloudinary-backed lecture materials, grouped by week (or by course
 * then week when `getCourseName` is passed) — used by the Lecturer, Staff,
 * and Admin materials pages alike. `canDelete(material)` decides whether the
 * trash icon shows per row; omit it to render a view/download-only list.
 */
export function LectureMaterialsList({ materials, loading, canDelete, getCourseName }) {
  const [removeTarget, setRemoveTarget] = useState(null)
  const [downloadingId, setDownloadingId] = useState(null)
  const deleteMaterial = useDeleteLectureMaterial()
  const downloadMaterial = useLectureMaterialDownload()

  const handleDownload = async (material) => {
    setDownloadingId(material.id)
    try {
      const { url } = await downloadMaterial.mutateAsync(material.id)
      window.open(url, '_blank', 'noopener,noreferrer')
    } catch (error) {
      toast.error(error.message || 'Failed to generate a download link')
    } finally {
      setDownloadingId(null)
    }
  }

  const handleConfirmRemove = async () => {
    if (!removeTarget) return
    try {
      await deleteMaterial.mutateAsync({ id: removeTarget.id, courseId: removeTarget.courseId })
      toast.success('Material removed')
      setRemoveTarget(null)
    } catch (error) {
      toast.error(error.message || 'Failed to remove material')
    }
  }

  if (loading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-14 w-full" />
      </div>
    )
  }

  if (materials.length === 0) {
    return (
      <EmptyState
        icon={FileText}
        title="No materials yet"
        description={
          getCourseName
            ? "Materials you upload while completing a class will show up here."
            : 'Materials uploaded for this course will show up here, grouped by week.'
        }
      />
    )
  }

  const renderMaterialRow = (material) => (
    <div key={material.id} className="flex items-center gap-3 rounded-lg border border-border px-3 py-2.5">
      <FileText className="size-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{material.title}</p>
        <p className="truncate text-xs text-muted-foreground">
          {material.originalFilename} · {formatSize(material.sizeBytes)}
          {material.uploadedAt ? ` · Uploaded ${format(toDate(material.uploadedAt), 'MMM d, yyyy')}` : ''}
        </p>
      </div>
      <Badge variant="outline" className="uppercase">
        {material.format}
      </Badge>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Download"
        disabled={downloadingId === material.id}
        onClick={() => handleDownload(material)}
      >
        {downloadingId === material.id ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Download className="size-4" />
        )}
      </Button>
      {canDelete?.(material) ? (
        <Button variant="ghost" size="icon-sm" aria-label="Remove material" onClick={() => setRemoveTarget(material)}>
          <Trash2 className="size-4 text-destructive" />
        </Button>
      ) : null}
    </div>
  )

  const renderWeekGroups = (weekGroups) =>
    weekGroups.map(([week, weekMaterials]) => (
      <div key={week} className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground uppercase">Week {week}</p>
        <div className="space-y-2">{weekMaterials.map(renderMaterialRow)}</div>
      </div>
    ))

  return (
    <div className="space-y-6">
      {getCourseName
        ? groupByCourseThenWeek(materials, getCourseName).map(([courseName, weekGroups]) => (
            <div key={courseName} className="space-y-3">
              <p className="text-sm font-semibold text-foreground">{courseName}</p>
              <div className="space-y-5 border-l-2 border-border pl-4">{renderWeekGroups(weekGroups)}</div>
            </div>
          ))
        : renderWeekGroups(groupByWeek(materials))}

      <ConfirmDialog
        open={Boolean(removeTarget)}
        onOpenChange={(open) => !open && setRemoveTarget(null)}
        title="Remove this material?"
        description={removeTarget ? `"${removeTarget.title}" will be permanently removed.` : undefined}
        confirmLabel="Remove"
        destructive
        loading={deleteMaterial.isPending}
        onConfirm={handleConfirmRemove}
      />
    </div>
  )
}
