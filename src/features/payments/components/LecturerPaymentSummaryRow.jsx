import { CheckCircle2 } from 'lucide-react'

import { Progress } from '@/components/ui/progress'
import { formatCurrency } from '@/features/payments/utils/monthlyCalc'
import { cn } from '@/lib/utils'

/**
 * One lecturer/rule's monthly payment card for the dashboard.
 * Paid rows are rendered as closed, highlighted records; unpaid rows remain
 * the current payment view for the selected month.
 */
export function LecturerPaymentSummaryRow({ lecturerName, scopeLabel, completed, target, amount, finalPayment, paid }) {
  const percent = target > 0 ? Math.min(100, Math.round((completed / target) * 100)) : 0
  const progressValue = paid ? 100 : percent
  const currency = amount?.currency ?? ''
  const hasAmount = Boolean(amount)

  return (
    <div
      className={cn(
        'rounded-xl border bg-card p-5',
        paid ? 'border-success/40 bg-success/5 ring-1 ring-success/20' : 'border-border'
      )}
    >
      {lecturerName || scopeLabel || paid ? (
        <div className="mb-4 flex min-w-0 items-start justify-between gap-3">
          <div className="min-w-0">
            {lecturerName ? (
              <p className="truncate text-base font-semibold text-foreground">{lecturerName}</p>
            ) : null}
            {scopeLabel ? <p className="truncate text-xs text-muted-foreground">{scopeLabel}</p> : null}
          </div>
          {paid ? (
            <div className="inline-flex shrink-0 items-center gap-1 rounded-full bg-success/10 px-2.5 py-1 text-xs font-semibold text-success">
              <CheckCircle2 className="size-3.5" />
              Received
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
        <div>
          <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
            Completed Classes
          </p>
          <p className="mt-1 text-3xl font-bold tabular-nums text-foreground">{completed}</p>
        </div>
        <div>
          <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
            Class Progress
          </p>
          <p className={cn('mt-1 text-sm font-medium', paid ? 'text-success' : 'text-foreground')}>
            {paid ? 'Complete' : `${completed} / ${target || '-'}`}
          </p>
          <Progress
            value={progressValue}
            className={cn('mt-1.5 h-1.5', paid && '[&_[data-slot=progress-indicator]]:bg-success')}
          />
        </div>
        <div>
          <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
            {paid ? 'Received Payment' : 'Current Payment'}
          </p>
          <p className={cn('mt-1 text-3xl font-bold tabular-nums', paid ? 'text-success' : 'text-warning')}>
            {hasAmount ? formatCurrency(finalPayment, currency) : '-'}
          </p>
          {paid ? (
            <p className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-success">
              <CheckCircle2 className="size-3.5" />
              Payment closed for this month
            </p>
          ) : null}
        </div>
        <div>
          <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
            Monthly Payment
          </p>
          <p className="mt-1 text-sm font-medium text-foreground">
            {hasAmount ? formatCurrency(amount.monthlyAmount, currency) : '-'}
          </p>
        </div>
      </div>
    </div>
  )
}
