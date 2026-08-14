import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { z } from 'zod'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { PageHeader } from '@/components/common/PageHeader'
import { ROLE_LABELS } from '@/constants/roles'
import { changePassword } from '@/features/auth/services/authService'
import { useAuth } from '@/hooks/useAuth'
import { getInitials } from '@/utils/formatters'

const passwordSchema = z.object({
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
})

/** Shared across Staff and Lecturer — name/email are Admin-managed, so this is just identity + password self-service. */
export default function ProfilePage() {
  const { profile } = useAuth()
  const [submitting, setSubmitting] = useState(false)

  const form = useForm({
    resolver: zodResolver(passwordSchema),
    defaultValues: { newPassword: '' },
  })

  const onSubmit = async ({ newPassword }) => {
    setSubmitting(true)
    try {
      await changePassword(newPassword)
      toast.success('Password updated')
      form.reset()
    } catch (error) {
      if (error.code === 'auth/requires-recent-login') {
        toast.error('Please sign out and sign back in, then try again.')
      } else {
        toast.error('Failed to update password. Please try again.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Profile" description="Your account information." />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <Avatar className="size-14">
              <AvatarFallback className="bg-primary/10 text-lg font-semibold text-primary">
                {getInitials(profile?.fullName, profile?.email)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-foreground">{profile?.fullName}</p>
              <p className="text-sm text-muted-foreground">{profile?.email}</p>
              <p className="text-xs font-medium text-primary">
                {ROLE_LABELS[profile?.role] ?? profile?.role}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Change password</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="At least 8 characters" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={submitting}>
                  {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
                  Update password
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
