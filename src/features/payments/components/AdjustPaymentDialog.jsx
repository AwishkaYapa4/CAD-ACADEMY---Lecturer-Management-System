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
import { useAdjustPayment } from '@/features/payments/hooks/usePayments'

/**
 * Admin-only manual correction — amount/reference/note only, never which
 * classes are included. Always requires a reason (enforced again in
 * adjustPayment() itself, not just here).
 */
export function AdjustPaymentDialog({ open, onOpenChange, payment, lecturer, currentAmount }) {
  const { profile } = useAuth()
  const adjustPayment = useAdjustPayment()
  const [totalAmount, setTotalAmount] = useState('')
  const [reason, setReason] = useState('')

  const handleConfirm = async () => {
    if (!reason.trim()) {
      toast.error('A reason is required to adjust a payment.')
      return
    }
    try {
      await adjustPayment.mutateAsync({
        paymentId: payment.id,
        data: {
          reason,
          totalAmount: totalAmount === '' ? undefined : Number(totalAmount),
          adjustedBy: profile?.fullName ?? profile?.email ?? '',
        },
      })
      toast.success(`Payment adjusted for ${lecturer?.fullName ?? 'lecturer'}`)
      onOpenChange(false)
      setTotalAmount('')
      setReason('')
    } catch (error) {
      toast.error(error.message || 'Failed to adjust payment')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Adjust payment for {lecturer?.fullName}?</DialogTitle>
          <DialogDescription>
            Corrects the amount or notes on this payment — the included classes stay the same.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>New total amount (optional)</Label>
            <Input
              type="number"
              min={0}
              step="0.01"
              placeholder={currentAmount != null ? currentAmount.toFixed(2) : 'Leave blank to keep as-is'}
              value={totalAmount}
              onChange={(e) => setTotalAmount(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Reason (required)</Label>
            <Textarea
              rows={2}
              placeholder="Why is this payment being adjusted?"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={adjustPayment.isPending}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={adjustPayment.isPending}>
            {adjustPayment.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
            Save Adjustment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
