import { Link } from 'react-router-dom'
import { UserX } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { ROUTES } from '@/constants/routes'

export default function DeactivatedPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <UserX className="size-7" />
      </div>
      <div className="space-y-1.5">
        <h1 className="text-xl font-semibold text-foreground">Account deactivated</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          Your account has been deactivated by an administrator. Contact your
          office admin if you believe this is a mistake.
        </p>
      </div>
      <Button asChild>
        <Link to={ROUTES.LOGIN}>Back to sign in</Link>
      </Button>
    </div>
  )
}
