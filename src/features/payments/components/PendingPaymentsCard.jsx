import { useNavigate } from 'react-router-dom'
import { ArrowRight, Hourglass } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/common/EmptyState'
import { DashboardPaymentRow } from '@/features/payments/components/DashboardPaymentRow'

/** Admin dashboard card listing lecturers still owed a payment for the selected month, most classes completed first. */
export function PendingPaymentsCard({ rows, loading, viewAllHref, maxRows = 5 }) {
  const navigate = useNavigate()
  const visible = rows.slice(0, maxRows)

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-warning">
          <Hourglass className="size-4.5" />
          Pending Payments
        </CardTitle>
        <CardDescription>
          {loading ? 'Loading…' : `${rows.length} lecturer${rows.length === 1 ? '' : 's'} awaiting payment`}
        </CardDescription>
        <CardAction>
          <Button variant="outline" size="sm" onClick={() => navigate(viewAllHref)}>
            View all <ArrowRight />
          </Button>
        </CardAction>
      </CardHeader>

      <CardContent className="flex-1 space-y-3">
        {loading ? (
          <>
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </>
        ) : visible.length === 0 ? (
          <EmptyState
            icon={Hourglass}
            title="Nothing pending"
            description="Every lecturer with completed classes this month has been paid."
            className="border-none bg-transparent py-10"
          />
        ) : (
          visible.map((row) => (
            <DashboardPaymentRow
              key={row.rule.id}
              lecturerName={row.lecturerName}
              scopeLabel={row.scopeLabel}
              completed={row.completed}
              target={row.rule.monthlyClassCount}
              currency={row.currency}
              finalPayment={row.finalPayment}
              monthlyAmount={row.monthlyAmount}
              paid={false}
              onClick={() => navigate(viewAllHref)}
            />
          ))
        )}
      </CardContent>

      {!loading && rows.length > 0 ? (
        <CardFooter className="border-none bg-transparent px-(--card-spacing) pt-0">
          <Button
            variant="outline"
            className="w-full border-warning/30 text-warning hover:bg-warning/10 hover:text-warning"
            onClick={() => navigate(viewAllHref)}
          >
            View All Pending Payments <ArrowRight />
          </Button>
        </CardFooter>
      ) : null}
    </Card>
  )
}
