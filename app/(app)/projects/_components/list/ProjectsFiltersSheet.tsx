'use client'

import { SlidersHorizontal, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PROJECT_STATUS_FILTER_OPTIONS } from '../../_domain/projects.constants'
import type { ProjectFiltersState } from '../../_hooks/useProjectFilters'

type Props = {
  filters: ProjectFiltersState
}

/**
 * Bottom-sheet filters for mobile. Values apply live; the footer is just for
 * reset / close shortcuts so the user can skim results while adjusting.
 */
export function ProjectsFiltersSheet({ filters }: Props) {
  const activeCount = filters.activeFilterCount

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="h-11 shrink-0 gap-2 px-3"
          aria-label="Otwórz filtry"
        >
          <SlidersHorizontal className="size-4" />
          <span>Filtry</span>
          {activeCount > 0 && (
            <Badge
              variant="secondary"
              className="h-5 min-w-5 rounded-full px-1.5 text-[11px] leading-none"
            >
              {activeCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>

      <SheetContent
        side="bottom"
        className="rounded-t-2xl pb-[env(safe-area-inset-bottom)]"
      >
        <SheetHeader className="pb-2">
          <SheetTitle>Filtry</SheetTitle>
          <SheetDescription>Zawęź listę projektów. Zmiany są zapisywane automatycznie.</SheetDescription>
        </SheetHeader>

        <div className="grid gap-4 px-4 pb-2">
          <FieldLabel label="Status">
            <Select
              value={filters.status}
              onValueChange={(value) => filters.setStatus(value as typeof filters.status)}
            >
              <SelectTrigger className="h-11 w-full" aria-label="Filtruj po statusie">
                <SelectValue placeholder="Wszystkie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Wszystkie</SelectItem>
                {PROJECT_STATUS_FILTER_OPTIONS.filter((o) => o.value !== 'all').map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldLabel>

          <FieldLabel label="Priorytet">
            <Select
              value={filters.priority}
              onValueChange={(value) => filters.setPriority(value as typeof filters.priority)}
            >
              <SelectTrigger className="h-11 w-full" aria-label="Filtruj po priorytecie">
                <SelectValue placeholder="Wszystkie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Wszystkie</SelectItem>
                <SelectItem value="low">Niski</SelectItem>
                <SelectItem value="medium">Średni</SelectItem>
                <SelectItem value="high">Wysoki</SelectItem>
              </SelectContent>
            </Select>
          </FieldLabel>
        </div>

        <SheetFooter className="flex-row gap-2 border-t pt-3">
          <Button
            type="button"
            variant="ghost"
            className="h-11 flex-1 gap-1"
            onClick={filters.reset}
            disabled={activeCount === 0}
          >
            <X className="size-4" aria-hidden />
            Wyczyść
          </Button>
          <SheetClose asChild>
            <Button type="button" className="h-11 flex-1">
              Gotowe
            </Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

function FieldLabel({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="space-y-1.5 text-sm font-medium">
      <span className="text-xs uppercase tracking-wide text-muted-foreground">{label}</span>
      <div>{children}</div>
    </label>
  )
}
