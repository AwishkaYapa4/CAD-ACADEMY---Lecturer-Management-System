import { useMemo, useState } from 'react'
import { format } from 'date-fns'
import { AlertTriangle, Search } from 'lucide-react'

import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DataTable } from '@/components/common/DataTable'
import { EmptyState } from '@/components/common/EmptyState'
import { PageHeader } from '@/components/common/PageHeader'
import { useCourses } from '@/features/courses/hooks/useCourses'
import { useLecturers } from '@/features/lecturers/hooks/useLecturers'
import { LectureMaterialsList } from '@/features/materials/components/LectureMaterialsList'
import { useCourseMaterials } from '@/features/materials/hooks/useLectureMaterials'
import { useAllMaterials } from '@/features/materials/hooks/useMaterials'
import { getMaterialDownloadUrl } from '@/features/materials/services/materialService'
import { toDate } from '@/utils/formatters'

export default function StaffMaterialsPage() {
  const { data: materials, loading } = useAllMaterials()
  const { data: courses } = useCourses()
  const { data: lecturers } = useLecturers()
  const [search, setSearch] = useState('')
  const [selectedCourseId, setSelectedCourseId] = useState('')
  const {
    data: courseMaterials,
    loading: courseMaterialsLoading,
    error: courseMaterialsError,
  } = useCourseMaterials(selectedCourseId)

  const courseById = useMemo(() => Object.fromEntries(courses.map((c) => [c.id, c])), [courses])
  const lecturerById = useMemo(
    () => Object.fromEntries(lecturers.map((l) => [l.id, l])),
    [lecturers]
  )

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return materials
    return materials.filter((material) => {
      const lecturer = lecturerById[material.lecturerId]
      return (
        material.fileName?.toLowerCase().includes(query) ||
        lecturer?.fullName?.toLowerCase().includes(query)
      )
    })
  }, [materials, search, lecturerById])

  const handleDownload = async (material) => {
    const url = await getMaterialDownloadUrl(material)
    window.open(url, '_blank', 'noopener,noreferrer')
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
    { key: 'lecturer', header: 'Lecturer', render: (row) => lecturerById[row.lecturerId]?.fullName ?? '—' },
    { key: 'course', header: 'Course', render: (row) => courseById[row.courseId]?.name ?? '—' },
    {
      key: 'uploadedAt',
      header: 'Uploaded',
      render: (row) => {
        const date = toDate(row.uploadedAt)
        return date ? format(date, 'MMM d, yyyy') : '—'
      },
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader title="Materials" description="All materials lecturers have uploaded." />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Lecture materials library</CardTitle>
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
            <LectureMaterialsList materials={courseMaterials} loading={courseMaterialsLoading} />
          )}
        </CardContent>
      </Card>

      <div className="relative max-w-xs">
        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by file or lecturer..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <DataTable columns={columns} data={filtered} loading={loading} emptyTitle="No materials uploaded yet" />
    </div>
  )
}
