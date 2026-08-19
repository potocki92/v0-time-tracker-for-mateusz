'use client'

import { memo } from 'react'
import { Star } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

/**
 * Pola klienta wymagane do spójnego renderowania w całej aplikacji.
 * Nie importujemy `Client` z @/lib/types — chcemy żeby komponent działał
 * zarówno dla pełnego Client, jak i dla lekkich projekcji (id + name + color).
 */
export interface ClientDisplayData {
  id?:         string
  name:        string | null | undefined
  color?:      string | null
  email?:      string | null
  nip?:        string | null
  avatar_url?: string | null
  is_default?: boolean | null
}

export type ClientDisplayVariant =
  | 'cell'        // wiersz w tabeli (avatar + nazwa, w jednej linii)
  | 'row'         // wiersz z podtytułem (avatar + nazwa + meta)
  | 'badge'       // kompaktowy badge do użycia np. w toastach, kartach
  | 'select-item' // pozycja w select/combobox

export type ClientDisplaySize = 'sm' | 'md' | 'lg'

interface ClientDisplayProps {
  client:      ClientDisplayData | null | undefined
  /** Fallback label gdy client === null */
  emptyLabel?: string
  /** Fallback label gdy client.name puste */
  unknownLabel?: string
  variant?:    ClientDisplayVariant
  size?:       ClientDisplaySize
  className?:  string
  /** Pokaż gwiazdkę dla klientów oznaczonych is_default. Domyślnie true. */
  showDefaultStar?: boolean
  /** Pokaż podtytuł (email/NIP) w wariantach 'row'. Domyślnie true. */
  showMeta?:   boolean
}

/**
 * Deterministyczny kolor z nazwy klienta — fallback gdy klient nie ma własnego color.
 * Zachowuje zgodność z poprzednią logiką w invoices/_domain/utils#stringToColor.
 */
export function clientNameToColor(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  const h = Math.abs(hash) % 360
  return `hsl(${h}, 55%, 48%)`
}

/**
 * Czarny albo bialy tekst na kolorze klienta — inicjaly byly zawsze biale,
 * wiec na jasnym akcencie (domyslne #10b981) mialy 2.5:1, ponizej progu AA.
 * Prog 0.179 to punkt, w ktorym bialy i czarny tekst maja rowny kontrast.
 */
export function readableTextColor(background: string): string {
  const rgb = toRgb(background)
  if (!rgb) return '#ffffff'
  const channel = (v: number) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)
  const [r, g, b] = rgb.map((v) => channel(v / 255))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.179 ? '#0a0a0a' : '#ffffff'
}

/** Obsluguje oba formaty uzywane w aplikacji: `#rrggbb` i `hsl(h, s%, l%)`. */
function toRgb(color: string): [number, number, number] | null {
  const hex = color.trim().match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i)
  if (hex) {
    const v = hex[1].length === 3 ? hex[1].replace(/./g, (c) => c + c) : hex[1]
    return [0, 2, 4].map((i) => parseInt(v.slice(i, i + 2), 16)) as [number, number, number]
  }

  const hsl = color.trim().match(/^hsl\(\s*([\d.]+)[,\s]+([\d.]+)%[,\s]+([\d.]+)%\s*\)$/i)
  if (!hsl) return null

  const [h, sat, light] = [Number(hsl[1]) / 360, Number(hsl[2]) / 100, Number(hsl[3]) / 100]
  const c = (1 - Math.abs(2 * light - 1)) * sat
  const x = c * (1 - Math.abs(((h * 6) % 2) - 1))
  const m = light - c / 2
  const seg = Math.floor(h * 6) % 6
  const [r, g, b] = [
    [c, x, 0],
    [x, c, 0],
    [0, c, x],
    [0, x, c],
    [x, 0, c],
    [c, 0, x],
  ][seg]
  return [r, g, b].map((v) => Math.round((v + m) * 255)) as [number, number, number]
}

