import { Navigate, Outlet } from 'react-router-dom'

import { ROUTES } from '@/constants/routes'
import { useAuth } from '@/hooks/useAuth'

/** Restricts nested routes to a set of roles; other authenticated roles get bounced to /403. */
export function RoleRoute({ allowedRoles }) {
  const { role } = useAuth()

  if (!allowedRoles.includes(role)) {
    return <Navigate to={ROUTES.FORBIDDEN} replace />
  }

  return <Outlet />
}
