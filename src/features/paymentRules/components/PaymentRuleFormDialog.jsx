import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useBatches } from '@/features/batches/hooks/useBatches'
import { useCourses } from '@/features/courses/hooks/useCourses'
import { useGeneralSettings } from '@/features/settings/hooks/useSettings'
import { useLecturers } from '@/features/lecturers/hooks/useLecturers'
import {
  useCreatePaymentRule,
  usePaymentRuleAmount,
  useUpdatePaymentRule,
} from '@/features/paymentRules/hooks/usePaymentRules'
import { monthKeyFor } from '@/features/payments/utils/monthlyCalc'

const NO_BATCH = 'none'

const ruleSchema = z.object({
  lecturerId: z.string().min(1, 'Lecturer is required'),
  courseId: z.string().min(1, 'Course is required'),
  batchId: z.string().optional(),
  periodMonth: z.string().regex(/^\d{4}-\d{2}$/, 'Payment month is required'),
  monthlyClassCount: z.coerce
    .number({ invalid_type_error: 'Monthly class count is required' })
    .int('Monthly class count must be a whole number')
    .positive('Monthly class count must be a positive number'),
  monthlyAmount: z.coerce
    .number({ invalid_type_error: 'Monthly payment is required' })
    .positive('Monthly payment must be a positive amount'),
  currency: z.string().min(1, 'Currency is required'),
  notes: z.string().optional(),
})

/** Render with `key={rule?.id ?? 'create'}` from the parent when switching between modes. */
export function PaymentRuleFormDialog({ open, onOpenChange, rule }) {
  const isEdit = Boolean(rule)
  const { data: lecturers } = useLecturers()
  const { data: courses } = useCourses()
  const { data: batches } = useBatches()
  const { data: settings } = useGeneralSettings()
  // Existing amount (Admin-only private subcollection) — only fetched in edit mode.
  const { data: existingAmount, loading: amountLoading } = usePaymentRuleAmount(rule?.id, isEdit)
  const createRule = useCreatePaymentRule()
  const updateRule = useUpdatePaymentRule()
  const submitting = createRule.isPending || updateRule.isPending

  const form = useForm({
    resolver: zodResolver(ruleSchema),
    defaultValues: {
      lecturerId: rule?.lecturerId ?? '',
      courseId: rule?.courseId ?? '',
      batchId: rule?.batchId ?? NO_BATCH,
      periodMonth: rule?.periodMonth ?? monthKeyFor(),
      monthlyClassCount: rule?.monthlyClassCount ?? undefined,
      monthlyAmount: existingAmount?.monthlyAmount ?? undefined,
      currency: existingAmount?.currency ?? settings?.defaultCurrency ?? 'LKR',
      notes: rule?.notes ?? '',
    },
  })

  // The amount lives in an Admin-only subcollection fetched separately from
  // the rule doc (see usePaymentRuleAmount) — it isn't known yet on first
  // render in edit mode, so backfill it into the form once it arrives rather
  // than trying to express it as a synchronous defaultValue.
  useEffect(() => {
    if (isEdit && !amountLoading && existingAmount) {
      form.resetField('monthlyAmount', { defaultValue: existingAmount.monthlyAmount })
      form.resetField('currency', { defaultValue: existingAmount.currency })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEdit, amountLoading, existingAmount])

  const lecturerId = form.watch('lecturerId')
  const courseId = form.watch('courseId')
  // A rule scoped to a batch only makes sense for a batch that's both this
  // lecturer's and this course's — matches how matchRule.js prioritizes it.
  const batchesForScope = batches.filter((b) => b.lecturerId === lecturerId && b.courseId === courseId)

  const onSubmit = async (values) => {
    try {
      const data = { ...values, batchId: values.batchId === NO_BATCH ? null : values.batchId }
      if (isEdit) {
        await updateRule.mutateAsync({ ruleId: rule.id, data })
        toast.success('Payment rule updated')
      } else {
        await createRule.mutateAsync(data)
        toast.success('Payment rule created')
      }
      onOpenChange(false)
    } catch (error) {
      toast.error(error.message || 'Something went wrong. Please try again.')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit payment rule' : 'Add payment rule'}</DialogTitle>
          <DialogDescription>
            Assign a lecturer a fixed monthly payment for a defined number of classes per month.
            Each month, the payment is prorated by how many of those classes they actually
            completed.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="lecturerId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Lecturer</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={(value) => {
                      field.onChange(value)
                      form.setValue('batchId', NO_BATCH)
                    }}
                    disabled={isEdit}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select lecturer" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {lecturers.map((lecturer) => (
                        <SelectItem key={lecturer.id} value={lecturer.id}>
                          {lecturer.fullName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="courseId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Course</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={(value) => {
                      field.onChange(value)
                      form.setValue('batchId', NO_BATCH)
                    }}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select course" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {courses.map((course) => (
                        <SelectItem key={course.id} value={course.id}>
                          {course.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="batchId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Batch</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange} disabled={!lecturerId || !courseId}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select lecturer and course first" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={NO_BATCH}>All batches (course-wide)</SelectItem>
                      {batchesForScope.map((batch) => (
                        <SelectItem key={batch.id} value={batch.id}>
                          {batch.batchCode}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="periodMonth"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Month</FormLabel>
                  <FormControl>
                    <Input type="month" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="monthlyClassCount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Monthly Class Count</FormLabel>
                  <FormControl>
                    <Input type="number" min={1} step="1" placeholder="e.g. 4" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-[1fr_auto] gap-3">
              <FormField
                control={form.control}
                name="monthlyAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Monthly payment</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} step="0.01" placeholder="e.g. 8000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Currency</FormLabel>
                    <FormControl>
                      <Input className="w-20" placeholder="LKR" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Monthly payment is based on the configured number of classes. If fewer classes are
              completed, the payment will be prorated based on completed classes.
            </p>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea rows={2} placeholder="Optional notes..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting || (isEdit && amountLoading)}>
                {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
                Save payment rule
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
