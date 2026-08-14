import { GraduationCap, Hourglass, Users, Wallet } from 'lucide-react'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatCurrency } from '@/features/payments/utils/monthlyCalc'
import { cn } from '@/lib/utils'

function Stat({ icon: Icon, value, label, loading }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white/15">
        <Icon className="size-4.5" />
      </div>
      <div className="min-w-0 leading-tight">
        <p className="text-lg font-bold tabular-nums">{loading ? '—' : value}</p>
        <p className="text-xs text-white/70">{label}</p>
      </div>
    </div>
  )
}

/**
 * Hero banner at the top of the Admin dashboard — greeting + a red/black
 * brand gradient (see .bg-brand-gradient in index.css) with four at-a-glance
 * stats and a month picker, mirroring the reference mockup's welcome card.
 */
export function DashboardWelcomeBanner({
  name,
  monthKey,
  onMonthChange,
  totalLecturers,
  classesCompleted,
  totalPending,
  totalReceived,
  currency,
  loading,
  className,
}) {
  return (
    <div className={cn('relative overflow-hidden rounded-2xl bg-brand-gradient p-6 text-white sm:p-8', className)}>
      {/* Decorative overlay rings — purely visual, evokes CAD/mechanical drafting without a real photo asset. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 right-[-4rem] size-64 -translate-y-1/2 rounded-full border-[16px] border-white/10"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 right-6 size-28 -translate-y-1/2 rounded-full border-8 border-white/10"
      />

      <div className="relative flex flex-col gap-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div className="space-y-1.5">
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Welcome back, {name} 👋</h1>
            <p className="max-w-md text-sm text-white/75">
              Here&apos;s what&apos;s happening with lecturer payments this month.
            </p>
          </div>

          {onMonthChange ? (
            <div className="space-y-1">
              <Label htmlFor="dashboard-month" className="text-xs text-white/70">
                Month
              </Label>
              <Input
                id="dashboard-month"
                type="month"
                value={monthKey}
                onChange={(e) => onMonthChange(e.target.value)}
                className="w-40 border-white/25 bg-white/10 text-white [color-scheme:dark] placeholder:text-white/60"
              />
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-x-8 gap-y-4">
          <Stat icon={Users} value={totalLecturers} label="Total Lecturers" loading={loading} />
          <Stat icon={GraduationCap} value={classesCompleted} label="Classes Completed" loading={loading} />
          <Stat
            icon={Hourglass}
            value={formatCurrency(totalPending, currency)}
            label="Total Pending"
            loading={loading}
          />
          <Stat
            icon={Wallet}
            value={formatCurrency(totalReceived, currency)}
            label="Total Received"
            loading={loading}
          />
        </div>
      </div>
    </div>
  )
}
