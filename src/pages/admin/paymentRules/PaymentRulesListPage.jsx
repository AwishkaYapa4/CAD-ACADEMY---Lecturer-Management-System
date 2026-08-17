import { useMemo, useState } from 'react'
import { MoreHorizontal, Plus } from 'lucide-react'
import toast from 'react-hot-toast'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { DataTable } from '@/components/common/DataTable'
import { PageHeader } from '@/components/common/PageHeader'
import { StatusBadge } from '@/components/common/StatusBadge'
import { useBatches } from '@/features/batches/hooks/useBatches'
import { useCourses } from '@/features/courses/hooks/useCourses'
import { useLecturers } from '@/features/lecturers/hooks/useLecturers'
import { PaymentRuleFormDialog } from '@/features/paymentRules/components/PaymentRuleFormDialog'
import {
  usePaymentRuleAmount,
  usePaymentRules,
  useSetPaymentRuleActive,
} from '@/features/paymentRules/hooks/usePaymentRules'
import { monthKeyLabel } from '@/features/payments/utils/monthlyCalc'

/** Amount lives in an Admin-only private subcollection — fetched per row rather than bulk-loaded. */
function MonthlyAmountCell({ ruleId }) {
  const { data: amount, loading } = usePaymentRuleAmount(ruleId)
  if (loading) return <span className="text-muted-foreground">…</span>
  if (!amount) return '—'
  return `${amount.currency} ${amount.monthlyAmount?.toFixed(2)} / mo`
}

export default function PaymentRulesListPage() {
  const { data: rules, loading } = usePaymentRules()
  const { data: lecturers } = useLecturers()
  const { data: courses } = useCourses()
  const { data: batches } = useBatches()
  const setActive = useSetPaymentRuleActive()

  const [formState, setFormState] = useState({ open: false, rule: null })
  const [activeTarget, setActiveTarget] = useState(null)

  const lecturerById = useMemo(
    () => Object.fromEntries(lecturers.map((l) => [l.id, l])),
    [lecturers]
  )
  const courseById = useMemo(() => Object.fromEntries(courses.map((c) => [c.id, c])), [courses])
  const batchById = useMemo(() => Object.fromEntries(batches.map((b) => [b.id, b])), [batches])

  const columns = [
    {
      key: 'lecturer',
      header: 'Lecturer',
      render: (row) => lecturerById[row.lecturerId]?.fullName ?? '—',
    },
    {
      key: 'course',
      header: 'Course',
      render: (row) => (row.courseId ? courseById[row.courseId]?.name ?? '—' : 'All courses'),
    },
    {
      key: 'batch',
      header: 'Batch',
      render: (row) => (row.batchId ? batchById[row.batchId]?.batchCode ?? '—' : 'All batches'),
    },
    {
      key: 'periodMonth',
      header: 'Month',
      render: (row) => (row.periodMonth ? monthKeyLabel(row.periodMonth) : 'All months'),
    },
    {
      key: 'amount',
      header: 'Monthly payment',
      render: (row) => <MonthlyAmountCell ruleId={row.id} />,
    },
    { key: 'notes', header: 'Notes', render: (row) => row.notes || '—' },
    {
      key: 'active',
      header: 'Status',
      render: (row) => (
        <StatusBadge tone={row.active === false ? 'muted' : 'success'}>
          {row.active === false ? 'Disabled' : 'Active'}
        </StatusBadge>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (row) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm">
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setFormState({ open: true, rule: row })}>
              Edit
            </DropdownMenuItem>
            {row.active === false ? (
              <DropdownMenuItem onClick={() => setActiveTarget(row)}>Enable</DropdownMenuItem>
            ) : (
              <DropdownMenuItem variant="destructive" onClick={() => setActiveTarget(row)}>
                Disable
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]

  const handleConfirmActiveChange = async () => {
    if (!activeTarget) return
    const nextActive = activeTarget.active === false
    try {
      await setActive.mutateAsync({ ruleId: activeTarget.id, active: nextActive })
      toast.success(nextActive ? 'Rule enabled' : 'Rule disabled')
      setActiveTarget(null)
    } catch {
      toast.error('Failed to update rule')
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payment Rules"
        description="Assign each lecturer a fixed monthly payment per course, prorated by completed classes."
        actions={
          <Button onClick={() => setFormState({ open: true, rule: null })}>
            <Plus className="size-4" /> Add Rule
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={rules}
        loading={loading}
        emptyTitle="No payment rules yet"
        emptyDescription="Add a rule to start tracking a lecturer's payment readiness."
      />

      <PaymentRuleFormDialog
        key={formState.rule?.id ?? 'create'}
        open={formState.open}
        onOpenChange={(open) => setFormState({ open, rule: open ? formState.rule : null })}
        rule={formState.rule}
      />

      <ConfirmDialog
        open={Boolean(activeTarget)}
        onOpenChange={(open) => !open && setActiveTarget(null)}
        title={activeTarget?.active === false ? 'Enable this rule?' : 'Disable this rule?'}
        description="This changes how this lecturer's payment readiness is calculated going forward."
        confirmLabel={activeTarget?.active === false ? 'Enable' : 'Disable'}
        destructive={activeTarget?.active !== false}
        loading={setActive.isPending}
        onConfirm={handleConfirmActiveChange}
      />
    </div>
  )
}
