'use client'

import { Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PROJECT_STATUS_FILTER_OPTIONS } from '../_domain/projects.constants'
import type { ProjectStatusFilter } from '../_domain/projects.types'

type Props = {
  search: string
  status: ProjectStatusFilter
  isFiltering: boolean
  onSearchChange: (value: string) => void
  onStatusChange: (value: ProjectStatusFilter) => void
  onReset: () => void
}

export function ProjectsToolbar({
  search,
  status,
  isFiltering,
  onSearchChange,
  onStatusChange,
  onReset,
}: Props) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div className="relative lg:max-w-sm lg:flex-1">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          className="pl-9 pr-9"
          placeholder="Szukaj projektu lub klienta..."
          aria-label="Szukaj projektu"
        />
        {search && (
          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={() => onSearchChange('')}
            className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground"
            aria-label="Wyczyść wyszukiwanie"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      <div className="flex items-center gap-2 overflow-x-auto">
        <Tabs
          value={status}
          onValueChange={(value) => onStatusChange(value as ProjectStatusFilter)}
          className="w-full lg:w-auto"
        >
          <TabsList className="w-full justify-start lg:w-auto">
            {PROJECT_STATUS_FILTER_OPTIONS.map((option) => (
              <TabsTrigger key={option.value} value={option.value} className="text-xs sm:text-sm">
                {option.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {isFiltering && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="shrink-0 gap-1 text-xs text-muted-foreground"
          >
            <X className="h-3 w-3" aria-hidden />
            Reset
          </Button>
        )}
      </div>
    </div>
  )
}
