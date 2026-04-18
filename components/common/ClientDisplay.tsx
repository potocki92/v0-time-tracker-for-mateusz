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
  sm: 'text-[9px]',
  md: 'text-[10px]',
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
  const meta      = client?.email || (client?.nip ? `NIP ${client.nip}` : null)

  if (variant === 'badge') {
    return (
      <Badge
        variant="outline"
        className={cn('gap-1.5 pl-1 pr-2 font-medium', className)}
      >
        <Avatar className={cn(AVATAR_SIZE[size])}>
          {avatarUrl ? <AvatarImage src={avatarUrl} alt={name} /> : null}
          <AvatarFallback
            className={cn('font-bold text-white', INITIALS_TEXT[size])}
            style={{ background: color }}
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
            className={cn('font-bold text-white', INITIALS_TEXT[size])}
            style={{ background: color }}
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
            className={cn('font-bold text-white', INITIALS_TEXT[size])}
            style={{ background: color }}
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
          className={cn('font-bold text-white', INITIALS_TEXT[size])}
          style={{ background: color }}
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
