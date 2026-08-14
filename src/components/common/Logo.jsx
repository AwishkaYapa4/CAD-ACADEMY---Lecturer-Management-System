import { PencilRuler } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Logo({ collapsed = false, onDark = false, className }) {
  if (collapsed) {
    return (
      <div className={cn('flex items-center justify-center', className)}>
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <PencilRuler className="size-4.5" />
        </div>
      </div>
    )
  }

  return (
    <div className={cn('flex min-w-0 flex-col leading-tight', className)}>
      <p
        className={cn(
          'truncate text-lg font-bold tracking-wide',
          onDark ? 'text-sidebar-foreground' : 'text-foreground'
        )}
      >
        CAD <span className="text-primary">ACADEMY</span>
      </p>
      <p
        className={cn('truncate text-[11px]', onDark ? 'text-sidebar-foreground/55' : 'text-muted-foreground')}
      >
        Lecturer Management System
      </p>
    </div>
  )
}
