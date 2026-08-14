import { GraduationCap } from 'lucide-react'

import { BackLink } from '@/components/common/BackLink'
import { ROLES } from '@/constants/roles'
import { ROUTES } from '@/constants/routes'
import { LoginForm } from '@/features/auth/components/LoginForm'

export default function LecturerLoginPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <BackLink to={ROUTES.LOGIN} label="Back" />
        <div className="space-y-1.5">
          <div className="mb-2 flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <GraduationCap className="size-5" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Lecturer sign in
          </h1>
          <p className="text-sm text-muted-foreground">
            View your classes, submit reports, and manage your materials.
          </p>
        </div>
      </div>
      <LoginForm role={ROLES.LECTURER} />
    </div>
  )
}
