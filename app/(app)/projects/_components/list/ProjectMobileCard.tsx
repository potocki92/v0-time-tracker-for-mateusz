'use client'

import { useState } from 'react'
import {
  CalendarDays,
  ChevronDown,
  Clock,
  Flag,
  MoreHorizontal,
  Pencil,
  Target,
  Trash2,
  Wallet,
} from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Progress } from '@/components/ui/progress'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import { formatCurrency, formatDate } from '@/lib/helpers'
import { PRIORITY_LABELS, PROJECT_STATUS_LABELS, type Project } from '@/lib/types'
import {
  PROJECT_PRIORITY_BADGE_CLASS,
  PROJECT_STATUS_BADGE_CLASS,
} from '../../_domain/projects.constants'
import type { ProjectProgress } from '../../_domain/projects.types'

type Props = {
  project: Project
  clientName?: string
  selected: boolean
  progress?: ProjectProgress
  onToggleSelect: (checked: boolean) => void
  onEdit: () => void
  onDelete: () => void
}

const DAY_MS = 24 * 60 * 60 * 1000

const STATUS_DOT: Record<Project['status'], string> = {
  planned: 'bg-slate-400',
  in_progress: 'bg-blue-500',
  completed: 'bg-emerald-500',
  on_hold: 'bg-amber-500',
}

function projectInitials(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('') || '·'
  )
}

function formatRelativeDeadline(iso: string): { label: string; overdue: boolean; soon: boolean } {
  const days = Math.floor((new Date(iso).getTime() - Date.now()) / DAY_MS)
  if (days < 0) return { label: `${Math.abs(days)} dni po terminie`, overdue: true, soon: false }
  if (days === 0) return { label: 'dziś', overdue: false, soon: true }
  if (days === 1) return { label: 'jutro', overdue: false, soon: true }
  if (days < 7) return { label: `za ${days} dni`, overdue: false, soon: true }
  return { label: formatDate(iso), overdue: false, soon: false }
}

/**
 * Mobile-first project card. Visually aligned with ClientCard / InvoiceCard:
 *   - same article shell (rounded-2xl, border, hover state)
 *   - header with colored avatar + name + subtitle and a MoreHorizontal trigger
 *     opening a bottom Sheet for secondary actions
 *   - badge row (status, priority)
 *   - dl grid for primary metrics (budget, deadline)
 *   - optional progress bar
 *   - collapsible "Pokaż szczegóły" with description and dates
 *
 * Selection (a project-only feature) is preserved via a small checkbox overlay
 * in the top-left corner so it doesn't dominate the layout.
 */
