import { PageHeader } from '@/components/common/PageHeader'
import { LecturerPaymentHighlights } from '@/features/payments/components/LecturerPaymentHighlights'
import { useAuth } from '@/hooks/useAuth'

/**
 * Deliberately minimal (2026-08-10 "simplify" spec) — the lecturer's own
 * completed classes and calculated payment for the current month, and
 * nothing else. Everything else that used to live here (today's class,
 * stat cards, assigned batches, payment history, recent reports/materials)
 * was removed per explicit instruction ("focus ONLY on ... class completion
 * and payment for the relevant/current month"); those workflows are still
 * reachable from the sidebar (My Schedule, Class History, My Materials).
 * `showLecturerNames={false}` since every row here is already this
 * lecturer's own — repeating their name would be redundant.
 */
export default function LecturerDashboardPage() {
  const { profile } = useAuth()
  const lecturerId = profile?.lecturerId

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome back, ${profile?.fullName?.split(' ')[0] ?? 'there'}`}
        description="Your completed classes and calculated payment for the current month."
      />

      <LecturerPaymentHighlights
        lecturerId={lecturerId}
        showLecturerNames={false}
        title="My Monthly Payment"
      />
    </div>
  )
}
