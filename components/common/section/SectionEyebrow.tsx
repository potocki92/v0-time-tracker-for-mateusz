import type { ElementType, ReactNode } from 'react'
import { LINEAR } from '@/components/ui/tokens'
import { cn } from '@/lib/utils'

/**
 * Etykieta nad nagłówkiem lub wartością. Sekcje miały sześć różnych wartości
 * `tracking` na tym samym wzorcu (`text-2xs font-semibold uppercase`) — tu
 * zostaje jedna, `0.18em`, czyli ta z `linear.tokens.ts`.
 *
 * `as` istnieje, bo eyebrow bywa nagłówkiem sekcji (`h2`/`h3`), a nie zawsze
 * akapitem — bez tego migracja gubiłaby poziomy nagłówków.
 *
 * Tam, gdzie element nie jest nasz (Radix `DropdownMenuLabel`) albo potrzebuje
 * atrybutu spoza tego API (`<label htmlFor>`), tę samą klasę bierze się wprost
 * z `LINEAR.eyebrow` — token jest źródłem, komponent tylko go opakowuje.
 */
export function SectionEyebrow({
  children,
  className,
  as: Tag = 'p',
}: {
  children: ReactNode
  className?: string
  as?: ElementType
}) {
  return (
    <Tag
      data-slot="eyebrow"
      className={cn(LINEAR.eyebrow, className)}
    >
      {children}
    </Tag>
  )
}
