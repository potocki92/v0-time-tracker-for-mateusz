'use client'

import { Mail, MapPin, Phone, Star, Zap } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { clientInitials, clientNameToColor } from '@/components/common/ClientDisplay'
import { formatCurrency } from '@/lib/helpers'
import { cn } from '@/lib/utils'
import {
  ACTIVITY_LABELS,
  ACTIVITY_PILL,
  WORK_TYPE_LABELS,
} from '../domain/clients.constants'
import {
  buildContactLinks,
  deriveActivity,
  formatRelativeDate,
} from '../domain/clients.selectors'
import type { ClientPeriodStats, ClientWithStats } from '../domain/clients.types'
import { LINEAR } from './clients.tokens'

type Props = {
  client: ClientWithStats
  monthStats: ClientPeriodStats
  onOpen: (client: ClientWithStats) => void
}

/**
 * Karta „Aktualny zleceniodawca" — pierwsza rzecz na ekranie sekcji.
 *
 * Odpowiada na pytanie, którego lista alfabetyczna nie odpowiadała: dla kogo
 * teraz pracuję i ile mi to daje. Wzorzec wizualny z FeaturedProjectCard.
 */
export function CurrentClientCard({ client, monthStats, onOpen }: Props) {
  const activity = deriveActivity(client)
  const initials = clientInitials(client.name)
  const color = client.color?.trim() ? client.color : clientNameToColor(client.name)
  const unit = client.work_type === 'hourly' ? 'h' : (client.unit ?? 'szt')
  const lastEntry = formatRelativeDate(client.lastEntryDate)
  const { phoneHref, mailHref, mapsHref } = buildContactLinks(client)
  const hasContact = Boolean(phoneHref || mailHref || mapsHref)

  return (
    <section
      className={cn(
        'relative overflow-hidden rounded-2xl border',
        LINEAR.border,
        LINEAR.surface,
      )}
      aria-labelledby="current-client-name"
    >
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-px"
        style={{ background: 'linear-gradient(90deg, transparent, #10b98199, transparent)' }}
      />

      <header
        className={cn(
          'flex flex-wrap items-center gap-2 border-b px-4 py-3 sm:px-5',
          LINEAR.borderInset,
        )}
      >
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-2xs font-semibold text-emerald-300 ring-1 ring-emerald-500/30">
          <Zap className="h-3 w-3" aria-hidden />
          Aktualny zleceniodawca
        </span>
        <span
          className={cn(
            'inline-flex items-center rounded-full px-2 py-0.5 text-2xs font-semibold',
            ACTIVITY_PILL[activity],
          )}
        >
          {ACTIVITY_LABELS[activity]}
        </span>
        {client.is_default && (
          <span
            className="inline-flex items-center gap-1 rounded-full bg-[#17171a] px-2 py-0.5 text-2xs font-semibold text-zinc-300 ring-1 ring-[#2a2a30]"
            title="Klient domyślny dla nowych wpisów"
          >
            <Star className="h-3 w-3 fill-amber-500 text-amber-500" aria-hidden />
            Domyślny
          </span>
        )}
      </header>

      {/* Nakładka klikalna na całą kartę — treść zostaje czytelna dla czytników
          ekranu, a przyciski kontaktu poniżej mają własną warstwę. */}
      <div className="relative">
        <button
          type="button"
          onClick={() => onOpen(client)}
          aria-label={`Szczegóły klienta ${client.name}`}
          className="absolute inset-0 z-0 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500/60"
        />

        <div className="pointer-events-none relative z-[1] space-y-4 px-4 py-4 sm:px-5">
          <div className="flex items-start gap-3">
            <Avatar className={cn('size-11 shrink-0 border', LINEAR.border)}>
              <AvatarFallback
                className="text-sm font-bold text-white"
                style={{ background: color }}
              >
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <h2
                id="current-client-name"
                className="line-clamp-2 text-lg font-semibold leading-snug tracking-tight text-white sm:text-xl"
              >
                {client.name}
              </h2>
              <p className="mt-1 text-xs text-zinc-400">
                {formatCurrency(client.rate, client.currency)}
                <span className="text-zinc-500">/{unit}</span>
                {' · '}
                {WORK_TYPE_LABELS[client.work_type]}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Metric
              label="Godziny (mies.)"
              value={monthStats.hours > 0 ? `${formatHours(monthStats.hours)} h` : '—'}
              meta={monthStats.days > 0 ? `${monthStats.days} ${pluralizeDays(monthStats.days)}` : 'Brak wpisów'}
              empty={monthStats.hours <= 0}
            />
            <Metric
              label="Zarobek (mies.)"
              value={
                monthStats.earnings > 0
                  ? formatCurrency(monthStats.earnings, client.currency)
                  : '—'
              }
              empty={monthStats.earnings <= 0}
            />
            <Metric label="Ostatni wpis" value={lastEntry ?? '—'} empty={!lastEntry} />
            <Metric
              label="Łącznie godz."
              value={client.totalHours > 0 ? `${formatHours(client.totalHours)} h` : '—'}
              meta={
                client.totalEarningsInClientCurrency > 0
                  ? formatCurrency(client.totalEarningsInClientCurrency, client.currency)
                  : undefined
              }
              empty={client.totalHours <= 0}
            />
          </div>
        </div>
      </div>

      {hasContact && (
        <div className={cn('flex items-stretch gap-1.5 border-t px-4 py-3 sm:px-5', LINEAR.borderInset)}>
          {phoneHref && <ContactLink icon={<Phone className="size-4" />} label="Zadzwoń" href={phoneHref} />}
          {mailHref && <ContactLink icon={<Mail className="size-4" />} label="E-mail" href={mailHref} />}
          {mapsHref && <ContactLink icon={<MapPin className="size-4" />} label="Mapy" href={mapsHref} external />}
        </div>
      )}
    </section>
  )
}

