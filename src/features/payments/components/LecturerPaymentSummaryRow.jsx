import { Progress } from '@/components/ui/progress'
import { formatCurrency } from '@/features/payments/utils/monthlyCalc'

/**
 * One lecturer/rule's monthly payment card — the entire dashboard content
 * per the 2026-08-10 "simplify" spec, which names exactly six fields and
 * nothing else: Month, Lecturer, Completed Classes, Class Progress, Current
 * Payment, and Monthly Payment. Completed Classes and Current Payment are
 * the two fields required to be the most visually prominent (large bold
 * numbers); Class Progress and Monthly Payment are supporting detail. Month
 * is shown once, above the whole list of rows, by the caller
 * (LecturerPaymentHighlights) rather than repeated per row — every row in a
 * given render shares the same selected month.
 *
 * No paid/pending badge here — the caller (LecturerPaymentHighlights) now
 * groups rows into separate "Pending Payment"/"Payment Received" sections
 * instead (2026-08-10, "show lecturers who have completed their payment
 * separately"), so which group a row is already in says that, without
 * repeating it inline on every card.
 *
 * Deliberately presentational (no data fetching, no Pay Now action) — this
 * is the at-a-glance dashboard version. The full interactive row with
 * approve/pay actions is PaymentReadinessRow on the dedicated Payment
 * Readiness pages; amounts are batch-fetched by the caller and passed in as
 * `amount`, not fetched here.
 */
export function LecturerPaymentSummaryRow({ lecturerName, scopeLabel, completed, target, amount, finalPayment }) {
  const percent = target > 0 ? Math.min(100, Math.round((completed / target) * 100)) : 0
  const currency = amount?.currency ?? ''
  const hasAmount = Boolean(amount)

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      {lecturerName || scopeLabel ? (
        <div className="mb-4 min-w-0">
          {lecturerName ? (
            <p className="truncate text-base font-semibold text-foreground">{lecturerName}</p>
          ) : null}
          {scopeLabel ? <p className="truncate text-xs text-muted-foreground">{scopeLabel}</p> : null}
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-x-6 gap-y-4">
        <div>
          <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
            Completed Classes
          </p>
          <p className="mt-1 text-3xl font-bold tabular-nums text-foreground">{completed}</p>
        </div>
        <div>
          <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
            Current Payment
          </p>
          <p className="mt-1 text-3xl font-bold tabular-nums text-accent">
            {hasAmount ? formatCurrency(finalPayment, currency) : '—'}
          </p>
        </div>
        <div>
          <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
            Class Progress
          </p>
          <p className="mt-1 text-sm font-medium text-foreground">
            {completed} / {target || '—'}
          </p>
          <Progress value={percent} className="mt-1.5 h-1.5" />
        </div>
        <div>
          <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
            Monthly Payment
          </p>
          <p className="mt-1 text-sm font-medium text-foreground">
            {hasAmount ? formatCurrency(amount.monthlyAmount, currency) : '—'}
          </p>
        </div>
      </div>
    </div>
  )
}
