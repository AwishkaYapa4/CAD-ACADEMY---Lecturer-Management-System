import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { format } from 'date-fns'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useBatches, useLecturerBatches } from '@/features/batches/hooks/useBatches'
import { useCreateSchedule, useUpdateSchedule } from '@/features/schedules/hooks/useSchedules'
import { toDate } from '@/utils/formatters'

const scheduleSchema = z.object({
  batchId: z.string().min(1, 'Select a batch'),
  classDate: z.string().min(1, 'Class date is required'),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
  locationType: z.enum(['physical', 'online']),
  location: z.string().optional(),
  zoomLink: z.string().optional(),
})

function toDateInputValue(value) {
  const date = toDate(value)
  return date ? format(date, 'yyyy-MM-dd') : ''
}

/**
 * Render with `key={schedule?.id ?? 'create'}` from the parent when switching between modes.
 * Pass `lecturerId` when rendering this for a lecturer (not Admin) to restrict the batch
 * picker to batches already assigned to them — matches the create rule in firestore.rules.
 * Uses the lecturer-constrained query (not a client-side filter of the full collection)
 * because firestore.rules' `batches` read rule depends on resource.data.lecturerId, which
 * Firestore rejects entirely for an unconstrained list query from a non-staff/admin caller.
 *
 * Pass `onSuccess` (e.g. the `refetch` from useFirestoreCollection) to force the caller's
 * schedule list to refresh right after a create/update — the live onSnapshot listener
 * usually covers this on its own, but doesn't always (see config/firebase.js), so this is
 * what makes a newly-added class show up immediately instead of only after a page reload.
 */
export function ScheduleFormDialog({ open, onOpenChange, schedule, lecturerId, onSuccess }) {
  const isEdit = Boolean(schedule)
  const { data: allBatches } = useBatches()
  const { data: ownBatches } = useLecturerBatches(lecturerId)
  const batches = lecturerId ? ownBatches : allBatches
  const createSchedule = useCreateSchedule()
  const updateSchedule = useUpdateSchedule()
  const submitting = createSchedule.isPending || updateSchedule.isPending

  const form = useForm({
    resolver: zodResolver(scheduleSchema),
    defaultValues: {
      batchId: schedule?.batchId ?? '',
      classDate: toDateInputValue(schedule?.classDate),
      startTime: schedule?.startTime ?? '',
      endTime: schedule?.endTime ?? '',
      locationType: schedule?.locationType ?? 'online',
      location: schedule?.location ?? '',
      zoomLink: schedule?.zoomLink ?? '',
    },
  })

  const locationType = useWatch({ control: form.control, name: 'locationType' })

  const onSubmit = async (values) => {
    try {
      if (isEdit) {
        await updateSchedule.mutateAsync({ scheduleId: schedule.id, data: values })
        toast.success('Schedule updated')
      } else {
        const batch = batches.find((b) => b.id === values.batchId)
        if (!batch) {
          toast.error('Selected batch not found')
          return
        }
        await createSchedule.mutateAsync({
          ...values,
          courseId: batch.courseId,
          lecturerId: batch.lecturerId,
        })
        toast.success('Class scheduled')
      }
      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      toast.error(error.message || 'Something went wrong. Please try again.')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit schedule' : 'Schedule a class'}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Update this class's date, time, or location." : 'Pick a batch and set the class date and time.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="batchId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Batch</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange} disabled={isEdit}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select batch" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {batches.map((batch) => (
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

            <div className="grid gap-4 sm:grid-cols-3">
              <FormField
                control={form.control}
                name="classDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="locationType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location type</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="physical">Physical</SelectItem>
                      <SelectItem value="online">Online</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {locationType === 'online' ? (
              <FormField
                control={form.control}
                name="zoomLink"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Zoom / meeting link</FormLabel>
                    <FormControl>
                      <Input placeholder="https://zoom.us/j/..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : (
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input placeholder="Room 204, Main Building" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
                {isEdit ? 'Save changes' : 'Schedule class'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
