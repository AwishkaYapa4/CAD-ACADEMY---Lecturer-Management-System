import { StatusBadge } from '@/components/common/StatusBadge'
import { STATUS_BADGE_VARIANTS, STATUS_LABELS } from '@/constants/statuses'

function toLabel(status) {
  return STATUS_LABELS[status] ?? status.replace(/_/g, ' ')
}

/** Looks up the semantic tone for a known status value and renders a StatusBadge. */
export function StatusPill({ status, className }) {
  const tone = STATUS_BADGE_VARIANTS[status] ?? 'muted'
  return (
    <StatusBadge tone={tone} className={className}>
      {toLabel(status)}
    </StatusBadge>
  )
}
