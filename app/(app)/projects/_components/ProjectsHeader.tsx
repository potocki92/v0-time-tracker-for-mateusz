'use client'

import { Plus } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

type Props = {
  total: number
  onCreate: () => void
}

export function ProjectsHeader({ total, onCreate }: Props) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0 space-y-1">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Projekty</h1>
          <Badge variant="secondary" className="rounded-full">
            {total}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Planowanie, budżety i postęp prac w jednym miejscu.
        </p>
      </div>
      <Button
        onClick={onCreate}
        size="lg"
        className="h-11 w-full sm:h-10 sm:w-auto"
      >
        <Plus className="mr-2 h-4 w-4" />
        Dodaj projekt
      </Button>
    </div>
  )
}
