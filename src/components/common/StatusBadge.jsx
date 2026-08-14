import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const TONE_CLASSES = {
  success: 'bg-success/10 text-success border-success/20',
  warning: 'bg-warning/10 text-warning border-warning/30',
  destructive: 'bg-destructive/10 text-destructive border-destructive/20',
  info: 'bg-primary/10 text-primary border-primary/20',
  muted: 'bg-muted text-muted-foreground border-border',
}

/**
 * Renders a Badge colored by a semantic tone (success/warning/destructive/info/muted)
 * instead of shadcn's default variant set, so every status pill in the app reads consistently.
 */
export function StatusBadge({ tone = 'muted', children, className, ...props }) {
  return (
    <Badge
      variant="outline"
      className={cn('capitalize', TONE_CLASSES[tone] ?? TONE_CLASSES.muted, className)}
      {...props}
    >
      {children}
    </Badge>
  )
}
