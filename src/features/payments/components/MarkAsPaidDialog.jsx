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
import { useMarkPaymentPaid } from '@/features/payments/hooks/usePayments'

/** Second lifecycle step — an already-approved payment gets its transfer details recorded. */
export function MarkAsPaidDialog({ open, onOpenChange, payment, lecturer }) {
  const markPaid = useMarkPaymentPaid()
  const [paymentReference, setPaymentReference] = useState('')
  const [officeNote, setOfficeNote] = useState('')

  const handleConfirm = async () => {
    try {
      await markPaid.mutateAsync({
        paymentId: payment.id,
        data: { paymentReference, officeNote },
      })
      toast.success(`${lecturer?.fullName ?? 'Lecturer'} marked as paid`)
      onOpenChange(false)
      setPaymentReference('')
      setOfficeNote('')
    } catch {
      toast.error('Failed to mark as paid')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Mark {lecturer?.fullName} as paid?</DialogTitle>
          <DialogDescription>{payment?.completedClassCount} completed classes</DialogDescription>
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
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={markPaid.isPending}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={markPaid.isPending}>
            {markPaid.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
            Confirm Paid
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
