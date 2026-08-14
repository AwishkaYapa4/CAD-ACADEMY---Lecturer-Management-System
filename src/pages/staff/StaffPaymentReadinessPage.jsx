import { PageHeader } from '@/components/common/PageHeader'
import { PaymentHistoryList } from '@/features/payments/components/PaymentHistoryList'
import { PaymentReadinessList } from '@/features/payments/components/PaymentReadinessList'

export default function StaffPaymentReadinessPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Payment Readiness"
        description="Lecturers who've reached their payment rule's target, and their calculated payment amount."
      />

      <PaymentReadinessList showAmount canApprove={false} />

      <div className="space-y-4">
        <h2 className="text-sm font-medium text-muted-foreground">Payment history</h2>
        <PaymentHistoryList showAmount canManage={false} />
      </div>
    </div>
  )
}
