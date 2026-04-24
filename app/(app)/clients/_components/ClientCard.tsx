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
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { clientInitials, clientNameToColor } from '@/components/common/ClientDisplay'
import { formatCurrency } from '@/lib/helpers'
import { cn } from '@/lib/utils'
import { WORK_TYPE_LABELS } from '../_domain/clients.constants'
import type { ClientWithStats } from '../_domain/clients.types'

type ClientActivity = 'active' | 'dormant' | 'new'

interface ClientCardProps {
  client: ClientWithStats
  onEdit: (client: ClientWithStats) => void
  onDelete: (client: ClientWithStats) => void
  onShowHistory: (client: ClientWithStats) => void
}

const ACTIVITY_LABELS: Record<ClientActivity, string> = {
  active: 'Aktywny',
  dormant: 'Uśpiony',
  new: 'Nowy',
}

const ACTIVITY_DOT: Record<ClientActivity, string> = {
  active: 'bg-emerald-500',
  dormant: 'bg-amber-500',
  new: 'bg-sky-500',
}

const DAY_MS = 24 * 60 * 60 * 1000

function deriveActivity(client: ClientWithStats): ClientActivity {
  if (!client.lastEntryDate || client.workEntriesCount === 0) return 'new'
  const days = Math.floor((Date.now() - new Date(client.lastEntryDate).getTime()) / DAY_MS)
  if (days <= 30) return 'active'
  return 'dormant'
}

function formatRelativeDate(iso: string | null): string | null {
  if (!iso) return null
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / DAY_MS)
  if (days <= 0) return 'dziś'
  if (days === 1) return 'wczoraj'
  if (days < 30) return `${days} dni temu`
  if (days < 365) return `${Math.floor(days / 30)} mies. temu`
  return `${Math.floor(days / 365)} lat temu`
}

function formatAddress(c: ClientWithStats): string | null {
  const line2 = [c.postal_code, c.city].filter(Boolean).join(' ').trim()
  const full = [c.address?.trim(), line2].filter(Boolean).join(', ')
  return full.length > 0 ? full : null
}

function toExternalUrl(url: string): string {
  return /^https?:\/\//i.test(url) ? url : `https://${url}`
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
  const initials = clientInitials(client.name)
  const color = client.color?.trim() ? client.color : clientNameToColor(client.name)
  const unit = client.work_type === 'hourly' ? 'h' : (client.unit ?? 'szt')
  const lastEntry = formatRelativeDate(client.lastEntryDate)
  const address = formatAddress(client)
  const phoneHref = client.phone ? `tel:${client.phone.replace(/\s+/g, '')}` : null
  const mapsHref = address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
    : null
  const hasDetails = Boolean(client.nip || client.regon || address || client.website)

  function withClose(action: () => void) {
    return () => {
      setActionsOpen(false)
      action()
    }
  }

  return (
    <article className="group rounded-2xl border border-border/60 bg-card p-4 shadow-sm transition-colors hover:border-border">
      <header className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="relative shrink-0">
            <Avatar className="size-11">
              <AvatarFallback
                className="text-sm font-bold text-white"
                style={{ background: color }}
              >
                {initials}
              </AvatarFallback>
            </Avatar>
            <span
              aria-hidden
              title={ACTIVITY_LABELS[activity]}
              className={cn(
                'absolute -bottom-0.5 -right-0.5 size-3 rounded-full ring-2 ring-card',
                ACTIVITY_DOT[activity],
              )}
            />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <h3 className="truncate text-sm font-semibold text-foreground">{client.name}</h3>
              {client.is_default && (
                <Star
                  className="size-3.5 shrink-0 fill-amber-500 text-amber-500"
                  aria-label="Domyślny klient"
                />
              )}
            </div>
            <p className="truncate text-xs text-muted-foreground">
              {client.email || client.city || client.phone || ACTIVITY_LABELS[activity]}
            </p>
          </div>
        </div>

        <Sheet open={actionsOpen} onOpenChange={setActionsOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="-mr-2 h-9 w-9 shrink-0 text-muted-foreground"
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

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <Badge variant="secondary" className="text-[11px]">
          {WORK_TYPE_LABELS[client.work_type]}
        </Badge>
        <Badge variant="outline" className="text-[11px]">
          {client.currency}
        </Badge>
        {client.workEntriesCount > 0 && (
          <Badge variant="outline" className="text-[11px] text-muted-foreground">
            {client.workEntriesCount} {pluralizeEntries(client.workEntriesCount)}
          </Badge>
        )}
        <span className="ml-auto flex items-center gap-1 text-[11px] text-muted-foreground">
          <span className={cn('size-1.5 rounded-full', ACTIVITY_DOT[activity])} aria-hidden />
          {ACTIVITY_LABELS[activity]}
        </span>
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-3 border-t border-border/60 pt-3 text-xs">
        <div className="min-w-0">
          <dt className="text-[10px] uppercase tracking-wide text-muted-foreground">Stawka</dt>
          <dd className="mt-0.5 truncate text-sm font-semibold tabular-nums text-foreground">
            {formatCurrency(client.rate, client.currency)}
            <span className="text-[11px] font-normal text-muted-foreground">/{unit}</span>
          </dd>
        </div>
        <div className="min-w-0 text-right">
          <dt className="text-[10px] uppercase tracking-wide text-muted-foreground">
            Ostatni wpis
          </dt>
          <dd className="mt-0.5 truncate text-sm font-medium tabular-nums text-foreground">
            {lastEntry ?? '—'}
          </dd>
        </div>
      </dl>

      {(phoneHref || client.email || mapsHref) && (
        <div className="mt-3 flex items-stretch gap-1.5">
          {phoneHref && (
            <QuickAction icon={<Phone className="size-4" />} label="Zadzwoń" href={phoneHref} />
          )}
          {client.email && (
            <QuickAction
              icon={<Mail className="size-4" />}
              label="E-mail"
              href={`mailto:${client.email}`}
            />
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

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="shrink-0 text-muted-foreground">{label}</dt>
      <dd className="min-w-0 truncate text-right font-medium text-foreground">{value}</dd>
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
      className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl border border-border/60 bg-background text-xs font-medium text-foreground transition-colors hover:bg-muted active:bg-muted/80"
    >
      <span className="text-muted-foreground">{icon}</span>
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
