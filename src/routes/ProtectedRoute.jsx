import { Navigate, Outlet, useLocation } from 'react-router-dom'

import { FullScreenLoader } from '@/components/common/FullScreenLoader'
import { ROUTES } from '@/constants/routes'
import { useAuth } from '@/hooks/useAuth'

/** Blocks unauthenticated users from any nested route, redirecting back to /login. */
export function ProtectedRoute() {
  const { isAuthenticated, loading } = useAuth()
  const location = useLocation()

  if (loading) return <FullScreenLoader label="Checking your session..." />

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />
  }

  return <Outlet />
}
