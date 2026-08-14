import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MoreHorizontal, Plus, Search, UserRoundX, UserRoundCheck } from 'lucide-react'
import toast from 'react-hot-toast'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { DataTable } from '@/components/common/DataTable'
import { PageHeader } from '@/components/common/PageHeader'
import { StatusPill } from '@/components/common/StatusPill'
import { LECTURER_STATUS } from '@/constants/statuses'
import { ROUTES } from '@/constants/routes'
import { getInitials } from '@/utils/formatters'
import { LecturerFormDialog } from '@/features/lecturers/components/LecturerFormDialog'
import { useLecturers, useSetLecturerStatus } from '@/features/lecturers/hooks/useLecturers'

function statusOf(lecturer) {
  return lecturer.active === false ? LECTURER_STATUS.INACTIVE : LECTURER_STATUS.ACTIVE
}

export default function LecturersListPage() {
  const { data: lecturers, loading } = useLecturers()
  const setLecturerStatus = useSetLecturerStatus()
  const navigate = useNavigate()

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [formState, setFormState] = useState({ open: false, lecturer: null })
  const [statusTarget, setStatusTarget] = useState(null)

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    return lecturers.filter((lecturer) => {
      const matchesStatus = statusFilter === 'all' || statusOf(lecturer) === statusFilter
      const matchesQuery =
        !query ||
        lecturer.fullName?.toLowerCase().includes(query) ||
        lecturer.email?.toLowerCase().includes(query)
      return matchesStatus && matchesQuery
    })
  }, [lecturers, search, statusFilter])

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
      render: (row) => <StatusPill status={statusOf(row)} />,
    },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (row) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
            <DropdownMenuItem
              onClick={() =>
                navigate(ROUTES.ADMIN_LECTURER_DETAIL.replace(':lecturerId', row.id))
              }
            >
              View details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFormState({ open: true, lecturer: row })}>
              Edit
            </DropdownMenuItem>
            {statusOf(row) === LECTURER_STATUS.ACTIVE ? (
              <DropdownMenuItem variant="destructive" onClick={() => setStatusTarget(row)}>
                <UserRoundX /> Deactivate
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={() => setStatusTarget(row)}>
                <UserRoundCheck /> Reactivate
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]

  const handleConfirmStatusChange = async () => {
    if (!statusTarget) return
    const nextActive = statusOf(statusTarget) !== LECTURER_STATUS.ACTIVE

    try {
      await setLecturerStatus.mutateAsync({ lecturer: statusTarget, active: nextActive })
      toast.success(nextActive ? 'Lecturer reactivated' : 'Lecturer deactivated')
      setStatusTarget(null)
    } catch {
      toast.error('Failed to update lecturer status')
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Lecturers"
        description="Manage lecturer profiles and account access."
        actions={
          <Button onClick={() => setFormState({ open: true, lecturer: null })}>
            <Plus className="size-4" /> Add Lecturer
          </Button>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value={LECTURER_STATUS.ACTIVE}>Active</SelectItem>
            <SelectItem value={LECTURER_STATUS.INACTIVE}>Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        loading={loading}
        getRowId={(row) => row.id}
        onRowClick={(row) =>
          navigate(ROUTES.ADMIN_LECTURER_DETAIL.replace(':lecturerId', row.id))
        }
        emptyTitle="No lecturers yet"
        emptyDescription="Add your first lecturer to start assigning courses and batches."
      />

      <LecturerFormDialog
        key={formState.lecturer?.id ?? 'create'}
        open={formState.open}
        onOpenChange={(open) => setFormState({ open, lecturer: open ? formState.lecturer : null })}
        lecturer={formState.lecturer}
      />

      <ConfirmDialog
        open={Boolean(statusTarget)}
        onOpenChange={(open) => !open && setStatusTarget(null)}
        title={
          statusTarget && statusOf(statusTarget) === LECTURER_STATUS.ACTIVE
            ? 'Deactivate lecturer?'
            : 'Reactivate lecturer?'
        }
        description={
          statusTarget && statusOf(statusTarget) === LECTURER_STATUS.ACTIVE
            ? `${statusTarget?.fullName} will no longer be able to sign in or receive new class assignments.`
            : `${statusTarget?.fullName} will regain access to sign in and be assignable to classes.`
        }
        confirmLabel={
          statusTarget && statusOf(statusTarget) === LECTURER_STATUS.ACTIVE
            ? 'Deactivate'
            : 'Reactivate'
        }
        destructive={Boolean(statusTarget) && statusOf(statusTarget) === LECTURER_STATUS.ACTIVE}
        loading={setLecturerStatus.isPending}
        onConfirm={handleConfirmStatusChange}
      />
    </div>
  )
}
