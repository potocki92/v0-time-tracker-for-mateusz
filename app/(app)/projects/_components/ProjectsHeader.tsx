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
    <div className="sticky top-0 z-20 -mx-4 border-b bg-background/95 px-4 pb-4 pt-2 backdrop-blur">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">Projekty</h1>
            <Badge variant="secondary" className="rounded-full">
              {total}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Planowanie, budżety i postęp prac w jednym miejscu.
          </p>
        </div>
        <Button onClick={onCreate} className="sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Dodaj projekt
        </Button>
      </div>
    </div>
  )
}
