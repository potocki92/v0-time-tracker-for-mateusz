import type { InvoiceStatusFilter } from '../_domain'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface InvoicesFiltersProps {
  query: string
  status: InvoiceStatusFilter
  onQueryChange: (value: string) => void
  onStatusChange: (value: InvoiceStatusFilter) => void
}

export function InvoicesFilters({ query, status, onQueryChange, onStatusChange }: InvoicesFiltersProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="grid gap-3 md:grid-cols-[1fr_220px]">
          <Input
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Szukaj po ID, nazwie, numerze lub odbiorcy..."
          />
          <Select value={status} onValueChange={(value: InvoiceStatusFilter) => onStatusChange(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Wszystkie statusy</SelectItem>
              <SelectItem value="paid">Opłacone</SelectItem>
              <SelectItem value="unpaid">Nieopłacone</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  )
}
