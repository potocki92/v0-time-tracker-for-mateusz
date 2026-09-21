'use client'

import { createContext, useContext, type ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { DASHBOARD_SURFACE } from '@/components/ui/tokens'
import { cn } from '@/lib/utils'

/**
 * Chrome karty sekcji Pulpitu.
 *
 * Mieszka w `components/`, a nie w `features/dashboard/`, z tego samego powodu
 * co reszta tej warstwy i co paleta w `components/ui/tokens.ts`:
 * `__test__/config/module-boundaries.test.ts` zabrania importow
 * `features/*` -> `features/*`, a po te karte siega takze `features/trips`,
 * ktory stoi na Pulpicie jako sekcja „Wyjazdy".
 *
 * Przed tym plikiem tytul sekcji wisial NAD karta: osobny `<h2>` w powietrzu,
 * karta zaczynala sie dopiero pod nim, a w srodku karty stal drugi naglowek
 * z sama pigulka zakresu. Teraz naglowek jest CZESCIA karty — ikona, tytul,
 * zakres i akcja w jednym pasku, oddzielonym wlosem od tresci.
 *
 * Tytulu NIE podaje karta, tylko zlozenie Pulpitu (`dashboard-sections.tsx`)
 * przez context. To jest cala sztuczka: sekcja nie wie, czy stoi nad zagieciem
 * jako karta wiodaca, czy w panelu zwinietych — a uklad uzytkownika przesuwa ja
 * miedzy tymi miejscami jednym klikiem w „Dostosuj pulpit". Gdyby tytul byl
 * propsem karty, kazda sekcja niosla by wlasna kopie nazwy z rejestru i
 * przeniesienie sekcji rozjechaloby naglowek z etykieta landmarku.
 *
 * Dwa warianty:
 *   card   — sekcja nad zagieciem: powierzchnia + wlasny naglowek.
 *   inline — sekcja rozwinieta w panelu zwinietych: naglowek niesie juz
 *            wiersz-przelacznik <SectionShell>, wiec karta nie rysuje ani
 *            drugiego tytulu, ani drugiej ramki (karta w karcie).
 *
 * Landmark `<section aria-label>` zostaje w OBU wariantach — po nim chodzi
 * `e2e/dashboard-hierarchy.spec.ts` („zwinieta sekcja nie montuje karty").
 */
export interface DashboardSectionChrome {
  /** Tytul z rejestru sekcji — jedyne zrodlo nazwy landmarku i naglowka. */
  title: string
  /** Ikona sekcji z mapy prezentacji; `undefined` = sam tytul. */
  icon?: LucideIcon
  /** Wlasny zakres sekcji — pokazywany tylko, gdy nie idzie za zakladkami. */
  rangeLabel?: string
  variant: 'card' | 'inline'
}

const ChromeContext = createContext<DashboardSectionChrome | null>(null)

export function DashboardSectionChromeProvider({
  value,
  children,
}: {
  value: DashboardSectionChrome
  children: ReactNode
}) {
  return <ChromeContext.Provider value={value}>{children}</ChromeContext.Provider>
}

type Props = {
  /** Element przy tytule — licznik pozycji, pigulka stanu. */
  meta?: ReactNode
  /** Akcja naglowka — „Zobacz wszystkie", „Dodaj". */
  actions?: ReactNode
  /**
   * `false` dla kart, ktore same dziela sie na wiersze z wlasnym dopelnieniem
   * (listy z pelnowymiarowymi wlosami miedzy wierszami).
   */
  padded?: boolean
  className?: string
  children: ReactNode
}

export function DashboardSectionCard({
  meta,
  actions,
  padded = true,
  className,
  children,
}: Props) {
  const chrome = useContext(ChromeContext)
  const inline = chrome?.variant === 'inline'
  const Icon = chrome?.icon

  return (
    <section
      aria-label={chrome?.title || undefined}
      className={cn(
        'min-w-0',
        !inline && cn(DASHBOARD_SURFACE.card, 'dashboard-card overflow-hidden'),
        className,
      )}
    >
      {inline ? (
        // Tytul i zakres niesie wiersz-przelacznik panelu. Zostaje sama akcja,
        // zeby „Zobacz wszystkie" nie znikalo po rozwinieciu sekcji z listy.
        (meta || actions) && (
          <div className="flex items-center justify-end gap-2 pb-2">
            {meta}
            {actions}
          </div>
        )
      ) : (
        <header className="flex min-h-[44px] items-center gap-2 border-b border-hairline px-4 py-2.5">
          {Icon && <Icon className="size-[18px] shrink-0 text-brand-400" aria-hidden />}
          <h2 className="min-w-0 flex-1 truncate text-sm font-semibold leading-tight text-white">
            {chrome?.title}
          </h2>
          {meta}
          {actions}
          <DashboardRangeBadge label={chrome?.rangeLabel} />
        </header>
      )}

      <div className={padded ? 'px-4 py-4' : undefined}>{children}</div>
    </section>
  )
}

/**
 * Etykieta wlasnego zakresu sekcji („najblizszy wyjazd", „ostatnie 53 tygodnie").
 *
 * Wspoldzielona przez naglowek karty i wiersz panelu zwinietych — obie muszą
 * wygladac tak samo, bo sekcja przechodzi miedzy nimi jednym klikiem. Pigulka,
 * nie przycisk: to opis okresu, a nie akcja.
 */
export function DashboardRangeBadge({ label }: { label?: string }) {
  if (!label) return null
  return (
    <span className="inline-flex h-6 shrink-0 items-center rounded-full border border-hairline bg-surface-2 px-2.5 text-2xs leading-none text-zinc-400">
      {label}
    </span>
  )
}
