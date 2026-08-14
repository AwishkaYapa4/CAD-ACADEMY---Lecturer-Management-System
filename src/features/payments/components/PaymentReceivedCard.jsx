import { useNavigate } from 'react-router-dom'
import { ArrowRight, CheckCircle2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/common/EmptyState'
import { DashboardPaymentRow } from '@/features/payments/components/DashboardPaymentRow'

/** Admin dashboard card listing lecturers already paid for the selected month, most recently/most classes first. */
export function PaymentReceivedCard({ rows, loading, viewAllHref, maxRows = 5 }) {
  const navigate = useNavigate()
  const visible = rows.slice(0, maxRows)

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-success">
          <CheckCircle2 className="size-4.5" />
          Payment Received
        </CardTitle>
        <CardDescription>
          {loading ? 'Loading…' : `${rows.length} lecturer${rows.length === 1 ? '' : 's'} received payment`}
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
            icon={CheckCircle2}
            title="No payments yet"
            description="Paid lecturers for the selected month will show up here."
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
              paid
              onClick={() => navigate(viewAllHref)}
            />
          ))
        )}
      </CardContent>

      {!loading && rows.length > 0 ? (
        <CardFooter className="border-none bg-transparent px-(--card-spacing) pt-0">
          <Button
            variant="outline"
            className="w-full border-success/30 text-success hover:bg-success/10 hover:text-success"
            onClick={() => navigate(viewAllHref)}
          >
            View All Received Payments <ArrowRight />
          </Button>
        </CardFooter>
      ) : null}
    </Card>
  )
}
