import { useNavigate } from 'react-router-dom'
import { ChevronDown, TrendingUp } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { monthKeyFor, monthKeyLabel } from '@/features/payments/utils/monthlyCalc'

/**
 * Small decorative "Monthly Overview" panel pinned under the nav links in
 * the sidebar (Admin/Staff only — see DashboardLayout) — mirrors the
 * reference dashboard mockup's bottom-left widget. Deliberately lightweight:
 * the month shown is just the current month label (not an interactive
 * picker; per-page month selection already exists on the dashboards/Payment
 * Readiness page), the bars are a static decorative illustration, and "View
 * Full Report" is the only real action, linking to the full Payment
 * Readiness page for the given role.
 */
export function MonthlyOverviewWidget({ viewAllHref, description = 'Track all lecturer payments and class completions.' }) {
  const navigate = useNavigate()
  const monthLabel = monthKeyLabel(monthKeyFor())

  return (
    <div className="rounded-2xl border border-sidebar-border bg-sidebar-accent/40 p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-sidebar-foreground">Monthly Overview</p>
        <TrendingUp className="size-4 text-sidebar-primary" />
      </div>

      <div className="mt-2 flex items-center gap-1 text-xs font-medium text-sidebar-foreground/70">
        {monthLabel}
        <ChevronDown className="size-3.5" />
      </div>

      <p className="mt-3 text-xs leading-relaxed text-sidebar-foreground/55">{description}</p>

      <div className="mt-4 flex h-12 items-end gap-1.5" aria-hidden="true">
        {[40, 65, 45, 80, 55, 95, 70].map((height, i) => (
          <div
            key={i}
            className="flex-1 rounded-sm bg-sidebar-primary/70 first:bg-sidebar-primary/30 last:bg-sidebar-primary"
            style={{ height: `${height}%` }}
          />
        ))}
      </div>

      {viewAllHref ? (
        <Button
          size="sm"
          className="mt-4 w-full bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/85"
          onClick={() => navigate(viewAllHref)}
        >
          View Full Report
        </Button>
      ) : null}
    </div>
  )
}
