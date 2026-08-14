import { Navigate, Outlet } from 'react-router-dom'

import { FullScreenLoader } from '@/components/common/FullScreenLoader'
import { HOME_ROUTE_BY_ROLE } from '@/constants/routes'
import { useAuth } from '@/hooks/useAuth'

/** Keeps already-authenticated users off the login page by bouncing them to their dashboard. */
export function PublicOnlyRoute() {
  const { isAuthenticated, role, loading } = useAuth()

  if (loading) return <FullScreenLoader />

  if (isAuthenticated) {
    return <Navigate to={HOME_ROUTE_BY_ROLE[role] ?? '/'} replace />
  }

  return <Outlet />
}
