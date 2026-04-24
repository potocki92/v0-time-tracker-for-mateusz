import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { TopClient } from '@/lib/finance/invoice-analytics'
import { format as formatMoney, fromMajor } from '@/lib/finance/money'

export function TopClientsTable({ clients }: { clients: TopClient[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Top klienci wg przychodu (PLN)</CardTitle>
      </CardHeader>
      <CardContent>
        {clients.length === 0 ? (
          <p className="text-sm text-muted-foreground">Brak faktur w bieżącym okresie.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground">
                <th className="pb-2 font-medium">Klient</th>
                <th className="pb-2 font-medium text-right">Faktur</th>
                <th className="pb-2 font-medium text-right">Przychód</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((c) => (
                <tr key={c.client_id ?? c.client_name} className="border-t">
                  <td className="py-2">{c.client_name}</td>
                  <td className="py-2 text-right">{c.invoice_count}</td>
                  <td className="py-2 text-right font-medium">
                    {formatMoney(fromMajor(c.revenue_pln, 'PLN'))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </CardContent>
    </Card>
  )
}
