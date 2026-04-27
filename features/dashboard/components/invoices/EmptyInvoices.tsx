import Link from 'next/link'
import { CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CardContent } from '@/components/ui/card'

/**
 * Empty state faktur — gdy wszystkie są opłacone.
 * Pozytywne wzmocnienie (zielony checkmark) + CTA do pełnego widoku.
 */
export function EmptyInvoices() {
  return (
    <CardContent className="flex flex-col items-center justify-center gap-3 py-10 text-center">
      <div
        aria-hidden
        className="flex h-12 w-12 items-center justify-center rounded-full bg-[color-mix(in_oklch,var(--success)_15%,transparent)] text-[var(--success-foreground)]"
      >
        <CheckCircle2 className="h-6 w-6" />
      </div>
      <div className="space-y-0.5">
        <p className="text-sm font-medium">Świetna robota!</p>
        <p className="text-xs text-muted-foreground">
          Wszystkie faktury są opłacone.
        </p>
      </div>
      <Button asChild size="sm" variant="ghost" className="mt-1">
        <Link href="/invoices">Zobacz wszystkie faktury</Link>
      </Button>
    </CardContent>
  )
}
