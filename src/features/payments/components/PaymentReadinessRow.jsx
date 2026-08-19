import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { StatusBadge } from '@/components/common/StatusBadge'
import { usePaymentRuleAmount } from '@/features/paymentRules/hooks/usePaymentRules'
import { PayNowDialog } from '@/features/payments/components/PayNowDialog'
import { calculateMonthlyPayment, monthKeyLabel } from '@/features/payments/utils/monthlyCalc'
import { cn } from '@/lib/utils'

/**
 * One lecturer's monthly payment progress for a single rule (lecturer +
 * course, optionally + batch). Admin, Staff, and the owning Lecturer all see
 * the same calculated payment figure now (2026-08-10).
 */
export function PaymentReadinessRow({
  rule,
  lecturer,
  course,
  batch,
  monthKey,
  totalScheduled,
  completed,
  completedSchedules,
  isReady,
  showAmount,
  canApprove,
}) {
  const { data: amount } = usePaymentRuleAmount(rule.id, showAmount)
  const [confirmOpen, setConfirmOpen] = useState(false)

  const {
    paymentPerClass,
    finalPayment,
    regularClassCount,
    regularPayment,
    extraClassCount,
    extraPayment,
  } = calculateMonthlyPayment({
    monthlyAmount: amount?.monthlyAmount,
    monthlyClassCount: rule.monthlyClassCount,
    completed,
  })

  const scopeLabel = [course?.name, batch?.batchCode].filter(Boolean).join(' - ')
  const targetCompleted = Number(rule.monthlyClassCount) > 0 && completed >= Number(rule.monthlyClassCount)

  return (
    <Card className={cn(targetCompleted && 'border-success/40 bg-success/5 ring-1 ring-success/20')}>
      <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <p className="font-medium text-foreground">{lecturer?.fullName ?? 'Unknown lecturer'}</p>
            <StatusBadge tone={isReady ? 'success' : 'muted'}>
              {targetCompleted ? 'Classes complete' : isReady ? 'Ready' : 'Not ready'}
            </StatusBadge>
          </div>
          {scopeLabel ? <p className="text-xs text-muted-foreground">{scopeLabel}</p> : null}
          <p className="text-sm text-muted-foreground">
            {monthKeyLabel(monthKey)} - {completed} of {rule.monthlyClassCount} configured classes
            completed
            {totalScheduled > 0 ? ` (${totalScheduled} scheduled this month)` : null}
          </p>
          {showAmount && amount ? (
            <div className="grid gap-2 text-sm sm:grid-cols-3">
              <div className="rounded-lg border border-border bg-background px-3 py-2">
                <p className="text-[11px] font-medium uppercase text-muted-foreground">Monthly payment</p>
                <p className="mt-0.5 font-semibold text-foreground">
                  {amount.currency} {regularPayment.toFixed(2)}
                </p>
                {rule.monthlyClassCount > 0 ? (
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {regularClassCount} x {amount.currency} {paymentPerClass.toFixed(2)}
                  </p>
                ) : null}
              </div>
              {extraClassCount > 0 ? (
                <div className="rounded-lg border border-warning/25 bg-warning/10 px-3 py-2">
                  <p className="text-[11px] font-medium uppercase text-warning">Extra class payment</p>
                  <p className="mt-0.5 font-semibold text-warning">
                    {amount.currency} {extraPayment.toFixed(2)}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {extraClassCount} x {amount.currency} {paymentPerClass.toFixed(2)}
                  </p>
                </div>
              ) : null}
              <div className="rounded-lg border border-border bg-background px-3 py-2">
                <p className="text-[11px] font-medium uppercase text-muted-foreground">Total payable</p>
                <p className="mt-0.5 font-semibold text-foreground">
                  {amount.currency} {finalPayment.toFixed(2)}
                </p>
              </div>
            </div>
          ) : null}
        </div>

        {canApprove && isReady ? (
          <Button
            className={cn(targetCompleted && 'bg-success text-success-foreground hover:bg-success/90')}
            onClick={() => setConfirmOpen(true)}
          >
            Pay Now
          </Button>
        ) : null}
      </CardContent>

      {canApprove ? (
        <PayNowDialog
          open={confirmOpen}
          onOpenChange={setConfirmOpen}
          rule={rule}
          lecturer={lecturer}
          monthKey={monthKey}
          totalScheduled={totalScheduled}
          completed={completed}
          completedSchedules={completedSchedules ?? []}
          monthlyClassCount={rule.monthlyClassCount}
          monthlyAmount={amount?.monthlyAmount ?? 0}
          rate={paymentPerClass}
          regularClassCount={regularClassCount}
          regularAmount={regularPayment}
          extraClassCount={extraClassCount}
          extraAmount={extraPayment}
          totalAmount={finalPayment}
          currency={amount?.currency ?? 'LKR'}
        />
      ) : null}
    </Card>
  )
}
