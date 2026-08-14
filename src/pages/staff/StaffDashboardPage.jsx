import { PageHeader } from '@/components/common/PageHeader'
import { ROUTES } from '@/constants/routes'
import { LecturerPaymentHighlights } from '@/features/payments/components/LecturerPaymentHighlights'
import { useAuth } from '@/hooks/useAuth'

/**
 * Deliberately minimal (2026-08-10 "simplify" spec) — same content as the
 * Admin dashboard (Staff sees the identical calculated payment figure, per
 * explicit "Admin, Staff, and Lecturer dashboards must all show the correct
 * monthly payment amount using the same payment calculation data"), minus
 * Admin-only actions. Everything else that used to live here (stat cards,
 * today's schedule, recently submitted reports) was removed per explicit
 * instruction; those views are still reachable from the sidebar.
 */
export default function StaffDashboardPage() {
  const { profile } = useAuth()

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome back, ${profile?.fullName?.split(' ')[0] ?? 'there'}`}
        description="Every lecturer's completed classes and calculated payment for the current month."
      />

      <LecturerPaymentHighlights
        title="Lecturer Payments"
        viewAllHref={ROUTES.STAFF_PAYMENT_READINESS}
        viewAllLabel="View payment readiness"
      />
    </div>
  )
}
