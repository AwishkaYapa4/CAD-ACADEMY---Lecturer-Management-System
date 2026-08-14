import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts'
import { BarChart3 } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency } from '@/features/payments/utils/monthlyCalc'

/** Bottom-of-dashboard strip: totals across every lecturer for the selected month, plus a collection-rate donut. */
export function PaymentSummaryBar({ totalPayable, totalReceived, totalPending, currency, loading }) {
  const collectionRate = totalPayable > 0 ? Math.round((totalReceived / totalPayable) * 100) : 0
  const chartData = [
    { name: 'Received', value: totalReceived || 0 },
    { name: 'Pending', value: totalPending || 0 },
  ]
  const hasData = totalPayable > 0

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="size-4.5 text-primary" />
          Payment Summary
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-24 w-full" />
        ) : (
          <div className="flex flex-col items-center gap-8 sm:flex-row sm:justify-between">
            <div className="grid w-full grid-cols-2 gap-6 sm:w-auto sm:grid-cols-4 sm:gap-10">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Total Payable</p>
                <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">
                  {formatCurrency(totalPayable, currency)}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">This month</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Total Received</p>
                <p className="mt-1 text-2xl font-bold tabular-nums text-success">
                  {formatCurrency(totalReceived, currency)}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">{collectionRate}% collected</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Total Pending</p>
                <p className="mt-1 text-2xl font-bold tabular-nums text-warning">
                  {formatCurrency(totalPending, currency)}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">{100 - collectionRate}% pending</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Collection Rate</p>
                <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">{collectionRate}%</p>
                <p className="mt-0.5 text-xs text-muted-foreground">This month</p>
              </div>
            </div>

            <div className="relative size-28 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={hasData ? chartData : [{ name: 'No data', value: 1 }]}
                    dataKey="value"
                    innerRadius="70%"
                    outerRadius="100%"
                    startAngle={90}
                    endAngle={-270}
                    stroke="none"
                  >
                    {hasData ? (
                      <>
                        <Cell fill="var(--success)" />
                        <Cell fill="var(--warning)" />
                      </>
                    ) : (
                      <Cell fill="var(--muted)" />
                    )}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-lg font-bold text-foreground">{collectionRate}%</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
