import { Menu, Search } from 'lucide-react'

import { AppBreadcrumbs } from '@/components/common/AppBreadcrumbs'
import { NotificationsBell } from '@/components/common/NotificationsBell'
import { ProfileDropdown } from '@/components/common/ProfileDropdown'
import { Sidebar } from '@/components/common/Sidebar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { useUIStore } from '@/store/useUIStore'

export function Navbar({ role, navItems, sidebarFooter }) {
  const { mobileNavOpen, openMobileNav, closeMobileNav } = useUIStore()

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b border-border bg-background/95 px-4 backdrop-blur-sm supports-backdrop-filter:bg-background/80 sm:px-6">
      <Sheet open={mobileNavOpen} onOpenChange={(open) => (open ? openMobileNav() : closeMobileNav())}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="lg:hidden">
            <Menu className="size-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <Sidebar
            navItems={navItems}
            footer={sidebarFooter}
            className="w-full border-r-0"
            onNavigate={closeMobileNav}
          />
        </SheetContent>
      </Sheet>

      <div className="hidden lg:block">
        <AppBreadcrumbs role={role} />
      </div>

      <div className="relative ml-auto hidden max-w-sm flex-1 sm:block">
        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search everything..." className="pl-9" />
      </div>

      <div className="ml-auto flex items-center gap-1 sm:ml-0">
        <NotificationsBell />
        <ProfileDropdown />
      </div>
    </header>
  )
}
