import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { StatusBadge } from '@/components/common/StatusBadge'
import { usePaymentRuleAmount } from '@/features/paymentRules/hooks/usePaymentRules'
import { PayNowDialog } from '@/features/payments/components/PayNowDialog'
import { calculateMonthlyPayment, monthKeyLabel } from '@/features/payments/utils/monthlyCalc'

/**
 * One lecturer's monthly payment progress for a single rule (lecturer +
 * course, optionally + batch). Admin, Staff, and the owning Lecturer all see
 * the same calculated payment figure now (2026-08-10) — `showAmount` is true
 * everywhere this renders; `canApprove` is the only prop that actually
 * varies by role (Admin only), gating the Pay Now action, not visibility of
 * the amount itself. Every consumer renders this same component instead of
 * duplicating the calculation.
 *
 * `totalScheduled`/`completed`/`isReady` are computed by the caller (see
 * usePaymentReadinessSummary) since they depend on which schedules count
 * for this rule's scope in the selected month — this component only turns
 * those counts into a payment figure once it has the amount (fetched via
 * usePaymentRuleAmount, readable by all three roles per firestore.rules).
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

  const { paymentPerClass, finalPayment } = calculateMonthlyPayment({
    monthlyAmount: amount?.monthlyAmount,
    monthlyClassCount: rule.monthlyClassCount,
    completed,
  })

  const scopeLabel = [course?.name, batch?.batchCode].filter(Boolean).join(' · ')

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <p className="font-medium text-foreground">{lecturer?.fullName ?? 'Unknown lecturer'}</p>
            <StatusBadge tone={isReady ? 'success' : 'muted'}>
              {isReady ? 'Ready' : 'Not ready'}
            </StatusBadge>
          </div>
          {scopeLabel ? <p className="text-xs text-muted-foreground">{scopeLabel}</p> : null}
          <p className="text-sm text-muted-foreground">
            {monthKeyLabel(monthKey)} · {completed} of {rule.monthlyClassCount} configured classes
            completed
            {totalScheduled > 0 ? ` (${totalScheduled} scheduled this month)` : null}
          </p>
          {showAmount && amount ? (
            <p className="text-sm font-medium text-foreground">
              {amount.currency} {amount.monthlyAmount?.toFixed(2)} / mo
              {rule.monthlyClassCount > 0 ? ` · ${amount.currency} ${paymentPerClass.toFixed(2)} / class` : null}
              {completed > 0 ? ` · Final payment: ${amount.currency} ${finalPayment.toFixed(2)}` : null}
            </p>
          ) : null}
        </div>

        {canApprove && isReady ? (
          <Button onClick={() => setConfirmOpen(true)}>Pay Now</Button>
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
          totalAmount={finalPayment}
          currency={amount?.currency ?? 'LKR'}
        />
      ) : null}
    </Card>
  )
}
