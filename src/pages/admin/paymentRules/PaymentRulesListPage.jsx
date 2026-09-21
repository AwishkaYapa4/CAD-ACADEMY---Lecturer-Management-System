import { useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import toast from 'react-hot-toast'

import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { DataTable } from '@/components/common/DataTable'
import { PageHeader } from '@/components/common/PageHeader'
import { StatusBadge } from '@/components/common/StatusBadge'
import { useBatches } from '@/features/batches/hooks/useBatches'
import { deriveBatchStatus } from '@/features/batches/services/batchService'
import { useCourses } from '@/features/courses/hooks/useCourses'
import { useLecturers } from '@/features/lecturers/hooks/useLecturers'
import { PaymentRuleFormDialog } from '@/features/paymentRules/components/PaymentRuleFormDialog'
import {
  useDeletePaymentRule,
  usePaymentRuleAmount,
  usePaymentRules,
  useSetPaymentRuleActive,
} from '@/features/paymentRules/hooks/usePaymentRules'
import { BATCH_STATUS } from '@/constants/statuses'

/** Amount lives in an Admin-only private subcollection — fetched per row rather than bulk-loaded. */
function MonthlyAmountCell({ ruleId }) {
  const { data: amount, loading } = usePaymentRuleAmount(ruleId)
  if (loading) return <span className="text-muted-foreground">…</span>
  if (!amount) return '—'
  return `${amount.currency} ${amount.monthlyAmount?.toFixed(2)} / mo`
}

// A batch is "ended" once all its planned classes are completed — same
// completion rule the lecturer dashboard uses (deriveBatchStatus), not the
// batch's endDate, since a batch can wrap up early or run past its planned
// end date. Once a batch is done, its payment rule stops applying.
function isBatchEnded(batch) {
  if (!batch) return false
  return deriveBatchStatus(batch) === BATCH_STATUS.COMPLETED
}

export default function PaymentRulesListPage() {
  const { data: rules, loading } = usePaymentRules()
  const { data: lecturers } = useLecturers()
  const { data: courses } = useCourses()
  const { data: batches } = useBatches()
  const setActive = useSetPaymentRuleActive()
  const deleteRule = useDeletePaymentRule()

  const [formState, setFormState] = useState({ open: false, rule: null })
  const [activeTarget, setActiveTarget] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const lecturerById = useMemo(
    () => Object.fromEntries(lecturers.map((l) => [l.id, l])),
    [lecturers]
  )
  const courseById = useMemo(() => Object.fromEntries(courses.map((c) => [c.id, c])), [courses])
  const batchById = useMemo(() => Object.fromEntries(batches.map((b) => [b.id, b])), [batches])
  const statusForRule = (rule) => {
    if (rule.active === false) return { label: 'Disabled', tone: 'muted' }
    if (rule.batchId && isBatchEnded(batchById[rule.batchId])) return { label: 'Batch ended', tone: 'muted' }
    return { label: 'Active', tone: 'success' }
  }

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
      key: 'period',
      header: 'Rule period',
      render: (row) => (row.periodMonth ? row.periodMonth : 'Until batch ends'),
    },
    {
      key: 'monthlyClassCount',
      header: 'Classes / month',
      render: (row) => row.monthlyClassCount ?? 'â€”',
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
      render: (row) => {
        const status = statusForRule(row)
        return <StatusBadge tone={status.tone}>{status.label}</StatusBadge>
      },
    },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (row) => {
        const batchEnded = row.batchId && isBatchEnded(batchById[row.batchId])
        return (
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setFormState({ open: true, rule: row })}>
              Edit
            </Button>
            <Button
              variant={row.active === false ? 'default' : 'destructive'}
              size="sm"
              disabled={batchEnded}
              onClick={() => setActiveTarget(row)}
            >
              {row.active === false ? 'Enable' : 'Disable'}
            </Button>
            <Button variant="destructive" size="sm" onClick={() => setDeleteTarget(row)}>
              Delete
            </Button>
          </div>
        )
      },
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

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return
    try {
      await deleteRule.mutateAsync(deleteTarget.id)
      toast.success('Rule deleted')
      setDeleteTarget(null)
    } catch (error) {
      toast.error(error.message || 'Failed to delete rule')
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

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete this rule?"
        description="This payment rule and its saved monthly amount will be permanently deleted."
        confirmLabel="Delete"
        destructive
        loading={deleteRule.isPending}
        onConfirm={handleConfirmDelete}
      />
    </div>
  )
}
