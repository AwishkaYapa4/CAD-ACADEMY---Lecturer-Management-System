import { useState } from 'react'
import { AlertTriangle } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { EmptyState } from '@/components/common/EmptyState'
import { PageHeader } from '@/components/common/PageHeader'
import { useCourses } from '@/features/courses/hooks/useCourses'
import { LectureMaterialUploadForm } from '@/features/materials/components/LectureMaterialUploadForm'
import { LectureMaterialsList } from '@/features/materials/components/LectureMaterialsList'
import { useCourseMaterials } from '@/features/materials/hooks/useLectureMaterials'

/**
 * Admin's view of the Cloudinary-backed lecture material library — Admin can
 * upload/manage materials for any course (unlike the Lecturer page, which
 * only offers courses that lecturer teaches).
 */
export default function AdminMaterialsPage() {
  const { data: courses, loading: coursesLoading } = useCourses()
  const [selectedCourseId, setSelectedCourseId] = useState('')
  const {
    data: courseMaterials,
    loading: courseMaterialsLoading,
    error: courseMaterialsError,
  } = useCourseMaterials(selectedCourseId)

  return (
    <div className="space-y-6">
      <PageHeader title="Materials" description="Upload and manage lecture materials for every course." />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Upload lecture material</CardTitle>
        </CardHeader>
        <CardContent>
          {!coursesLoading && courses.length === 0 ? (
            <EmptyState title="No courses yet" description="Add a course before uploading materials." />
          ) : (
            <LectureMaterialUploadForm courses={courses} />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Browse materials</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="max-w-xs space-y-1.5">
            <p className="text-sm font-medium text-foreground">Course</p>
            <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select course" />
              </SelectTrigger>
              <SelectContent>
                {courses.map((course) => (
                  <SelectItem key={course.id} value={course.id}>
                    {course.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {!selectedCourseId ? (
            <EmptyState title="Select a course" description="Choose a course above to see its materials." />
          ) : courseMaterialsError ? (
            <EmptyState
              icon={AlertTriangle}
              title="Couldn't load materials"
              description="Something went wrong talking to the Materials API. Please refresh and try again."
            />
          ) : (
            <LectureMaterialsList
              materials={courseMaterials}
              loading={courseMaterialsLoading}
              canDelete={() => true}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
