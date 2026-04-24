'use client'

import { Plus, SearchX, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'

type Props = {
  hasAnyClient: boolean
  onAddClient: () => void
  onClearFilters: () => void
}

export function ClientsEmpty({ hasAnyClient, onAddClient, onClearFilters }: Props) {
  if (hasAnyClient) {
    return (
      <Empty className="border bg-card/60">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <SearchX />
          </EmptyMedia>
          <EmptyTitle>Brak wyników</EmptyTitle>
          <EmptyDescription>
            Zmień wyszukiwanie lub wyczyść filtry, aby zobaczyć swoich klientów.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button variant="outline" onClick={onClearFilters}>
            Wyczyść filtry
          </Button>
        </EmptyContent>
      </Empty>
    )
  }

  return (
    <Empty className="border bg-card/60">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Users />
        </EmptyMedia>
        <EmptyTitle>Jeszcze nie masz klientów</EmptyTitle>
        <EmptyDescription>
          Dodaj pierwszego klienta, aby zacząć logować czas pracy i wystawiać faktury.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button onClick={onAddClient}>
          <Plus className="mr-2 h-4 w-4" />
          Dodaj pierwszego klienta
        </Button>
      </EmptyContent>
    </Empty>
  )
}
