import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Loader2, LogIn } from 'lucide-react'
import toast from 'react-hot-toast'
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
import { ROLE_LABELS } from '@/constants/roles'
import { HOME_ROUTE_BY_ROLE, LOGIN_ROUTE_BY_ROLE, ROUTES } from '@/constants/routes'
import { useAuth } from '@/hooks/useAuth'

const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

/**
 * `role` scopes this login page to one role: signing in with a different
 * role's credentials signs the user back out immediately and points them at
 * their actual login page, instead of silently letting them in through the
 * "wrong" door.
 */
export function LoginForm({ role }) {
  const { login, logout } = useAuth()
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)
  const [passwordVisible, setPasswordVisible] = useState(false)

  const form = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  const onSubmit = async (values) => {
    setSubmitting(true)
    try {
      const profile = await login(values.email, values.password)

      if (profile.role !== role) {
        await logout()
        toast.error(
          `That account is a ${ROLE_LABELS[profile.role] ?? profile.role} login. Use the ${ROLE_LABELS[profile.role] ?? profile.role} sign-in page instead.`
        )
        navigate(LOGIN_ROUTE_BY_ROLE[profile.role] ?? ROUTES.LOGIN)
        return
      }

      toast.success(`Welcome back, ${profile.fullName ?? profile.email}`)
      navigate(HOME_ROUTE_BY_ROLE[profile.role] ?? '/', { replace: true })
    } catch (error) {
      if (error.code === 'account/deactivated') {
        navigate(ROUTES.DEACTIVATED)
        return
      }
      toast.error(mapAuthError(error))
    } finally {
      setSubmitting(false)
    }
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

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center justify-between">
                <FormLabel>Password</FormLabel>
                <Link
                  to={ROUTES.FORGOT_PASSWORD}
                  className="text-xs font-medium text-primary hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <FormControl>
                <div className="relative">
                  <Input
                    type={passwordVisible ? 'text' : 'password'}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className="pr-9"
                    {...field}
                  />
                  <button
                    type="button"
                    onClick={() => setPasswordVisible((v) => !v)}
                    className="absolute top-1/2 right-2.5 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {passwordVisible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    <span className="sr-only">
                      {passwordVisible ? 'Hide password' : 'Show password'}
                    </span>
                  </button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <LogIn className="size-4" />
          )}
          Sign in
        </Button>
      </form>
    </Form>
  )
}

function mapAuthError(error) {
  const code = error?.code ?? ''
  if (code.includes('invalid-credential') || code.includes('wrong-password') || code.includes('user-not-found')) {
    return 'Incorrect email or password.'
  }
  if (code.includes('too-many-requests')) {
    return 'Too many attempts. Please wait a moment and try again.'
  }
  if (code.includes('network-request-failed')) {
    return 'Network error. Check your connection and try again.'
  }
  return error?.message || 'Sign in failed. Please try again.'
}
