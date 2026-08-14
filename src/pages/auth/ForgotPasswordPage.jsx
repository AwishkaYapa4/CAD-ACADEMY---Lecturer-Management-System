import { BackLink } from '@/components/common/BackLink'
import { ROUTES } from '@/constants/routes'
import { ForgotPasswordForm } from '@/features/auth/components/ForgotPasswordForm'

export default function ForgotPasswordPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <BackLink to={ROUTES.LOGIN} label="Back to sign in" />
        <div className="space-y-1.5">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Reset your password
          </h1>
          <p className="text-sm text-muted-foreground">
            Enter your email and we'll send you a link to reset your password.
          </p>
        </div>
      </div>
      <ForgotPasswordForm />
    </div>
  )
}
