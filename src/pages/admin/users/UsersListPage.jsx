import { useMemo, useState } from 'react'
import { MoreHorizontal, Plus, Search } from 'lucide-react'
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
import { StatusBadge } from '@/components/common/StatusBadge'
import { ROLES, ROLE_LABELS } from '@/constants/roles'
import { StaffFormDialog } from '@/features/users/components/StaffFormDialog'
import { useSetUserActive, useUsers } from '@/features/users/hooks/useUsers'
import { useAuth } from '@/hooks/useAuth'
import { getInitials } from '@/utils/formatters'

export default function UsersListPage() {
  const { firebaseUser } = useAuth()
  const { data: users, loading } = useUsers()
  const setUserActive = useSetUserActive()

  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [addStaffOpen, setAddStaffOpen] = useState(false)
  const [activeTarget, setActiveTarget] = useState(null)

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    return users.filter((user) => {
      const matchesRole = roleFilter === 'all' || user.role === roleFilter
      const matchesQuery =
        !query ||
        user.fullName?.toLowerCase().includes(query) ||
        user.email?.toLowerCase().includes(query)
      return matchesRole && matchesQuery
    })
  }, [users, search, roleFilter])

  const columns = [
    {
      key: 'user',
      header: 'User',
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
      key: 'role',
      header: 'Role',
      render: (row) => <StatusBadge tone="info">{ROLE_LABELS[row.role] ?? row.role}</StatusBadge>,
    },
    {
      key: 'active',
      header: 'Status',
      render: (row) => (
        <StatusBadge tone={row.active === false ? 'muted' : 'success'}>
          {row.active === false ? 'Inactive' : 'Active'}
        </StatusBadge>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (row) =>
        row.role === ROLES.STAFF && row.id !== firebaseUser?.uid ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm">
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {row.active === false ? (
                <DropdownMenuItem onClick={() => setActiveTarget(row)}>Activate</DropdownMenuItem>
              ) : (
                <DropdownMenuItem variant="destructive" onClick={() => setActiveTarget(row)}>
                  Deactivate
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null,
    },
  ]

  const handleConfirmActiveChange = async () => {
    if (!activeTarget) return
    const nextActive = activeTarget.active === false
    try {
      await setUserActive.mutateAsync({ uid: activeTarget.id, active: nextActive })
      toast.success(nextActive ? 'User activated' : 'User deactivated')
      setActiveTarget(null)
    } catch {
      toast.error('Failed to update user')
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Users"
        description="Everyone with access to the system, across all roles."
        actions={
          <Button onClick={() => setAddStaffOpen(true)}>
            <Plus className="size-4" /> Add Staff
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
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All roles</SelectItem>
            <SelectItem value={ROLES.ADMIN}>Admin</SelectItem>
            <SelectItem value={ROLES.STAFF}>Staff</SelectItem>
            <SelectItem value={ROLES.LECTURER}>Lecturer</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataTable columns={columns} data={filtered} loading={loading} emptyTitle="No users found" />

      <StaffFormDialog open={addStaffOpen} onOpenChange={setAddStaffOpen} />

      <ConfirmDialog
        open={Boolean(activeTarget)}
        onOpenChange={(open) => !open && setActiveTarget(null)}
        title={activeTarget?.active === false ? 'Activate this user?' : 'Deactivate this user?'}
        description={
          activeTarget?.active === false
            ? `${activeTarget?.fullName} will regain access to sign in.`
            : `${activeTarget?.fullName} will no longer be able to sign in.`
        }
        confirmLabel={activeTarget?.active === false ? 'Activate' : 'Deactivate'}
        destructive={activeTarget?.active !== false}
        loading={setUserActive.isPending}
        onConfirm={handleConfirmActiveChange}
      />
    </div>
  )
}
