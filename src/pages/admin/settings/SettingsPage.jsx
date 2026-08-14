import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { z } from 'zod'

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
import { useGeneralSettings, useSaveGeneralSettings } from '@/features/settings/hooks/useSettings'

const settingsSchema = z.object({
  academyName: z.string().min(2, 'Academy name is required'),
  supportEmail: z.string().email('Enter a valid email address').optional().or(z.literal('')),
  defaultCurrency: z.string().min(1, 'Required'),
})

export default function SettingsPage() {
  const { data: settings, loading } = useGeneralSettings()
  const saveSettings = useSaveGeneralSettings()

  const form = useForm({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      academyName: 'CAD Academy',
      supportEmail: '',
      defaultCurrency: 'USD',
    },
  })

  useEffect(() => {
    if (settings) {
      form.reset({
        academyName: settings.academyName ?? 'CAD Academy',
        supportEmail: settings.supportEmail ?? '',
        defaultCurrency: settings.defaultCurrency ?? 'USD',
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings])

  const onSubmit = async (values) => {
    try {
      await saveSettings.mutateAsync(values)
      toast.success('Settings saved')
    } catch {
      toast.error('Failed to save settings')
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="System-wide configuration." />

      {loading ? null : (
        <Card className="max-w-lg">
          <CardHeader>
            <CardTitle className="text-base">General</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="academyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Academy name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="supportEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Support email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="office@academy.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="defaultCurrency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Default currency</FormLabel>
                      <FormControl>
                        <Input placeholder="USD" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={saveSettings.isPending}>
                  {saveSettings.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
                  Save changes
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
