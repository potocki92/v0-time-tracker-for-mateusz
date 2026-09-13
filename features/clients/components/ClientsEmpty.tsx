'use client'

import { Plus, SearchX, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { WorkspaceEmptyState } from '@/components/workspace'

type Props = {
  hasAnyClient: boolean
  onAddClient: () => void
  onClearFilters: () => void
}

/**
 * Dwa puste stany listy klientów: „nic nie pasuje do filtrów" i „nie ma
 * jeszcze żadnego klienta". Wcześniej stały na shadcnowym `<Empty>` z
 * `bg-card` — jedynej jasnej powierzchni w całej sekcji.
 */
export function ClientsEmpty({ hasAnyClient, onAddClient, onClearFilters }: Props) {
  if (hasAnyClient) {
    return (
      <WorkspaceEmptyState
        icon={SearchX}
        title="Brak wyników"
        description="Zmień wyszukiwanie lub wyczyść filtry, aby zobaczyć swoich klientów."
        action={
          <Button variant="outline" size="sm" onClick={onClearFilters}>
            Wyczyść filtry
          </Button>
        }
      />
    )
  }

  return (
    <WorkspaceEmptyState
      icon={Users}
      title="Jeszcze nie masz klientów"
      description="Dodaj pierwszego klienta, aby zacząć logować czas pracy i wystawiać faktury."
      action={
        <Button variant="accent" size="sm" onClick={onAddClient}>
          <Plus className="mr-2 h-4 w-4" />
          Dodaj pierwszego klienta
        </Button>
      }
    />
  )
}
