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
import { PasswordField } from '@/components/common/PasswordField'
import {
  useCreateLecturer,
  useUpdateLecturer,
} from '@/features/lecturers/hooks/useLecturers'

const fullNameField = {
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
}

const createSchema = z.object({
  ...fullNameField,
  email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

const editSchema = z.object(fullNameField)

/**
 * Add/Edit lecturer dialog. Pass `lecturer` to edit, omit it to create.
 * Render with `key={lecturer?.id ?? 'create'}` from the parent so the form
 * fully remounts (fresh schema + defaults) when switching between modes on
 * the same mounted dialog instance.
 */
export function LecturerFormDialog({ open, onOpenChange, lecturer }) {
  const isEdit = Boolean(lecturer)
  const createLecturer = useCreateLecturer()
  const updateLecturer = useUpdateLecturer()
  const submitting = createLecturer.isPending || updateLecturer.isPending

  const form = useForm({
    resolver: zodResolver(isEdit ? editSchema : createSchema),
    defaultValues: {
      fullName: lecturer?.fullName ?? '',
      email: lecturer?.email ?? '',
      password: '',
    },
  })

  const onSubmit = async (values) => {
    try {
      if (isEdit) {
        await updateLecturer.mutateAsync({ lecturer, data: values })
        toast.success('Lecturer updated')
      } else {
        await createLecturer.mutateAsync(values)
        toast.success(`Lecturer account created for ${values.fullName}`)
      }
      onOpenChange(false)
    } catch (error) {
      toast.error(mapLecturerError(error))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit lecturer' : 'Add lecturer'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update this lecturer's name."
              : 'Set their login email and password directly — share it with them securely.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full name</FormLabel>
                  <FormControl>
                    <Input placeholder="Dr. Jane Smith" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {!isEdit ? (
              <>
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="jane@academy.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <PasswordField
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="At least 8 characters"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            ) : (
              <p className="rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
                {lecturer.email}
              </p>
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
                {isEdit ? 'Save changes' : 'Add lecturer'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

function mapLecturerError(error) {
  const code = error?.code ?? ''
  if (code.includes('email-already-in-use')) {
    return 'This email is already registered to another account.'
  }
  if (code.includes('invalid-email')) {
    return 'Enter a valid email address.'
  }
  if (code.includes('weak-password')) {
    return 'Password must be at least 6 characters.'
  }
  if (code.includes('permission-denied')) {
    return 'Only an active Admin can do this.'
  }
  if (code.includes('network-request-failed')) {
    return 'Network error. Check your connection and try again.'
  }
  return error?.message || 'Something went wrong. Please try again.'
}
