import { FileText } from 'lucide-react'
import { CardContent } from '@/components/ui/card'

/**
 * Empty state faktury — gdy wszystkie są opłacone.
 * Wydzielony komponent — EmptyState może być reużyty w innych miejscach.
 */
export function EmptyInvoices() {
  return (
    <CardContent className="flex flex-col items-center justify-center py-10 text-center">
      <FileText
        className="mb-2 h-8 w-8 text-muted-foreground/40"
        aria-hidden
      />
      <p className="text-sm font-medium">Brak faktur do opłacenia</p>
      <p className="mt-0.5 text-xs text-muted-foreground">
        Wszystkie faktury są opłacone
      </p>
    </CardContent>
  )
}