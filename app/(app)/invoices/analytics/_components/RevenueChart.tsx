'use client'

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { MonthlyRevenuePoint } from '@/lib/finance/invoice-analytics'
import { format as formatMoney, fromMajor } from '@/lib/finance/money'
import { formatMoneyCompact, toMinor } from '@/lib/format'

function formatAxis(value: number) {
  return formatMoneyCompact(toMinor(value), 'PLN')
}

export function RevenueChart({ data }: { data: MonthlyRevenuePoint[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Przychód miesięczny (PLN)</CardTitle>
      </CardHeader>
      <CardContent className="h-72">
        {data.length === 0 ? (
          <p className="text-sm text-muted-foreground">Brak danych do wyświetlenia.</p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" fontSize={12} />
              <YAxis tickFormatter={formatAxis} fontSize={12} width={50} />
              <Tooltip
                formatter={(value: number) => formatMoney(fromMajor(value, 'PLN'))}
                labelClassName="font-medium"
              />
              <Legend />
              {/* Serie idą tymi samymi tokenami co pigułki statusów faktur —
                  wystawiona / opłacona / zaległa czytają się tak samo na liście
                  i na wykresie. */}
              <Bar dataKey="issued_pln" name="Wystawione" fill="var(--info-500)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="paid_pln" name="Opłacone" fill="var(--positive-500)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="overdue_pln" name="Zaległe" fill="var(--danger-500)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