function Metric({
  label,
  value,
  meta,
  empty,
}: {
  label: string
  value: string
  meta?: string
  /** Brak danych: wygaszamy wartość, żeby „—" czytało się jako pusty stan. */
  empty?: boolean
}) {
  return (
    <div className={cn('rounded-lg border px-3 py-2.5', LINEAR.borderInset, LINEAR.rowSurface)}>
      {/* min-h na dwie linie: gdy jedna etykieta się zawinie, a inne nie,
          wartości w siatce przestają stać w jednej linii. */}
      <p className="min-h-[2.4em] text-2xs font-semibold uppercase leading-[1.2] tracking-[0.16em] text-zinc-500">
        {label}
      </p>
      <p
        className={cn(
          'mt-0.5 truncate text-base font-semibold tabular-nums tracking-tight text-white sm:text-lg',
          empty && 'text-zinc-600',
        )}
      >
        {value}
      </p>
      {meta && <p className="mt-0.5 truncate text-2xs text-zinc-400">{meta}</p>}
    </div>
  )
}

function ContactLink({
  icon,
  label,
  href,
  external,
}: {
  icon: React.ReactNode
  label: string
  href: string
  external?: boolean
}) {
  return (
    <a
      href={href}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener noreferrer' : undefined}
      className={cn(
        'flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl border text-xs font-medium text-white transition-colors',
        LINEAR.border,
        LINEAR.surfaceElevated,
        'hover:border-emerald-500/40 hover:bg-emerald-500/10 hover:text-emerald-300',
      )}
    >
      <span className="text-zinc-400">{icon}</span>
      {label}
    </a>
  )
}

/** 7.5 → „7,5", 8 → „8" — bez zbędnego „,00" przy pełnych godzinach. */
function formatHours(hours: number): string {
  return Number.isInteger(hours)
    ? String(hours)
    : hours.toFixed(1).replace('.', ',')
}

function pluralizeDays(count: number): string {
  return count === 1 ? 'dzień' : 'dni'
}
