import { useMemo } from 'react'
import { AlertTriangle } from 'lucide-react'

import { EmptyState } from '@/components/common/EmptyState'
import { PageHeader } from '@/components/common/PageHeader'
import { REPORT_STATUS } from '@/constants/statuses'
import { useCourses } from '@/features/courses/hooks/useCourses'
import { useLecturerReports } from '@/features/classReports/hooks/useClassReports'
import { LectureMaterialsList } from '@/features/materials/components/LectureMaterialsList'
import { useMyLectureMaterials } from '@/features/materials/hooks/useLectureMaterials'
import { useAuth } from '@/hooks/useAuth'

export default function MyMaterialsPage() {
  const { profile } = useAuth()
  const { data: materials, loading, error } = useMyLectureMaterials()
  const { data: reports } = useLecturerReports(profile?.lecturerId)
  const { data: courses } = useCourses()

  const courseById = useMemo(() => Object.fromEntries(courses.map((c) => [c.id, c])), [courses])
  const reportStatusByScheduleId = useMemo(
    () => Object.fromEntries(reports.map((r) => [r.id, r.status])),
    [reports]
  )

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
        <LectureMaterialsList
          materials={materials}
          loading={loading}
          getCourseName={(courseId) => courseById[courseId]?.name}
          canDelete={(material) => reportStatusByScheduleId[material.scheduleId] === REPORT_STATUS.DRAFT}
        />
      )}
    </div>
  )
}