export function ProjectMobileCard({
  project,
  clientName,
  selected,
  progress,
  onToggleSelect,
  onEdit,
  onDelete,
}: Props) {
  const [actionsOpen, setActionsOpen] = useState(false)
  const [detailsOpen, setDetailsOpen] = useState(false)

  const initials = projectInitials(project.name)
  const subtitle = clientName ?? 'Bez klienta'
  const hasDeadline = Boolean(project.end_date)
  const deadline = hasDeadline ? formatRelativeDeadline(project.end_date as string) : null
  const overdue = !!deadline?.overdue && project.status !== 'completed'
  const hasProgress = !!progress && progress.target > 0
  const hasDetails = Boolean(
    project.description || project.start_date || project.end_date || project.budget_amount,
  )

  function withClose(action: () => void) {
    return () => {
      setActionsOpen(false)
      action()
    }
  }

  return (
    <article
      className={cn(
        'group relative rounded-2xl border bg-card p-4 shadow-sm transition-colors hover:border-border',
        selected ? 'border-primary/50 ring-1 ring-primary/40' : 'border-border/60',
      )}
    >
      {/* Selection toggle — kept compact and out of the way so it doesn't
          break visual parity with ClientCard / InvoiceCard. */}
      <Checkbox
        checked={selected}
        onCheckedChange={(checked) => onToggleSelect(checked === true)}
        aria-label={`Zaznacz projekt ${project.name}`}
        className={cn(
          'absolute left-3 top-3 z-10 size-4 rounded-md border-border/70 bg-background/90 shadow-sm backdrop-blur transition-opacity',
          selected ? 'opacity-100' : 'opacity-60 group-hover:opacity-100',
        )}
      />

      <header className="flex items-start justify-between gap-3 pl-7">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="relative shrink-0">
            <Avatar className="size-11">
              <AvatarFallback
                className="text-sm font-bold text-white"
                style={{ background: project.color }}
              >
                {initials}
              </AvatarFallback>
            </Avatar>
            <span
              aria-hidden
              title={PROJECT_STATUS_LABELS[project.status]}
              className={cn(
                'absolute -bottom-0.5 -right-0.5 size-3 rounded-full ring-2 ring-card',
                STATUS_DOT[project.status],
              )}
            />
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="truncate text-sm font-semibold text-foreground" title={project.name}>
              {project.name}
            </h3>
            <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
          </div>
        </div>

        <Sheet open={actionsOpen} onOpenChange={setActionsOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="-mr-2 h-9 w-9 shrink-0 text-muted-foreground"
              aria-label={`Więcej akcji dla projektu ${project.name}`}
            >
              <MoreHorizontal className="size-5" />
            </Button>
          </SheetTrigger>
          <SheetContent
            side="bottom"
            className="rounded-t-2xl px-0 pb-[max(env(safe-area-inset-bottom),1rem)]"
          >
            <SheetHeader className="pb-2">
              <SheetTitle className="text-base">{project.name}</SheetTitle>
            </SheetHeader>
            <div className="flex flex-col">
              <ActionItem
                icon={<Pencil className="size-4" />}
                label="Edytuj projekt"
                onClick={withClose(onEdit)}
              />
              <ActionItem
                icon={<Trash2 className="size-4" />}
                label="Usuń projekt"
                destructive
                onClick={withClose(onDelete)}
              />
            </div>
          </SheetContent>
        </Sheet>
      </header>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <Badge
          variant="outline"
          className={cn('text-[11px]', PROJECT_STATUS_BADGE_CLASS[project.status])}
        >
          {PROJECT_STATUS_LABELS[project.status]}
        </Badge>
        <Badge
          variant="outline"
          className={cn(
            'inline-flex items-center gap-1 text-[11px]',
            PROJECT_PRIORITY_BADGE_CLASS[project.priority],
          )}
        >
          <Flag className="h-3 w-3" />
          {PRIORITY_LABELS[project.priority]}
        </Badge>
        {overdue ? (
          <Badge variant="outline" className="border-rose-500/30 bg-rose-500/10 text-[11px] text-rose-700 dark:text-rose-300">
            <Clock className="mr-1 h-3 w-3" />
            Po terminie
          </Badge>
        ) : null}
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-3 border-t border-border/60 pt-3 text-xs">
        <div className="min-w-0">
          <dt className="flex items-center gap-1 text-[10px] uppercase tracking-wide text-muted-foreground">
            <Wallet className="h-3 w-3" />
            Budżet
          </dt>
          <dd className="mt-0.5 truncate text-sm font-semibold tabular-nums text-foreground">
            {project.budget_amount ? formatCurrency(Number(project.budget_amount), 'PLN') : '—'}
          </dd>
        </div>
        <div className="min-w-0 text-right">
          <dt className="flex items-center justify-end gap-1 text-[10px] uppercase tracking-wide text-muted-foreground">
            <CalendarDays className="h-3 w-3" />
            Termin
          </dt>
          <dd
            className={cn(
              'mt-0.5 truncate text-sm font-medium tabular-nums text-foreground',
              overdue && 'text-rose-600 dark:text-rose-400',
              deadline?.soon && !overdue && 'text-amber-600 dark:text-amber-400',
            )}
          >
            {deadline?.label ?? '—'}
          </dd>
        </div>
      </dl>

      {hasProgress ? (
        <div className="mt-3 space-y-1.5">
          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Target className="h-3 w-3" />
              {Math.round(progress!.quantityDone)} / {progress!.target}
            </span>
            <span className="font-semibold tabular-nums text-foreground">
              {Math.round(progress!.percent)}%
            </span>
          </div>
          <Progress
            value={progress!.percent}
            className={cn(
              'h-1.5',
              project.status === 'completed' ? '[&>div]:bg-emerald-500' : '[&>div]:bg-blue-500',
            )}
          />
        </div>
      ) : null}

      {hasDetails ? (
        <Collapsible open={detailsOpen} onOpenChange={setDetailsOpen} className="mt-3">
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="flex w-full items-center justify-between gap-2 rounded-md px-1 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <span>{detailsOpen ? 'Ukryj szczegóły' : 'Pokaż szczegóły'}</span>
              <ChevronDown
                className={cn('size-3.5 transition-transform', detailsOpen && 'rotate-180')}
              />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent className="data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0">
            <dl className="mt-2 space-y-1.5 rounded-lg bg-muted/40 p-3 text-xs">
              {project.start_date ? (
                <DetailRow label="Start" value={formatDate(project.start_date)} />
              ) : null}
              {project.end_date ? (
                <DetailRow label="Koniec" value={formatDate(project.end_date)} />
              ) : null}
              {project.description ? (
                <DetailRow label="Opis" value={project.description} multiline />
              ) : null}
            </dl>
          </CollapsibleContent>
        </Collapsible>
      ) : null}
    </article>
  )
}

function DetailRow({
  label,
  value,
  multiline,
}: {
  label: string
  value: string
  multiline?: boolean
}) {
  return (
    <div
      className={cn(
        'gap-3',
        multiline ? 'flex flex-col' : 'flex items-start justify-between',
      )}
    >
      <dt className="shrink-0 text-muted-foreground">{label}</dt>
      <dd
        className={cn(
          'min-w-0 font-medium text-foreground',
          multiline ? 'whitespace-pre-line break-words' : 'truncate text-right',
        )}
      >
        {value}
      </dd>
    </div>
  )
}

interface ActionItemProps {
  icon: React.ReactNode
  label: string
  onClick?: () => void
  href?: string
  external?: boolean
  destructive?: boolean
}

function ActionItem({ icon, label, onClick, href, external, destructive }: ActionItemProps) {
  const className = cn(
    'flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-medium transition-colors hover:bg-muted/60',
    destructive ? 'text-destructive' : 'text-foreground',
  )

  if (href) {
    return (
      <a
        href={href}
        target={external ? '_blank' : undefined}
        rel={external ? 'noopener noreferrer' : undefined}
        className={className}
      >
        <span className={destructive ? 'text-destructive' : 'text-muted-foreground'}>{icon}</span>
        {label}
      </a>
    )
  }

  return (
    <button type="button" onClick={onClick} className={className}>
      <span className={destructive ? 'text-destructive' : 'text-muted-foreground'}>{icon}</span>
      {label}
    </button>
  )
}
