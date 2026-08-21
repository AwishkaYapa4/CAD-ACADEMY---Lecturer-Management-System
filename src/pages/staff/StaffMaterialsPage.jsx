import { useMemo, useState } from 'react'
import { format } from 'date-fns'
import { Search } from 'lucide-react'

import { Input } from '@/components/ui/input'
import { DataTable } from '@/components/common/DataTable'
import { PageHeader } from '@/components/common/PageHeader'
import { useCourses } from '@/features/courses/hooks/useCourses'
import { useAllLectureMaterials } from '@/features/materials/hooks/useLectureMaterials'
import { getLectureMaterialDownload } from '@/features/materials/services/lectureMaterialService'
import { toDate } from '@/utils/formatters'

export default function StaffMaterialsPage() {
  const { data: materials, loading } = useAllLectureMaterials()
  const { data: courses } = useCourses()
  const [search, setSearch] = useState('')

  const courseById = useMemo(() => Object.fromEntries(courses.map((c) => [c.id, c])), [courses])

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return materials
    return materials.filter((material) => {
      const course = courseById[material.courseId]
      return (
        material.title?.toLowerCase().includes(query) ||
        material.originalFilename?.toLowerCase().includes(query) ||
        material.uploadedByName?.toLowerCase().includes(query) ||
        course?.name?.toLowerCase().includes(query)
      )
    })
  }, [materials, search, courseById])

  const handleDownload = async (material) => {
    const { url } = await getLectureMaterialDownload(material.id)
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const columns = [
    {
      key: 'title',
      header: 'File',
      render: (row) => (
        <button
          type="button"
          onClick={() => handleDownload(row)}
          className="font-medium text-foreground hover:text-primary hover:underline"
        >
          {row.title ?? row.originalFilename}
        </button>
      ),
    },
    { key: 'lecturer', header: 'Uploaded by', render: (row) => row.uploadedByName || '-' },
    { key: 'course', header: 'Course', render: (row) => courseById[row.courseId]?.name ?? '-' },
    {
      key: 'uploadedAt',
      header: 'Uploaded',
      render: (row) => {
        const date = toDate(row.uploadedAt)
        return date ? format(date, 'MMM d, yyyy') : '-'
      },
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader title="Materials" description="Uploaded class materials." />

      <div className="relative max-w-xs">
        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by file, lecturer, course..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <DataTable columns={columns} data={filtered} loading={loading} emptyTitle="No materials uploaded yet" />
    </div>
  )
}
