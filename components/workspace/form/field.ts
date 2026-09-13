import { LINEAR } from '@/components/ui/tokens'
import { cn } from '@/lib/utils'

/**
 * Język pól formularza w panelu.
 *
 * Recipe, nie komponent-wrapper: pola panelu to w większości natywne
 * `<select>` i `<input type="date">` (kalendarz i lista systemowa są na
 * telefonie lepsze niż cokolwiek, co narysujemy sami), a wrapper wokół
 * natywnego elementu nie wnosiłby nic poza kolejną warstwą propsów.
 * Shadcnowe `Input`/`Select`/`Textarea` zostają nietknięte — używa ich też
 * strefa publiczna (landing, auth), która ma jasny motyw.
 *
 * Geometria jest ta sama co w filtrach Raportów: `h-11` (cel dotykowy 44 px),
 * `rounded-xl`, kontur hairline, jeden pierścień focusu.
 */
export const WORKSPACE_FIELD = cn(
  'h-11 w-full rounded-xl border px-3 text-sm text-zinc-200',
  LINEAR.border,
  LINEAR.surface,
  'placeholder:text-zinc-400',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500/60',
  'disabled:cursor-not-allowed disabled:opacity-50',
)

/** Pole wielowierszowe — ta sama skóra, wysokość z liczby wierszy. */
export const WORKSPACE_FIELD_MULTILINE = cn(
  'w-full rounded-xl border px-3 py-2.5 text-sm text-zinc-200',
  LINEAR.border,
  LINEAR.surface,
  'placeholder:text-zinc-400',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500/60',
  'disabled:cursor-not-allowed disabled:opacity-50',
)

/** Etykieta pola — ten sam eyebrow co nagłówki sekcji. */
export const WORKSPACE_FIELD_LABEL = LINEAR.eyebrow
