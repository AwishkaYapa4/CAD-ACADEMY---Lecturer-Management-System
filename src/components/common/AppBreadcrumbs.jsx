import { Link, useLocation } from 'react-router-dom'

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { NAV_ITEMS_BY_ROLE } from '@/constants/navigation'
import { useUIStore } from '@/store/useUIStore'

function humanize(segment) {
  return segment
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

/** Builds breadcrumb trail from the current URL, using nav labels where available. */
export function AppBreadcrumbs({ role }) {
  const { pathname } = useLocation()
  const breadcrumbLabels = useUIStore((state) => state.breadcrumbLabels)
  const segments = pathname.split('/').filter(Boolean)
  const navItems = NAV_ITEMS_BY_ROLE[role] ?? []

  const crumbs = segments.map((segment, index) => {
    const path = '/' + segments.slice(0, index + 1).join('/')
    const matchedNavItem = navItems.find((item) => item.to === path)
    return {
      path,
      label: matchedNavItem?.label ?? breadcrumbLabels[segment] ?? humanize(segment),
    }
  })

  if (crumbs.length <= 1) return null

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1
          return (
            <span key={crumb.path} className="contents">
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link to={crumb.path}>{crumb.label}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {!isLast && <BreadcrumbSeparator />}
            </span>
          )
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
