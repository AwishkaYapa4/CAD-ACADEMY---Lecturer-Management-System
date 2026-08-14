import { NavLink } from 'react-router-dom'
import { ChevronsLeft, ChevronsRight } from 'lucide-react'

import { Logo } from '@/components/common/Logo'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { useUIStore } from '@/store/useUIStore'

function SidebarLink({ item, collapsed, onNavigate }) {
  const link = (
    <NavLink
      to={item.to}
      end={item.end}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-sidebar-foreground/65 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
          isActive &&
            'bg-sidebar-primary text-sidebar-primary-foreground shadow-[0_4px_14px_-2px_oklch(0.52_0.215_26/60%)] hover:bg-sidebar-primary hover:text-sidebar-primary-foreground',
          collapsed && 'justify-center px-0'
        )
      }
    >
      <item.icon className="size-4.5 shrink-0" />
      {!collapsed && <span className="truncate">{item.label}</span>}
    </NavLink>
  )

  if (!collapsed) return link

  return (
    <Tooltip delayDuration={0}>
      <TooltipTrigger asChild>{link}</TooltipTrigger>
      <TooltipContent side="right">{item.label}</TooltipContent>
    </Tooltip>
  )
}

/** Desktop sidebar. Also reused inside the mobile Sheet nav (collapsed is always false there).
 *  Always dark red-black regardless of the app's light/dark theme — see index.css sidebar tokens. */
export function Sidebar({ navItems, className, onNavigate, footer }) {
  const { sidebarCollapsed, toggleSidebar } = useUIStore()

  return (
    <aside
      className={cn(
        'flex h-full flex-col border-r border-sidebar-border bg-sidebar transition-[width] duration-200',
        sidebarCollapsed ? 'w-[68px]' : 'w-64',
        className
      )}
    >
      <div className="flex h-16 shrink-0 items-center border-b border-sidebar-border px-4">
        <Logo collapsed={sidebarCollapsed} onDark />
      </div>

      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="flex flex-col gap-1">
          {navItems.map((item) => (
            <SidebarLink
              key={item.to}
              item={item}
              collapsed={sidebarCollapsed}
              onNavigate={onNavigate}
            />
          ))}
        </nav>

        {footer && !sidebarCollapsed ? <div className="mt-4 px-0.5">{footer}</div> : null}
      </ScrollArea>

      <div className="hidden shrink-0 border-t border-sidebar-border p-3 lg:block">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-center text-sidebar-foreground/65 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          onClick={toggleSidebar}
        >
          {sidebarCollapsed ? (
            <ChevronsRight className="size-4" />
          ) : (
            <>
              <ChevronsLeft className="size-4" /> Collapse
            </>
          )}
        </Button>
      </div>
    </aside>
  )
}
