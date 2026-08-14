import { useNavigate } from 'react-router-dom'
import { LogOut, Moon, Sun, UserCircle } from 'lucide-react'
import toast from 'react-hot-toast'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ROLE_LABELS, ROLES } from '@/constants/roles'
import { ROUTES } from '@/constants/routes'
import { useAuth } from '@/hooks/useAuth'
import { useTheme } from '@/hooks/useTheme'
import { getInitials } from '@/utils/formatters'

const PROFILE_ROUTE_BY_ROLE = {
  [ROLES.ADMIN]: ROUTES.ADMIN_SETTINGS,
  [ROLES.STAFF]: ROUTES.STAFF_PROFILE,
  [ROLES.LECTURER]: ROUTES.LECTURER_PROFILE,
}

export function ProfileDropdown() {
  const { profile, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      await logout()
      navigate(ROUTES.LOGIN, { replace: true })
    } catch {
      toast.error('Failed to sign out. Please try again.')
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-9 gap-2 px-1.5">
          <Avatar className="size-7">
            <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
              {getInitials(profile?.fullName, profile?.email)}
            </AvatarFallback>
          </Avatar>
          <span className="hidden max-w-32 truncate text-sm font-medium sm:inline">
            {profile?.fullName ?? profile?.email}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <p className="truncate text-sm font-medium text-foreground">
            {profile?.fullName ?? 'Account'}
          </p>
          <p className="truncate text-xs text-muted-foreground">{profile?.email}</p>
          <p className="mt-0.5 text-xs font-medium text-primary">
            {ROLE_LABELS[profile?.role] ?? profile?.role}
          </p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate(PROFILE_ROUTE_BY_ROLE[profile?.role])}>
          <UserCircle /> {profile?.role === ROLES.ADMIN ? 'Settings' : 'Profile'}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={toggleTheme}>
          {theme === 'dark' ? <Sun /> : <Moon />}
          {theme === 'dark' ? 'Light mode' : 'Dark mode'}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={handleLogout}>
          <LogOut /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
