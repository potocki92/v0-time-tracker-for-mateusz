'use client'

import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronRight,
  History,
  Pencil,
  Trash2,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/helpers'
import { ClientDisplay } from '@/components/common/ClientDisplay'
import type {
  ClientsSortDirection,
  ClientsSortKey,
  ClientWithStats,
} from '../_domain/clients.types'
import { WORK_TYPE_LABELS } from '../_domain/clients.constants'

type Props = {
  clients:       ClientWithStats[]
  sortKey:       ClientsSortKey
  sortDirection: ClientsSortDirection
  onSort:        (key: ClientsSortKey) => void
  onEdit:        (client: ClientWithStats) => void
  onDelete:      (client: ClientWithStats) => void
  onShowHistory: (client: ClientWithStats) => void
}

export function ClientsTable({
  clients,
  sortKey,
  sortDirection,
  onSort,
  onEdit,
  onDelete,
  onShowHistory,
}: Props) {
  return (
    <>
      {/* DESKTOP */}
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead className="w-[34%]">
                <SortButton
                  label="Klient"
                  active={sortKey === 'name'}
                  direction={sortDirection}
                  onClick={() => onSort('name')}
                />
              </TableHead>
              <TableHead>Typ / Waluta</TableHead>
              <TableHead className="text-right">
                <SortButton
                  label="Stawka"
                  active={sortKey === 'rate'}
                  direction={sortDirection}
                  onClick={() => onSort('rate')}
                  align="right"
                />
              </TableHead>
              <TableHead className="text-right">
                <SortButton
                  label="Zarobki"
                  active={sortKey === 'earnings'}
                  direction={sortDirection}
                  onClick={() => onSort('earnings')}
                  align="right"
                />
              </TableHead>
              <TableHead className="text-right">
                <SortButton
                  label="Godziny / Dni"
                  active={sortKey === 'hours'}
                  direction={sortDirection}
                  onClick={() => onSort('hours')}
                  align="right"
                />
              </TableHead>
              <TableHead className="w-[1%] text-right">Akcje</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clients.map((c) => (
              <DesktopRow
                key={c.id}
                client={c}
                onEdit={onEdit}
                onDelete={onDelete}
                onShowHistory={onShowHistory}
              />
            ))}
          </TableBody>
        </Table>
      </div>

      {/* MOBILE */}
      <ul className="divide-y md:hidden">
        {clients.map((c) => (
          <MobileRow
            key={c.id}
            client={c}
            onEdit={onEdit}
            onDelete={onDelete}
            onShowHistory={onShowHistory}
          />
        ))}
      </ul>
    </>
  )
}

// ── Desktop row ──────────────────────────────────────────────────────────────

