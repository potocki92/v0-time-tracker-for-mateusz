import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface InvoicesHeaderProps {
  onCreate: () => void
}

export function InvoicesHeader({ onCreate }: InvoicesHeaderProps) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Faktury</h1>
        <p className="text-muted-foreground">Zarządzaj fakturami klientów i kontroluj płatności.</p>
      </div>

      <Button onClick={onCreate}>
        <Plus className="mr-2 h-4 w-4" />
        Dodaj fakturę
      </Button>
    </div>
  )
}
