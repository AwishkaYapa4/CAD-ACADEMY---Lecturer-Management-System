import { Link } from 'react-router-dom'
import { Compass } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { HOME_ROUTE_BY_ROLE, ROUTES } from '@/constants/routes'
import { useAuth } from '@/hooks/useAuth'

export default function NotFoundPage() {
  const { role } = useAuth()

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Compass className="size-7" />
      </div>
      <div className="space-y-1.5">
        <h1 className="text-xl font-semibold text-foreground">Page not found</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          The page you're looking for doesn't exist or may have moved.
        </p>
      </div>
      <Button asChild>
        <Link to={role ? (HOME_ROUTE_BY_ROLE[role] ?? ROUTES.LOGIN) : ROUTES.LOGIN}>
          Go back home
        </Link>
      </Button>
    </div>
  )
}