function DesktopRow({
  client,
  onEdit,
  onDelete,
  onShowHistory,
}: {
  client:        ClientWithStats
  onEdit:        (c: ClientWithStats) => void
  onDelete:      (c: ClientWithStats) => void
  onShowHistory: (c: ClientWithStats) => void
}) {
  const unit = client.work_type === 'hourly' ? 'h' : (client.unit ?? 'szt')
  return (
    <TableRow className="group">
      <TableCell>
        <div className="flex items-center gap-3">
          <span
            className="h-10 w-1 shrink-0 rounded-full"
            style={{ backgroundColor: client.color }}
            aria-hidden
          />
          <ClientDisplay client={client} variant="row" size="md" />
        </div>
      </TableCell>
      <TableCell>
        <div className="flex flex-wrap gap-1">
          <Badge variant="secondary" className="text-xs">
            {WORK_TYPE_LABELS[client.work_type]}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {client.currency}
          </Badge>
        </div>
      </TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-2">
          <div className="font-semibold tabular-nums">
            {formatCurrency(client.rate, client.currency)}
            <span className="text-xs font-normal text-muted-foreground">/{unit}</span>
          </div>
          {client.rateHistoryCount > 1 && (
            <button
              type="button"
              onClick={() => onShowHistory(client)}
              className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground transition-colors hover:bg-muted/70 hover:text-foreground"
              title="Pokaż historię stawek"
            >
              <History className="h-3 w-3" />
              {client.rateHistoryCount}
            </button>
          )}
        </div>
      </TableCell>
      <TableCell className="text-right tabular-nums">
        {client.totalEarningsInClientCurrency > 0
          ? formatCurrency(client.totalEarningsInClientCurrency, client.currency)
          : <span className="text-muted-foreground">—</span>}
      </TableCell>
      <TableCell className="text-right tabular-nums">
        {client.totalHours > 0 ? (
          <span>
            {client.totalHours.toFixed(1)}h
            <span className="text-xs text-muted-foreground"> · {client.totalDays} dni</span>
          </span>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-1 opacity-60 transition-opacity group-hover:opacity-100">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onShowHistory(client)}
            title="Historia stawek"
          >
            <History className="h-4 w-4" />
            <span className="sr-only">Historia stawek</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onEdit(client)}
            title="Edytuj"
          >
            <Pencil className="h-4 w-4" />
            <span className="sr-only">Edytuj</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive"
            onClick={() => onDelete(client)}
            title="Usuń"
          >
            <Trash2 className="h-4 w-4" />
            <span className="sr-only">Usuń</span>
          </Button>
        </div>
      </TableCell>
    </TableRow>
  )
}

// ── Mobile row ───────────────────────────────────────────────────────────────

function MobileRow({
  client,
  onEdit,
  onDelete,
  onShowHistory,
}: {
  client:        ClientWithStats
  onEdit:        (c: ClientWithStats) => void
  onDelete:      (c: ClientWithStats) => void
  onShowHistory: (c: ClientWithStats) => void
}) {
  const unit = client.work_type === 'hourly' ? 'h' : (client.unit ?? 'szt')
  return (
    <li className="flex items-center gap-3 px-4 py-3 active:bg-muted/50">
      <span
        className="h-12 w-1 shrink-0 rounded-full"
        style={{ backgroundColor: client.color }}
        aria-hidden
      />
      <button
        type="button"
        onClick={() => onEdit(client)}
        className="flex min-w-0 flex-1 items-center gap-3 text-left"
      >
        <div className="min-w-0 flex-1">
          <ClientDisplay client={client} variant="cell" size="md" showMeta={false} />
          <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
            <span>{WORK_TYPE_LABELS[client.work_type]}</span>
            <span className="h-3 w-px bg-border" />
            <span className="tabular-nums">
              {formatCurrency(client.rate, client.currency)}/{unit}
            </span>
            {client.rateHistoryCount > 1 && (
              <span
                onClick={(e) => {
                  e.stopPropagation()
                  onShowHistory(client)
                }}
                className="inline-flex items-center gap-0.5 rounded-full bg-muted px-1.5 py-0.5 text-[10px]"
              >
                <History className="h-2.5 w-2.5" />
                {client.rateHistoryCount}
              </span>
            )}
          </div>
        </div>
      </button>
      <div className="flex items-center gap-0.5">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive hover:text-destructive"
          onClick={() => onDelete(client)}
          title="Usuń"
        >
          <Trash2 className="h-4 w-4" />
          <span className="sr-only">Usuń</span>
        </Button>
        <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden />
      </div>
    </li>
  )
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function SortButton({
  label,
  active,
  direction,
  onClick,
  align = 'left',
}: {
  label:     string
  active:    boolean
  direction: ClientsSortDirection
  onClick:   () => void
  align?:    'left' | 'right'
}) {
  const Icon = !active
    ? ArrowUpDown
    : direction === 'asc'
    ? ArrowUp
    : ArrowDown
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-muted-foreground transition-colors hover:text-foreground',
        align === 'right' && 'justify-end',
      )}
    >
      {align === 'right' && <Icon className="h-3 w-3" />}
      {label}
      {align === 'left' && <Icon className="h-3 w-3" />}
    </button>
  )
}
