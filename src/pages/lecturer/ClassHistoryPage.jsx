import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'

import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/common/DataTable'
import { PageHeader } from '@/components/common/PageHeader'
import { StatusPill } from '@/components/common/StatusPill'
import { ROUTES } from '@/constants/routes'
import { REPORT_STATUS } from '@/constants/statuses'
import { useCourses } from '@/features/courses/hooks/useCourses'
import { useBatches } from '@/features/batches/hooks/useBatches'
import { useLecturerReports } from '@/features/classReports/hooks/useClassReports'
import { useAuth } from '@/hooks/useAuth'
import { toDate } from '@/utils/formatters'

export default function ClassHistoryPage() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const { data: reports, loading } = useLecturerReports(profile?.lecturerId)
  const { data: courses } = useCourses()
  const { data: batches } = useBatches()

  const courseById = useMemo(() => Object.fromEntries(courses.map((c) => [c.id, c])), [courses])
  const batchById = useMemo(() => Object.fromEntries(batches.map((b) => [b.id, b])), [batches])

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
    { key: 'topicCovered', header: 'Topic', render: (row) => row.topicCovered || '—' },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StatusPill status={row.status} />,
    },
    {
      key: 'materialCount',
      header: 'Materials',
      render: (row) => row.materialCount || 0,
    },
    {
      key: 'when',
      header: 'Submitted',
      render: (row) => {
        const date = toDate(row.submittedAt)
        return date ? format(date, 'MMM d, yyyy p') : '—'
      },
    },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (row) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(ROUTES.LECTURER_SUBMIT_REPORT.replace(':scheduleId', row.id))}
        >
          {row.status === REPORT_STATUS.DRAFT ? 'Continue Draft' : 'View'}
        </Button>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader title="My Class History" description="All classes you've reported on." />

      <DataTable
        columns={columns}
        data={reports}
        loading={loading}
        emptyTitle="No class history yet"
        emptyDescription="Reports you save or submit will show up here."
      />
    </div>
  )
}
