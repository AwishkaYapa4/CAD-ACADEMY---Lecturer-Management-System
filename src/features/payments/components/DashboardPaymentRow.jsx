import { CheckCircle2, ChevronRight } from 'lucide-react'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { formatCurrency } from '@/features/payments/utils/monthlyCalc'
import { cn } from '@/lib/utils'
import { getInitials } from '@/utils/formatters'

/**
 * One lecturer row inside the Admin dashboard's "Pending Payments"/"Payment
 * Received" cards (see PendingPaymentsCard / PaymentReceivedCard). Purely
 * presentational — every figure (completed/target/amount) is computed
 * upstream by the same usePaymentReadinessSummary + calculateMonthlyPayment
 * pipeline every other payment view in the app uses, so this never
 * re-derives money math of its own.
 */
export function DashboardPaymentRow({
  lecturerName,
  scopeLabel,
  completed,
  target,
  currency,
  finalPayment,
  monthlyAmount,
  paid,
  onClick,
}) {
  const percent = target > 0 ? Math.min(100, Math.round((completed / target) * 100)) : 0
  const extraClassCount = target > 0 ? Math.max(0, completed - target) : 0
  const paymentPerClass = target > 0 ? monthlyAmount / target : 0
  const extraPayment = extraClassCount * paymentPerClass

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3.5 rounded-xl border border-border bg-card p-4 text-left transition-colors hover:border-primary/30 hover:bg-muted/40"
    >
      <Avatar size="lg" className="shrink-0">
        <AvatarFallback className="bg-primary/10 font-semibold text-primary">
          {getInitials(lecturerName)}
        </AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <p className="truncate text-sm font-semibold text-foreground">{lecturerName}</p>
          <Badge
            variant="outline"
            className={cn(
              'border-transparent',
              paid ? 'bg-success/10 text-success' : 'bg-primary/10 text-primary'
            )}
          >
            {completed} / {target || '—'} Classes
          </Badge>
          {extraClassCount > 0 ? (
            <Badge variant="outline" className="border-transparent bg-warning/10 text-warning">
              +{extraClassCount} Extra
            </Badge>
          ) : null}
        </div>
        {scopeLabel ? <p className="mt-0.5 truncate text-xs text-muted-foreground">{scopeLabel}</p> : null}

        {!paid ? (
          <div className="mt-2 flex items-center gap-2">
            <Progress value={percent} className="h-1.5" />
            <span className="shrink-0 text-[11px] font-medium tabular-nums text-muted-foreground">
              {percent}%
            </span>
          </div>
        ) : null}
      </div>

      <div className="shrink-0 text-right">
        <p className={cn('text-base font-bold tabular-nums', paid ? 'text-success' : 'text-foreground')}>
          {formatCurrency(finalPayment, currency)}
        </p>
        {paid ? (
          <p className="mt-0.5 flex items-center justify-end gap-1 text-xs text-success">
            <CheckCircle2 className="size-3.5" /> Paid
          </p>
        ) : extraClassCount > 0 ? (
          <p className="mt-0.5 text-xs font-medium text-warning">
            Extra: {formatCurrency(extraPayment, currency)}
          </p>
        ) : (
          <p className="mt-0.5 text-xs text-muted-foreground">of {formatCurrency(monthlyAmount, currency)}</p>
        )}
      </div>

      {!paid ? <ChevronRight className="size-4 shrink-0 text-muted-foreground" /> : null}
    </button>
  )
}
