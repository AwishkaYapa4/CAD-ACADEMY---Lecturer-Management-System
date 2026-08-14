import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { format } from 'date-fns'
import { ArrowLeft, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { EmptyState } from '@/components/common/EmptyState'
import { PageHeader } from '@/components/common/PageHeader'
import { ROUTES } from '@/constants/routes'
import { REPORT_STATUS, SCHEDULE_STATUS } from '@/constants/statuses'
import { useCourse } from '@/features/courses/hooks/useCourses'
import { useBatch } from '@/features/batches/hooks/useBatches'
import { useClassReport, useSaveReportDraft, useSubmitReport } from '@/features/classReports/hooks/useClassReports'
import { LectureMaterialUploadForm } from '@/features/materials/components/LectureMaterialUploadForm'
import { LectureMaterialsList } from '@/features/materials/components/LectureMaterialsList'
import { useCourseMaterials } from '@/features/materials/hooks/useLectureMaterials'
import { useSchedule } from '@/features/schedules/hooks/useSchedules'
import { useAuth } from '@/hooks/useAuth'
import { toDate } from '@/utils/formatters'

const reportSchema = z.object({
  actualStartTime: z.string().min(1, 'Required'),
  actualEndTime: z.string().min(1, 'Required'),
  topicCovered: z.string().min(2, 'Topic covered is required'),
  description: z.string().optional(),
  activitiesCompleted: z.string().optional(),
  homework: z.string().optional(),
  remarks: z.string().optional(),
})

export default function SubmitReportPage() {
  const { scheduleId } = useParams()
  const navigate = useNavigate()
  const { profile } = useAuth()

  const { data: schedule, loading: scheduleLoading } = useSchedule(scheduleId)
  const { data: report, loading: reportLoading } = useClassReport(scheduleId)
  const { data: courseMaterials, loading: courseMaterialsLoading } = useCourseMaterials(schedule?.courseId)
  const { data: course } = useCourse(schedule?.courseId)
  const { data: batch } = useBatch(schedule?.batchId)

  const saveDraft = useSaveReportDraft()
  const submitReport = useSubmitReport()
  const [submittingAction, setSubmittingAction] = useState(null)

  const form = useForm({
    resolver: zodResolver(reportSchema),
    values: {
      actualStartTime: report?.actualStartTime ?? schedule?.startTime ?? '',
      actualEndTime: report?.actualEndTime ?? schedule?.endTime ?? '',
      topicCovered: report?.topicCovered ?? '',
      description: report?.description ?? '',
      activitiesCompleted: report?.activitiesCompleted ?? '',
      homework: report?.homework ?? '',
      remarks: report?.remarks ?? '',
    },
  })

  if (scheduleLoading || reportLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (!schedule) {
    return (
      <EmptyState
        title="Class not found"
        description="This scheduled class may have been removed."
        action={
          <Button variant="outline" onClick={() => navigate(ROUTES.LECTURER_SCHEDULE)}>
            <ArrowLeft className="size-4" /> Back to schedule
          </Button>
        }
      />
    )
  }

  const isSubmitted = report?.status === REPORT_STATUS.SUBMITTED
  const isCancelled = schedule.status === SCHEDULE_STATUS.CANCELLED

  const runAction = async (action, values) => {
    setSubmittingAction(action)
    try {
      const payload = {
        lecturerId: schedule.lecturerId,
        courseId: schedule.courseId,
        batchId: schedule.batchId,
        ...values,
      }
      if (action === 'draft') {
        await saveDraft.mutateAsync({ scheduleId, data: payload })
        toast.success('Draft saved')
      } else {
        await submitReport.mutateAsync({ scheduleId, data: payload })
        toast.success('Class report submitted — class marked completed')
        navigate(ROUTES.LECTURER_HISTORY)
      }
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setSubmittingAction(null)
    }
  }

  const ensureDraftExists = async (values) => {
    if (report) return
    await saveDraft.mutateAsync({
      scheduleId,
      data: {
        lecturerId: schedule.lecturerId,
        courseId: schedule.courseId,
        batchId: schedule.batchId,
        ...values,
      },
    })
  }

  const scheduledDate = toDate(schedule.classDate)

  return (
    <div className="space-y-6">
      <Button
        variant="ghost"
        size="sm"
        className="text-muted-foreground"
        onClick={() => navigate(ROUTES.LECTURER_SCHEDULE)}
      >
        <ArrowLeft className="size-4" /> Back to schedule
      </Button>

      <PageHeader
        title={course?.name ?? 'Class report'}
        description={batch?.batchCode ? `Batch ${batch.batchCode}` : undefined}
      />

      <Card>
        <CardContent className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4">
          <InfoField label="Lecturer" value={profile?.fullName} />
          <InfoField label="Course" value={course?.name} />
          <InfoField label="Batch" value={batch?.batchCode} />
          <InfoField
            label="Scheduled"
            value={
              scheduledDate
                ? `${format(scheduledDate, 'MMM d, yyyy')} · ${schedule.startTime}–${schedule.endTime}`
                : '—'
            }
          />
        </CardContent>
      </Card>

      {isCancelled ? (
        <EmptyState
          title="This class was cancelled"
          description="You can't submit a report for a cancelled class."
        />
      ) : isSubmitted ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Submitted report (read-only)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <InfoField label="Actual time" value={`${report.actualStartTime}–${report.actualEndTime}`} />
            <InfoField label="Topic covered" value={report.topicCovered} block />
            {report.description ? <InfoField label="Description" value={report.description} block /> : null}
            {report.activitiesCompleted ? (
              <InfoField label="Activities completed" value={report.activitiesCompleted} block />
            ) : null}
            {report.homework ? <InfoField label="Homework" value={report.homework} block /> : null}
            {report.remarks ? <InfoField label="Remarks" value={report.remarks} block /> : null}

            {courseMaterials.length > 0 ? (
              <div className="space-y-2 border-t border-border pt-4">
                <p className="text-xs font-medium text-muted-foreground uppercase">Materials</p>
                <LectureMaterialsList materials={courseMaterials} loading={courseMaterialsLoading} />
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : (
        <Form {...form}>
          <form className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Class details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="actualStartTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Actual start time</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="actualEndTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Actual end time</FormLabel>
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
                  name="topicCovered"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Topic covered</FormLabel>
                      <FormControl>
                        <Input placeholder="What did you teach today?" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea rows={3} placeholder="Additional details..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="activitiesCompleted"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Activities completed</FormLabel>
                      <FormControl>
                        <Textarea rows={2} placeholder="Exercises, discussions, activities run..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="homework"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Homework</FormLabel>
                      <FormControl>
                        <Textarea rows={2} placeholder="Homework assigned, if any..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="remarks"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Remarks</FormLabel>
                      <FormControl>
                        <Textarea rows={2} placeholder="Anything else worth noting..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Materials</CardTitle>
              </CardHeader>
              <CardContent>
                <LectureMaterialUploadForm
                  bare
                  fixedCourseId={schedule.courseId}
                  scheduleId={scheduleId}
                  beforeUpload={() => ensureDraftExists(form.getValues())}
                />
              </CardContent>
            </Card>

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(ROUTES.LECTURER_SCHEDULE)}
                disabled={Boolean(submittingAction)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="secondary"
                disabled={Boolean(submittingAction)}
                onClick={form.handleSubmit((values) => runAction('draft', values))}
              >
                {submittingAction === 'draft' ? <Loader2 className="size-4 animate-spin" /> : null}
                Save Draft
              </Button>
              <Button
                type="button"
                disabled={Boolean(submittingAction)}
                onClick={form.handleSubmit((values) => runAction('submit', values))}
              >
                {submittingAction === 'submit' ? <Loader2 className="size-4 animate-spin" /> : null}
                Submit Class Report
              </Button>
            </div>
          </form>
        </Form>
      )}
    </div>
  )
}

function InfoField({ label, value, block }) {
  return (
    <div className={block ? 'space-y-1' : undefined}>
      <p className="text-xs font-medium text-muted-foreground uppercase">{label}</p>
      <p className="text-sm text-foreground">{value || '—'}</p>
    </div>
  )
}
