'use client'

import { FolderKanban, Plus, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'

type Props = {
  hasProjects: boolean
  search: string
  onCreate: () => void
  onClearFilters: () => void
}

export function ProjectsEmpty({ hasProjects, search, onCreate, onClearFilters }: Props) {
  if (!hasProjects) {
    return (
      <Empty className="rounded-xl border bg-card/50 py-14">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <FolderKanban className="h-5 w-5" />
          </EmptyMedia>
          <EmptyTitle>Brak projektów</EmptyTitle>
          <EmptyDescription>
            Dodaj pierwszy projekt, aby monitorować postęp, budżet oraz przypisać zadania do klientów.
          </EmptyDescription>
        </EmptyHeader>
        <Button onClick={onCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Utwórz pierwszy projekt
        </Button>
      </Empty>
    )
  }

  return (
    <Empty className="rounded-xl border bg-card/50 py-14">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Search className="h-5 w-5" />
        </EmptyMedia>
        <EmptyTitle>Brak wyników</EmptyTitle>
        <EmptyDescription>
          {search
            ? `Nie znaleziono projektów pasujących do frazy „${search}”.`
            : 'Zmień filtry, aby zobaczyć więcej projektów.'}
        </EmptyDescription>
      </EmptyHeader>
      <Button variant="outline" onClick={onClearFilters}>
        Wyczyść filtry
      </Button>
    </Empty>
  )
}
