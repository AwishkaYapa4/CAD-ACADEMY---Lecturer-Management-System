import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { DataTable } from '@/components/common/DataTable'
import { PageHeader } from '@/components/common/PageHeader'
import { StatusPill } from '@/components/common/StatusPill'
import { LECTURER_STATUS } from '@/constants/statuses'
import { useLecturers } from '@/features/lecturers/hooks/useLecturers'
import { getInitials } from '@/utils/formatters'

export default function StaffLecturersPage() {
  const { data: lecturers, loading } = useLecturers()
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return lecturers
    return lecturers.filter(
      (l) => l.fullName?.toLowerCase().includes(query) || l.email?.toLowerCase().includes(query)
    )
  }, [lecturers, search])

  const columns = [
    {
      key: 'name',
      header: 'Lecturer',
      render: (row) => (
        <div className="flex items-center gap-3">
          <Avatar className="size-8">
            <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
              {getInitials(row.fullName, row.email)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate font-medium text-foreground">{row.fullName}</p>
            <p className="truncate text-xs text-muted-foreground">{row.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <StatusPill status={row.active === false ? LECTURER_STATUS.INACTIVE : LECTURER_STATUS.ACTIVE} />
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader title="Lecturers" description="All lecturers in the academy." />

      <div className="relative max-w-xs">
        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by name or email..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <DataTable columns={columns} data={filtered} loading={loading} emptyTitle="No lecturers yet" />
    </div>
  )
}