export function clientInitials(name: string | null | undefined): string {
  if (!name) return '??'
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '??'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

const AVATAR_SIZE: Record<ClientDisplaySize, string> = {
  sm: 'size-5',
  md: 'size-6',
  lg: 'size-8',
}

const INITIALS_TEXT: Record<ClientDisplaySize, string> = {
  sm: 'text-2xs',
  md: 'text-2xs',
  lg: 'text-xs',
}

function resolveColor(client: ClientDisplayData, name: string): string {
  if (client.color && client.color.trim().length > 0) return client.color
  return clientNameToColor(name)
}

/**
 * Uniwersalny, spójny komponent do wyświetlania klienta w tabeli, badge'u,
 * selektorze i wszędzie indziej. Jedno źródło prawdy dla avatar + kolor + nazwa.
 *
 * memoizowany — rodzice często przerysowują tabele przy nie-związanych zmianach stanu.
 */
export const ClientDisplay = memo(function ClientDisplay({
  client,
  emptyLabel   = 'Bez klienta',
  unknownLabel = 'Nieznany klient',
  variant      = 'cell',
  size         = 'md',
  className,
  showDefaultStar = true,
  showMeta     = true,
}: ClientDisplayProps) {
  const name =
    client === null || client === undefined
      ? emptyLabel
      : (client.name?.trim() || unknownLabel)

  const color     = client ? resolveColor(client, name) : 'hsl(0, 0%, 60%)'
  const initials  = clientInitials(name)
  const avatarUrl = client?.avatar_url ?? null
  const taxPrefix = client?.nip && /^\d{10}$/.test(client.nip.trim()) ? 'NIP' : 'Tax ID'
  const meta      = client?.email || (client?.nip ? `${taxPrefix} ${client.nip}` : null)

  if (variant === 'badge') {
    return (
      <Badge
        variant="outline"
        className={cn('gap-1.5 pl-1 pr-2 font-medium', className)}
      >
        <Avatar className={cn(AVATAR_SIZE[size])}>
          {avatarUrl ? <AvatarImage src={avatarUrl} alt={name} /> : null}
          <AvatarFallback
            className={cn('font-bold', INITIALS_TEXT[size])}
            style={{ background: color, color: readableTextColor(color) }}
          >
            {initials}
          </AvatarFallback>
        </Avatar>
        <span className="truncate">{name}</span>
        {showDefaultStar && client?.is_default && (
          <Star className="size-3 fill-amber-500 text-amber-500" aria-label="Domyślny" />
        )}
      </Badge>
    )
  }

  if (variant === 'select-item') {
    return (
      <span className={cn('flex min-w-0 items-center gap-2', className)}>
        <Avatar className={cn(AVATAR_SIZE[size], 'shrink-0')}>
          {avatarUrl ? <AvatarImage src={avatarUrl} alt={name} /> : null}
          <AvatarFallback
            className={cn('font-bold', INITIALS_TEXT[size])}
            style={{ background: color, color: readableTextColor(color) }}
          >
            {initials}
          </AvatarFallback>
        </Avatar>
        <span className="truncate">{name}</span>
        {showDefaultStar && client?.is_default && (
          <Star className="size-3 shrink-0 fill-amber-500 text-amber-500" aria-label="Domyślny" />
        )}
      </span>
    )
  }

  if (variant === 'row') {
    return (
      <div className={cn('flex min-w-0 items-center gap-3', className)}>
        <Avatar className={cn(AVATAR_SIZE[size === 'sm' ? 'md' : 'lg'], 'shrink-0')}>
          {avatarUrl ? <AvatarImage src={avatarUrl} alt={name} /> : null}
          <AvatarFallback
            className={cn('font-bold', INITIALS_TEXT[size])}
            style={{ background: color, color: readableTextColor(color) }}
          >
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="truncate font-medium">{name}</span>
            {showDefaultStar && client?.is_default && (
              <Star className="size-3.5 fill-amber-500 text-amber-500" aria-label="Domyślny" />
            )}
          </div>
          {showMeta && meta && (
            <span className="block truncate text-xs text-muted-foreground">{meta}</span>
          )}
        </div>
      </div>
    )
  }

  // variant === 'cell' (default)
  return (
    <div className={cn('flex min-w-0 items-center gap-2', className)}>
      <Avatar className={cn(AVATAR_SIZE[size], 'shrink-0')}>
        {avatarUrl ? <AvatarImage src={avatarUrl} alt={name} /> : null}
        <AvatarFallback
          className={cn('font-bold', INITIALS_TEXT[size])}
          style={{ background: color, color: readableTextColor(color) }}
        >
          {initials}
        </AvatarFallback>
      </Avatar>
      <span className="truncate">{name}</span>
      {showDefaultStar && client?.is_default && (
        <Star className="size-3 shrink-0 fill-amber-500 text-amber-500" aria-label="Domyślny" />
      )}
    </div>
  )
})
