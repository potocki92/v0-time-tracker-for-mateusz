'use client'

import { Check, SlidersHorizontal, X } from 'lucide-react'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { PRIORITY_LABELS } from '@/lib/types'
import type { ProjectPriority, ProjectStatusFilter } from '../../_domain/projects.types'
import {
  PROJECT_PRIORITY_BADGE_CLASS,
  PROJECT_PRIORITY_OPTIONS,
  PROJECT_STATUS_BADGE_CLASS,
  PROJECT_STATUS_FILTER_OPTIONS,
} from '../../_domain/projects.constants'

type Props = {
  status: ProjectStatusFilter
  priority: 'all' | ProjectPriority
  onStatusChange: (value: ProjectStatusFilter) => void
  onPriorityChange: (value: 'all' | ProjectPriority) => void
  onReset: () => void
}

const PRIORITY_FILTER_OPTIONS: { value: 'all' | ProjectPriority; label: string }[] = [
  { value: 'all', label: 'Wszystkie' },
  ...PROJECT_PRIORITY_OPTIONS.map((value) => ({ value, label: PRIORITY_LABELS[value] })),
]

export function ProjectsMobileFilters({
  status,
  priority,
  onStatusChange,
  onPriorityChange,
  onReset,
}: Props) {
  const activeCount = (status !== 'all' ? 1 : 0) + (priority !== 'all' ? 1 : 0)

  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="h-11 w-full justify-between border-border/60 bg-card px-4"
        >
          <span className="inline-flex items-center gap-2 text-sm font-medium">
            <SlidersHorizontal className="h-4 w-4" />
            Filtry
          </span>
          {activeCount > 0 ? (
            <Badge
              variant="secondary"
              className="rounded-full bg-primary/10 text-primary"
            >
              {activeCount}
            </Badge>
          ) : (
            <span className="text-xs text-muted-foreground">Wszystkie</span>
          )}
        </Button>
      </DrawerTrigger>

      <DrawerContent className="px-0 pb-[env(safe-area-inset-bottom)]">
        <DrawerHeader className="text-left">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <DrawerTitle>Filtry projektów</DrawerTitle>
              <DrawerDescription>
                Zawęź listę po statusie lub priorytecie.
              </DrawerDescription>
            </div>
            <DrawerClose asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-10 w-10 shrink-0"
                aria-label="Zamknij filtry"
              >
                <X className="h-5 w-5" />
              </Button>
            </DrawerClose>
          </div>
        </DrawerHeader>

        <div className="space-y-5 px-4 pb-4">
          <FilterGroup label="Status">
            {PROJECT_STATUS_FILTER_OPTIONS.map((option) => {
              const isActive = status === option.value
              const colorClass =
                option.value !== 'all'
                  ? PROJECT_STATUS_BADGE_CLASS[option.value]
                  : ''
              return (
                <FilterChip
                  key={option.value}
                  active={isActive}
                  onClick={() => onStatusChange(option.value)}
                  colorClass={colorClass}
                  label={option.label}
                />
              )
            })}
          </FilterGroup>

          <FilterGroup label="Priorytet">
            {PRIORITY_FILTER_OPTIONS.map((option) => {
              const isActive = priority === option.value
              const colorClass =
                option.value !== 'all'
                  ? PROJECT_PRIORITY_BADGE_CLASS[option.value]
                  : ''
              return (
                <FilterChip
                  key={option.value}
                  active={isActive}
                  onClick={() => onPriorityChange(option.value)}
                  colorClass={colorClass}
                  label={option.label}
                />
              )
            })}
          </FilterGroup>
        </div>

        <DrawerFooter className="flex-row gap-2 border-t bg-background">
          <Button
            type="button"
            variant="ghost"
            className="h-11 flex-1"
            onClick={onReset}
            disabled={activeCount === 0}
          >
            Wyczyść
          </Button>
          <DrawerClose asChild>
            <Button type="button" className="h-11 flex-1">
              Pokaż wyniki
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  )
}

type FilterChipProps = {
  active: boolean
  onClick: () => void
  label: string
  colorClass?: string
}

function FilterChip({ active, onClick, label, colorClass }: FilterChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'inline-flex min-h-10 items-center gap-1.5 rounded-full border px-3.5 text-sm font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
        active
          ? cn(
              'shadow-sm',
              colorClass || 'border-primary/40 bg-primary/10 text-primary',
            )
          : 'border-border/60 bg-background text-muted-foreground hover:bg-accent/50',
      )}
    >
      {active ? <Check className="h-3.5 w-3.5" /> : null}
      <span>{label}</span>
    </button>
  )
}
