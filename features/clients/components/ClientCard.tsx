'use client'

import { useState } from 'react'
import {
  ChevronDown,
  Globe,
  History,
  Mail,
  MapPin,
  MoreHorizontal,
  Pencil,
  Phone,
  Star,
  Trash2,
} from 'lucide-react'
import { SectionEyebrow } from '@/components/common/section/SectionEyebrow'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import {
  clientInitials,
  clientNameToColor,
  readableTextColor,
} from '@/components/common/ClientDisplay'
import { formatCurrency } from '@/lib/helpers'
import { cn } from '@/lib/utils'
import {
  ACTIVITY_DOT,
  ACTIVITY_LABELS,
  WORK_TYPE_LABELS,
} from '../domain/clients.constants'
import {
  buildContactLinks,
  deriveActivity,
  formatRelativeDate,
  toExternalUrl,
} from '../domain/clients.selectors'
import type { ClientWithStats } from '../domain/clients.types'
import { LINEAR } from '@/components/ui/tokens'

interface ClientCardProps {
  client: ClientWithStats
  onEdit: (client: ClientWithStats) => void
  onDelete: (client: ClientWithStats) => void
  onShowHistory: (client: ClientWithStats) => void
}

function pluralizeEntries(count: number): string {
  if (count === 1) return 'wpis'
  const mod10 = count % 10
  const mod100 = count % 100
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return 'wpisy'
  return 'wpisów'
}

