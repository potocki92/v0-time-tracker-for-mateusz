'use client'

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { MonthlyRevenuePoint } from '@/lib/finance/invoice-analytics'
import { format as formatMoney, fromMajor } from '@/lib/finance/money'

function formatAxis(value: number) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}k`
  return String(value)
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
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" fontSize={12} />
              <YAxis tickFormatter={formatAxis} fontSize={12} width={50} />
              <Tooltip
                formatter={(value: number) => formatMoney(fromMajor(value, 'PLN'))}
                labelClassName="font-medium"
              />
              <Legend />
              <Bar dataKey="issued_pln" name="Wystawione" fill="#1d4ed8" radius={[4, 4, 0, 0]} />
              <Bar dataKey="paid_pln" name="Opłacone" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="overdue_pln" name="Zaległe" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
