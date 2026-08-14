import { Outlet } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CalendarCheck2, ClipboardCheck, Wallet } from 'lucide-react'

import { Logo } from '@/components/common/Logo'

const HIGHLIGHTS = [
  {
    icon: CalendarCheck2,
    title: 'Schedule classes with clarity',
    description: 'Batches, weekly timetables, and lecturer assignments in one place.',
  },
  {
    icon: ClipboardCheck,
    title: 'Class reports, not paperwork',
    description: 'Lecturers submit class details and materials straight from their dashboard.',
  },
  {
    icon: Wallet,
    title: 'Payments prepare themselves',
    description: 'Completed classes automatically move lecturers toward payout.',
  },
]

export function AuthLayout() {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex flex-col justify-between p-6 sm:p-10">
        <Logo />
        <div className="mx-auto w-full max-w-sm py-16">
          <Outlet />
        </div>
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} CAD Academy. All rights reserved.
        </p>
      </div>

      <div className="relative hidden overflow-hidden bg-brand-gradient lg:block">
        <div className="relative flex h-full flex-col justify-center gap-10 p-16 text-primary-foreground">
          <div className="space-y-3">
            <h2 className="text-3xl font-semibold tracking-tight">
              Run your academy without the spreadsheets.
            </h2>
            <p className="max-w-md text-primary-foreground/80">
              One system for lecturer scheduling, class reporting, and
              payment preparation.
            </p>
          </div>

          <div className="space-y-6">
            {HIGHLIGHTS.map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.4 }}
                className="flex items-start gap-4"
              >
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-white/10">
                  <item.icon className="size-5" />
                </div>
                <div>
                  <p className="font-medium">{item.title}</p>
                  <p className="text-sm text-primary-foreground/70">
                    {item.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
