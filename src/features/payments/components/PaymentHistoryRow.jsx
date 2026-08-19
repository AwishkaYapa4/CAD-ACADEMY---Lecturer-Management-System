import { useState } from 'react'
import { format } from 'date-fns'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { StatusPill } from '@/components/common/StatusPill'
import { PAYMENT_CYCLE_STATUS } from '@/constants/statuses'
import { toDate } from '@/utils/formatters'
import { monthKeyLabel } from '@/features/payments/utils/monthlyCalc'
import { usePaymentAmount } from '@/features/payments/hooks/usePayments'
import { MarkAsPaidDialog } from '@/features/payments/components/MarkAsPaidDialog'
import { AdjustPaymentDialog } from '@/features/payments/components/AdjustPaymentDialog'

/** One approved/paid payment record. Mirrors PaymentReadinessRow's card layout for visual consistency. */
export function PaymentHistoryRow({ payment, lecturer, course, batch, showAmount, canManage }) {
  const { data: amount } = usePaymentAmount(payment.id, showAmount)
  const [markPaidOpen, setMarkPaidOpen] = useState(false)
  const [adjustOpen, setAdjustOpen] = useState(false)

  const scopeLabel = [course?.name, batch?.batchCode].filter(Boolean).join(' · ')
  const dateLabel = toDate(payment.paidAt ?? payment.approvedAt ?? payment.createdAt)

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <p className="font-medium text-foreground">{lecturer?.fullName ?? 'Unknown lecturer'}</p>
            <StatusPill status={payment.status} />
          </div>
          {scopeLabel ? <p className="text-xs text-muted-foreground">{scopeLabel}</p> : null}
          <p className="text-sm text-muted-foreground">
            {payment.periodMonth ? `${monthKeyLabel(payment.periodMonth)} · ` : null}
            {payment.completedClassCount} of{' '}
            {showAmount && amount?.monthlyClassCount
              ? amount.monthlyClassCount
              : (payment.totalScheduledCount ?? payment.completedClassCount)}{' '}
            {showAmount && amount?.monthlyClassCount ? 'configured' : 'scheduled'} classes
            {dateLabel ? ` · ${format(dateLabel, 'MMM d, yyyy')}` : null}
            {payment.paymentReference ? ` · Ref: ${payment.paymentReference}` : null}
          </p>
          {showAmount && amount ? (
            <div className="space-y-1 text-sm font-medium">
              <p className="text-foreground">
                Total payment: {amount.currency} {amount.totalAmount?.toFixed(2)}
              </p>
              {amount.extraClassCount > 0 ? (
                <p className="text-warning">
                  Extra class payment: {amount.extraClassCount} classes - {amount.currency} {amount.extraAmount?.toFixed(2)}
                </p>
              ) : null}
            </div>
          ) : null}
          {payment.adjustmentReason ? (
            <p className="text-xs text-muted-foreground">Adjusted: {payment.adjustmentReason}</p>
          ) : null}
        </div>

        {canManage ? (
          <div className="flex shrink-0 gap-2">
            {payment.status === PAYMENT_CYCLE_STATUS.APPROVED ? (
              <Button size="sm" onClick={() => setMarkPaidOpen(true)}>
                Mark as Paid
              </Button>
            ) : null}
            <Button size="sm" variant="outline" onClick={() => setAdjustOpen(true)}>
              Adjust
            </Button>
          </div>
        ) : null}
      </CardContent>

      {canManage ? (
        <>
          <MarkAsPaidDialog
            open={markPaidOpen}
            onOpenChange={setMarkPaidOpen}
            payment={payment}
            lecturer={lecturer}
          />
          <AdjustPaymentDialog
            open={adjustOpen}
            onOpenChange={setAdjustOpen}
            payment={payment}
            lecturer={lecturer}
            currentAmount={amount?.totalAmount}
          />
        </>
      ) : null}
    </Card>
  )
}
