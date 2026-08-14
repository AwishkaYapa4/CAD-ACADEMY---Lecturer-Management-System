import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, Loader2, Mail } from 'lucide-react'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { ROUTES } from '@/constants/routes'
import { resetPassword } from '@/features/auth/services/authService'

const schema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
})

export function ForgotPasswordForm() {
  const [sent, setSent] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: { email: '' },
  })

  const onSubmit = async (values) => {
    setSubmitting(true)
    try {
      await resetPassword(values.email)
    } catch {
      // Firebase errors here (e.g. user-not-found) are intentionally not
      // surfaced — showing the same success state either way avoids leaking
      // which emails have accounts.
    } finally {
      setSubmitting(false)
      setSent(true)
    }
  }

  if (sent) {
    return (
      <div className="space-y-6 text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-success/10 text-success">
          <CheckCircle2 className="size-6" />
        </div>
        <div className="space-y-1.5">
          <p className="font-medium text-foreground">Check your email</p>
          <p className="text-sm text-muted-foreground">
            If an account exists for that address, we've sent a link to reset your password.
          </p>
        </div>
        <Button variant="outline" className="w-full" asChild>
          <Link to={ROUTES.LOGIN}>
            <ArrowLeft className="size-4" /> Back to sign in
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="you@academy.com"
                  autoComplete="email"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? <Loader2 className="size-4 animate-spin" /> : <Mail className="size-4" />}
          Send reset link
        </Button>

        <Button variant="ghost" className="w-full text-muted-foreground" asChild>
          <Link to={ROUTES.LOGIN}>
            <ArrowLeft className="size-4" /> Back to sign in
          </Link>
        </Button>
      </form>
    </Form>
  )
}
