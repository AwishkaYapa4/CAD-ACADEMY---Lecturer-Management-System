import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AlertCircle, CheckCircle2, Loader2, UploadCloud } from 'lucide-react'
import { z } from 'zod'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  ALLOWED_MATERIAL_EXTENSIONS,
  ALLOWED_MATERIAL_MIME_TYPES,
  MAX_MATERIAL_FILE_SIZE_MB,
} from '@/constants/cloudinaryMaterials'
import { useUploadLectureMaterial } from '@/features/materials/hooks/useLectureMaterials'

// Title/Week/Description used to be user-entered fields; the form now only
// asks for a file (and a course, when it isn't already implied by context).
// The backend still requires title + week, so they're derived automatically:
// title comes from the filename, week defaults to 1.
const uploadSchema = z.object({
  courseId: z.string().min(1, 'Course is required'),
})

const DEFAULT_MATERIAL_WEEK = 1

function titleFromFilename(filename) {
  const dot = filename.lastIndexOf('.')
  return dot > 0 ? filename.slice(0, dot) : filename
}

function formatSize(bytes) {
  const mb = bytes / (1024 * 1024)
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`
}

function validateFile(file) {
  if (!ALLOWED_MATERIAL_MIME_TYPES[file.type]) {
    return 'Unsupported file type. Allowed: PDF, DOC, DOCX, PPT, PPTX.'
  }
  if (file.size > MAX_MATERIAL_FILE_SIZE_MB * 1024 * 1024) {
    return `File exceeds the ${MAX_MATERIAL_FILE_SIZE_MB}MB limit.`
  }
  return null
}

/**
 * Upload form for the Cloudinary-backed lecture material library.
 *
 * - `courses` — dropdown source when the caller isn't already in a single-
 *   course context (e.g. Admin's general library page). Ignored when
 *   `fixedCourseId` is set.
 * - `fixedCourseId` — used from the "Complete Class" flow (SubmitReportPage),
 *   where the course is already implied by the class being completed; hides
 *   the course picker entirely instead of offering a redundant choice.
 * - `scheduleId` — passed through so the backend can keep that class report's
 *   materialCount in sync (see server/controllers/materials.controller.js).
 * - `bare` — renders the form fields without the outer Card, for embedding
 *   inside a caller's own Card/section instead of nesting cards.
 * - `beforeUpload` — optional async callback run right before the upload
 *   request fires (e.g. SubmitReportPage uses it to make sure a draft report
 *   exists first, since scheduleId needs a real report doc to attach its
 *   materialCount to). Throwing aborts the upload with that error shown as
 *   the failure message.
 * The real permission gate is always the Materials API's server-side check,
 * never this form.
 */
export function LectureMaterialUploadForm({
  courses = [],
  fixedCourseId,
  scheduleId,
  bare = false,
  beforeUpload,
}) {
  const [file, setFile] = useState(null)
  const [fileError, setFileError] = useState(null)
  const [progress, setProgress] = useState(0)
  const [feedback, setFeedback] = useState(null) // { type: 'success' | 'error', message }
  const uploadMaterial = useUploadLectureMaterial()

  const form = useForm({
    resolver: zodResolver(uploadSchema),
    defaultValues: { courseId: fixedCourseId ?? '' },
  })

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0] ?? null
    e.target.value = ''
    if (!selected) return
    const error = validateFile(selected)
    setFileError(error)
    setFile(error ? null : selected)
    setFeedback(null)
  }

  const onSubmit = async (values) => {
    if (!file) {
      setFileError('Select a file to upload.')
      return
    }
    setFeedback(null)
    setProgress(0)
    try {
      await beforeUpload?.()
      await uploadMaterial.mutateAsync({
        file,
        courseId: values.courseId,
        week: DEFAULT_MATERIAL_WEEK,
        title: titleFromFilename(file.name),
        scheduleId,
        onProgress: setProgress,
      })
      setFeedback({ type: 'success', message: `"${file.name}" uploaded successfully.` })
      form.reset({ courseId: values.courseId })
      setFile(null)
    } catch (error) {
      setFeedback({ type: 'error', message: error.message || 'Upload failed. Please try again.' })
    } finally {
      setProgress(0)
    }
  }

  const fields = (
    <Form {...form}>
      {/*
        A literal <form> here would be invalid HTML when this component is
        embedded inside SubmitReportPage's own <form> (browsers can't nest
        forms — the inner one gets silently dropped by the parser, which
        would make this "Upload material" button submit the OUTER form
        instead). Using a <div> + an explicit type="button" click handler
        sidesteps that entirely, matching the pattern SubmitReportPage's own
        Save Draft/Submit buttons already use.
      */}
      <div className="space-y-4">
        {fixedCourseId ? null : (
          <FormField
            control={form.control}
            name="courseId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Course</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
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
        )}

        <div className="space-y-2">
          <FormLabel htmlFor="lecture-material-file">File</FormLabel>
          <label
            htmlFor="lecture-material-file"
            className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-border px-4 py-3 text-sm transition-colors hover:border-primary/40 hover:bg-primary/5"
          >
            <UploadCloud className="size-4 shrink-0 text-muted-foreground" />
            {file ? (
              <span className="min-w-0 flex-1 truncate text-foreground">
                {file.name} <span className="text-muted-foreground">· {formatSize(file.size)}</span>
              </span>
            ) : (
              <span className="text-muted-foreground">
                Click to choose a file — {ALLOWED_MATERIAL_EXTENSIONS}, up to {MAX_MATERIAL_FILE_SIZE_MB}MB
              </span>
            )}
          </label>
          <input
            id="lecture-material-file"
            type="file"
            accept={Object.keys(ALLOWED_MATERIAL_MIME_TYPES).join(',')}
            className="hidden"
            onChange={handleFileChange}
          />
          {fileError ? <p className="text-sm text-destructive">{fileError}</p> : null}
        </div>

        {uploadMaterial.isPending ? (
          <div className="space-y-1">
            <Progress value={progress} className="h-1.5" />
            <p className="text-xs text-muted-foreground">Uploading… {progress}%</p>
          </div>
        ) : null}

        {feedback ? (
          <Alert variant={feedback.type === 'error' ? 'destructive' : 'default'}>
            {feedback.type === 'error' ? <AlertCircle className="size-4" /> : <CheckCircle2 className="size-4" />}
            <AlertTitle>{feedback.type === 'error' ? 'Upload failed' : 'Success'}</AlertTitle>
            <AlertDescription>{feedback.message}</AlertDescription>
          </Alert>
        ) : null}

        <div className="flex justify-end">
          <Button type="button" disabled={uploadMaterial.isPending} onClick={form.handleSubmit(onSubmit)}>
            {uploadMaterial.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
            Upload material
          </Button>
        </div>
      </div>
    </Form>
  )

  if (bare) return fields

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Upload lecture material</CardTitle>
      </CardHeader>
      <CardContent>{fields}</CardContent>
    </Card>
  )
}
