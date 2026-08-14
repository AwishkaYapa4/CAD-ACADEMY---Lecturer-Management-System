import { Link } from 'react-router-dom'
import { ChevronRight, Eye, GraduationCap, ShieldCheck } from 'lucide-react'

import { ROUTES } from '@/constants/routes'

const ROLE_OPTIONS = [
  {
    label: 'Admin',
    description: 'Full system access',
    icon: ShieldCheck,
    to: ROUTES.ADMIN_LOGIN,
  },
  {
    label: 'Staff',
    description: 'View-only operations access',
    icon: Eye,
    to: ROUTES.STAFF_LOGIN,
  },
  {
    label: 'Lecturer',
    description: 'Your classes and reports',
    icon: GraduationCap,
    to: ROUTES.LECTURER_LOGIN,
  },
]

export default function LoginPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-1.5">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Sign in to CAD Academy
        </h1>
        <p className="text-sm text-muted-foreground">Choose your account type to continue.</p>
      </div>

      <div className="space-y-3">
        {ROLE_OPTIONS.map((option) => (
          <Link
            key={option.label}
            to={option.to}
            className="flex items-center gap-4 rounded-xl border border-border p-4 transition-colors hover:border-primary/40 hover:bg-primary/5"
          >
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <option.icon className="size-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-medium text-foreground">{option.label}</p>
              <p className="text-sm text-muted-foreground">{option.description}</p>
            </div>
            <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
          </Link>
        ))}
      </div>
    </div>
  )
}
