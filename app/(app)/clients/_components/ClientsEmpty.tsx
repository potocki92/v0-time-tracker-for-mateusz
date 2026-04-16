'use client'

import { Plus, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

type Props = {
  hasAnyClient: boolean
  onAddClient:  () => void
  onClearFilters: () => void
}

export function ClientsEmpty({ hasAnyClient, onAddClient, onClearFilters }: Props) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center gap-3 py-12 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <Users className="h-6 w-6 text-muted-foreground" />
        </div>
        {hasAnyClient ? (
          <>
            <div>
              <p className="font-medium">Brak wyników dla wybranych filtrów</p>
              <p className="text-sm text-muted-foreground">
                Spróbuj usunąć wyszukiwanie lub zmień filtr typu/waluty.
              </p>
            </div>
            <Button variant="outline" onClick={onClearFilters}>
              Wyczyść filtry
            </Button>
          </>
        ) : (
          <>
            <div>
              <p className="font-medium">Nie masz jeszcze żadnych klientów</p>
              <p className="text-sm text-muted-foreground">
                Dodaj pierwszego klienta, żeby zacząć logować czas pracy i wystawiać faktury.
              </p>
            </div>
            <Button onClick={onAddClient}>
              <Plus className="mr-2 h-4 w-4" />
              Dodaj pierwszego klienta
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  )
}
