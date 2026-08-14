import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/hooks/useAuth'
import { useApprovePayment, useMarkPaymentPaid } from '@/features/payments/hooks/usePayments'
import { monthKeyLabel } from '@/features/payments/utils/monthlyCalc'

/** Single-step payment: locks the counted reports, creates the payment doc, and marks it paid — all in one action. */
export function PayNowDialog({
  open,
  onOpenChange,
  rule,
  lecturer,
  monthKey,
  totalScheduled,
  completed,
  completedSchedules,
  monthlyClassCount,
  monthlyAmount,
  rate,
  totalAmount,
  currency,
}) {
  const { profile } = useAuth()
  const approvePayment = useApprovePayment()
  const markPaid = useMarkPaymentPaid()
  const [paymentReference, setPaymentReference] = useState('')
  const [officeNote, setOfficeNote] = useState('')

  const isPending = approvePayment.isPending || markPaid.isPending

  const handleConfirm = async () => {
    try {
      const paymentId = await approvePayment.mutateAsync({
        lecturerId: rule.lecturerId,
        courseId: rule.courseId,
        batchId: rule.batchId,
        paymentRuleId: rule.id,
        periodMonth: monthKey,
        completedSchedules,
        totalScheduledCount: totalScheduled,
        monthlyClassCount,
        monthlyAmount,
        rate,
        totalAmount,
        currency,
        approvedBy: profile?.fullName ?? profile?.email ?? '',
      })
      await markPaid.mutateAsync({ paymentId, data: { paymentReference, officeNote } })
      toast.success(`Payment done for ${lecturer?.fullName ?? 'lecturer'}`)
      onOpenChange(false)
      setPaymentReference('')
      setOfficeNote('')
    } catch {
      toast.error('Failed to complete payment')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Pay {lecturer?.fullName}?</DialogTitle>
          <DialogDescription>
            {monthKeyLabel(monthKey)} · {completed} of {monthlyClassCount} configured classes
            completed · {currency} {totalAmount?.toFixed(2)}. These classes will be locked from
            any future payment cycle and the payment will be marked as paid immediately.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Payment reference</Label>
            <Input
              placeholder="Bank transfer ref, cheque no., etc."
              value={paymentReference}
              onChange={(e) => setPaymentReference(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Office note (optional)</Label>
            <Textarea rows={2} value={officeNote} onChange={(e) => setOfficeNote(e.target.value)} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={isPending}>
            {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
            Pay Now
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
