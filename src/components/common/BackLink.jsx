import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

import { cn } from '@/lib/utils'

/** Small "back" affordance for sub-pages of a flow (e.g. a role's sign-in page back to the role picker). */
export function BackLink({ to, label = 'Back', className }) {
  return (
    <Link
      to={to}
      className={cn(
        'inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground',
        className
      )}
    >
      <ArrowLeft className="size-4" />
      {label}
    </Link>
  )
}
