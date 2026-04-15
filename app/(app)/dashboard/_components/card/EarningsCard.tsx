'use client'
import { memo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/helpers'

interface EarningsCardProps {
  earningsPLN: number
  earningsEUR: number
  totalPLN: number
}

function EarningsCardImpl({ earningsPLN, earningsEUR, totalPLN }: EarningsCardProps) {
  return (
    <Card>
      <CardHeader><CardTitle>Zarobki</CardTitle></CardHeader>
      <CardContent className="space-y-1">
        <div>{formatCurrency(earningsPLN, 'PLN')}</div>
        <div>{formatCurrency(earningsEUR, 'EUR')}</div>
        <div className="text-xs text-muted-foreground">
          Razem: {formatCurrency(totalPLN, 'PLN')}
        </div>
      </CardContent>
    </Card>
  )
}

// memo z custom equality jeśli propsy są primitives — domyślny shallow wystarczy
export const EarningsCard = memo(EarningsCardImpl)