export function ClientCard({ client, onEdit, onDelete, onShowHistory }: ClientCardProps) {
  const [actionsOpen, setActionsOpen] = useState(false)
  const [detailsOpen, setDetailsOpen] = useState(false)

  const activity = deriveActivity(client)
  const isActive = activity === 'active'
  const initials = clientInitials(client.name)
  const color = client.color?.trim() ? client.color : clientNameToColor(client.name)
  const unit = client.work_type === 'hourly' ? 'h' : (client.unit ?? 'szt')
  const lastEntry = formatRelativeDate(client.lastEntryDate)
  const { phoneHref, mailHref, mapsHref, address } = buildContactLinks(client)
  const hasDetails = Boolean(client.nip || client.regon || address || client.website)

  function withClose(action: () => void) {
    return () => {
      setActionsOpen(false)
      action()
    }
  }

  return (
    <article
      className={cn(
        'group relative overflow-hidden rounded-2xl border py-4 pl-5 pr-4 transition-colors',
        LINEAR.rowSurface,
        isActive
          ? 'border-emerald-500/25 ring-1 ring-emerald-500/15'
          : cn(LINEAR.borderInset, 'hover:border-zinc-700/60'),
      )}
    >
      {/* Szyna stanu — jedyne miejsce, gdzie kolor niesie informację.
          Kolor klienta zostaje na awatarze jako jego tożsamość. */}
      <span
        aria-hidden
        className={cn(
          'absolute inset-y-0 left-0 w-1',
          isActive ? 'bg-emerald-500 shadow-[0_0_10px_color-mix(in_oklab,var(--primary)_45%,transparent)]' : LINEAR.rail,
        )}
      />

      <header className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="relative shrink-0">
            <Avatar className="size-11">
              <AvatarFallback
                className="text-sm font-bold"
                style={{ background: color, color: readableTextColor(color) }}
              >
                {initials}
              </AvatarFallback>
            </Avatar>
            <span
              aria-hidden
              title={ACTIVITY_LABELS[activity]}
              className={cn(
                'absolute -bottom-0.5 -right-0.5 size-3 rounded-full ring-2 ring-surface-3',
                ACTIVITY_DOT[activity],
              )}
            />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              {/* 15 px + line-clamp-2: nazwy firm ucięte do jednej linii
                  („ELITT HOME SPÓŁKA Z OGR…") były nie do rozróżnienia. */}
              <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-white">
                {client.name}
              </h3>
              {client.is_default && (
                <Star
                  className="size-3.5 shrink-0 fill-amber-500 text-amber-500"
                  aria-label="Domyślny klient"
                />
              )}
            </div>
            <p className="truncate text-xs text-zinc-400">
              {client.email || client.city || client.phone || ACTIVITY_LABELS[activity]}
            </p>
          </div>
        </div>

        <Sheet open={actionsOpen} onOpenChange={setActionsOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="-mr-2 h-9 w-9 shrink-0 text-zinc-400"
              aria-label={`Więcej akcji dla ${client.name}`}
            >
              <MoreHorizontal className="size-5" />
            </Button>
          </SheetTrigger>
          <SheetContent
            side="bottom"
            className="rounded-t-2xl px-0 pb-[max(env(safe-area-inset-bottom),1rem)]"
          >
            <SheetHeader className="pb-2">
              <SheetTitle className="text-base">{client.name}</SheetTitle>
            </SheetHeader>
            <div className="flex flex-col">
              <ActionItem
                icon={<Pencil className="size-4" />}
                label="Edytuj klienta"
                onClick={withClose(() => onEdit(client))}
              />
              <ActionItem
                icon={<History className="size-4" />}
                label="Historia stawek"
                onClick={withClose(() => onShowHistory(client))}
              />
              {client.website && (
                <ActionItem
                  icon={<Globe className="size-4" />}
                  label="Otwórz stronę www"
                  href={toExternalUrl(client.website)}
                  external
                />
              )}
              <ActionItem
                icon={<Trash2 className="size-4" />}
                label="Usuń klienta"
                destructive
                onClick={withClose(() => onDelete(client))}
              />
            </div>
          </SheetContent>
        </Sheet>
      </header>

      {/* Typ / waluta / liczba wpisów to metadane, nie nagłówek — jedna linia
          drobnym drukiem zamiast trzech pigułek konkurujących z nazwą. */}
      <p className="mt-2.5 flex items-center gap-1.5 text-2xs text-zinc-400">
        <span>{WORK_TYPE_LABELS[client.work_type]}</span>
        <span aria-hidden>·</span>
        <span>{client.currency}</span>
        {client.workEntriesCount > 0 && (
          <>
            <span aria-hidden>·</span>
            <span>
              {client.workEntriesCount} {pluralizeEntries(client.workEntriesCount)}
            </span>
          </>
        )}
        <span className="ml-auto flex items-center gap-1 text-zinc-400">
          <span className={cn('size-1.5 rounded-full', ACTIVITY_DOT[activity])} aria-hidden />
          {ACTIVITY_LABELS[activity]}
        </span>
      </p>

      <dl
        className={cn(
          'mt-3 grid grid-cols-2 gap-x-3 gap-y-3 border-t pt-3 text-xs',
          LINEAR.borderInset,
        )}
      >
        <Metric
          label="Stawka"
          value={
            <>
              {formatCurrency(client.rate, client.currency)}
              <span className="text-2xs font-normal text-zinc-400">/{unit}</span>
            </>
          }
        />
        <Metric label="Ostatni wpis" value={lastEntry ?? '—'} empty={!lastEntry} />
        <Metric
          label="Godziny"
          value={client.totalHours > 0 ? `${formatHours(client.totalHours)} h` : '—'}
          empty={client.totalHours <= 0}
        />
        <Metric
          label="Zarobek"
          value={
            client.totalEarningsInClientCurrency > 0
              ? formatCurrency(client.totalEarningsInClientCurrency, client.currency)
              : '—'
          }
          empty={client.totalEarningsInClientCurrency <= 0}
        />
      </dl>

      {(phoneHref || mailHref || mapsHref) && (
        <div className="mt-3 flex items-stretch gap-1.5">
          {phoneHref && (
            <QuickAction icon={<Phone className="size-4" />} label="Zadzwoń" href={phoneHref} />
          )}
          {mailHref && (
            <QuickAction icon={<Mail className="size-4" />} label="E-mail" href={mailHref} />
          )}
          {mapsHref && (
            <QuickAction icon={<MapPin className="size-4" />} label="Mapy" href={mapsHref} external />
          )}
        </div>
      )}

      {hasDetails && (
        <Collapsible open={detailsOpen} onOpenChange={setDetailsOpen} className="mt-3">
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="flex min-h-9 w-full items-center justify-between gap-2 rounded-md px-1 py-1 text-2xs font-medium text-zinc-400 transition-colors hover:text-white"
            >
              <span>{detailsOpen ? 'Ukryj szczegóły' : 'Pokaż szczegóły'}</span>
              <ChevronDown
                className={cn('size-3.5 transition-transform', detailsOpen && 'rotate-180')}
              />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent className="data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0">
            <dl className={cn('mt-2 space-y-1.5 rounded-lg border p-3 text-xs', LINEAR.borderInset, LINEAR.surface)}>
              {client.nip && <DetailRow label="NIP" value={client.nip} />}
              {client.regon && <DetailRow label="REGON" value={client.regon} />}
              {address && <DetailRow label="Adres" value={address} />}
              {client.website && <DetailRow label="WWW" value={client.website} />}
            </dl>
          </CollapsibleContent>
        </Collapsible>
      )}
    </article>
  )
}

function Metric({
  label,
  value,
  empty,
}: {
  label: string
  value: React.ReactNode
  /** Brak danych: „—" ma czytać się jako pusty stan, nie jako awaria. */
  empty?: boolean
}) {
  return (
    <div className="min-w-0">
      <SectionEyebrow as="dt">{label}</SectionEyebrow>
      <dd
        className={cn(
          'mt-0.5 truncate text-xs font-semibold tabular-nums text-white',
          empty && 'text-zinc-400',
        )}
      >
        {value}
      </dd>
    </div>
  )
}

/** 7.5 → „7,5", 8 → „8" — bez zbędnego „,00" przy pełnych godzinach. */
function formatHours(hours: number): string {
  return Number.isInteger(hours) ? String(hours) : hours.toFixed(1).replace('.', ',')
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="shrink-0 text-zinc-400">{label}</dt>
      <dd className="min-w-0 truncate text-right font-medium text-zinc-200">{value}</dd>
    </div>
  )
}

interface QuickActionProps {
  icon: React.ReactNode
  label: string
  href: string
  external?: boolean
}

function QuickAction({ icon, label, href, external }: QuickActionProps) {
  return (
    <a
      href={href}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener noreferrer' : undefined}
      className={cn(
        'flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl border text-xs font-medium text-white transition-colors',
        LINEAR.border,
        LINEAR.surface,
        'hover:border-emerald-500/40 hover:bg-emerald-500/10 hover:text-emerald-300',
      )}
    >
      <span className="text-zinc-400">{icon}</span>
      {label}
    </a>
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
