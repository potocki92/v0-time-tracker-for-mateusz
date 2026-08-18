'use client'

import type { ComponentType } from 'react'
import { Check, Monitor, Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { cn } from '@/lib/utils'
import { COLOR_THEMES, type ColorTheme, type ColorThemeId } from '@/lib/themes/color-themes'
import {
  useColorTheme,
  useSetColorTheme,
} from '@/hooks/stores/useColorThemeStore'

type ModeOption = {
  id: 'light' | 'dark' | 'system'
  label: string
  icon: ComponentType<{ className?: string }>
}

const MODE_OPTIONS: readonly ModeOption[] = [
  { id: 'light', label: 'Jasny', icon: Sun },
  { id: 'dark', label: 'Ciemny', icon: Moon },
  { id: 'system', label: 'Systemowy', icon: Monitor },
] as const

function ThemeSwatch({ theme }: { theme: ColorTheme }) {
  // Podgląd: mini-karta z 3 akcentami nad tłem. Light i dark tło widoczne bok w bok.
  return (
    <div className="relative overflow-hidden rounded-lg border bg-card">
      <div className="grid grid-cols-2">
        <div
          className="flex items-center justify-center gap-1.5 p-3"
          style={{ background: theme.preview.background }}
          aria-hidden="true"
        >
          <span
            className="h-3 w-3 rounded-full shadow-sm"
            style={{ background: theme.preview.primary }}
          />
          <span
            className="h-3 w-3 rounded-full shadow-sm"
            style={{ background: theme.preview.accent }}
          />
          <span
            className="h-3 w-3 rounded-full shadow-sm"
            style={{ background: theme.preview.tertiary }}
          />
        </div>
        <div
          className="flex items-center justify-center gap-1.5 p-3"
          style={{ background: theme.preview.backgroundDark }}
          aria-hidden="true"
        >
          <span
            className="h-3 w-3 rounded-full"
            style={{ background: theme.preview.primary }}
          />
          <span
            className="h-3 w-3 rounded-full"
            style={{ background: theme.preview.accent }}
          />
          <span
            className="h-3 w-3 rounded-full"
            style={{ background: theme.preview.tertiary }}
          />
        </div>
      </div>
    </div>
  )
}

function ThemeCard({
  theme,
  selected,
  onSelect,
}: {
  theme: ColorTheme
  selected: boolean
  onSelect: (id: ColorThemeId) => void
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={() => onSelect(theme.id)}
      className={cn(
        'group relative flex flex-col gap-3 rounded-xl border p-3 text-left transition-all',
        'hover:border-primary/60 hover:shadow-sm',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        selected
          ? 'border-primary ring-2 ring-primary/30'
          : 'border-border',
      )}
    >
      <ThemeSwatch theme={theme} />

      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-semibold leading-tight">{theme.name}</p>
          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
            {theme.description}
          </p>
        </div>

        {selected && (
          <span
            aria-hidden="true"
            className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm"
          >
            <Check className="h-3 w-3" />
          </span>
        )}
      </div>
    </button>
  )
}

export function AppearanceSettings() {
  const activeTheme = useColorTheme()
  const setColorTheme = useSetColorTheme()
  const { theme: mode, setTheme: setMode } = useTheme()

  return (
    <section className="space-y-5 rounded-xl border p-4">
      <header>
        <h3 className="text-sm font-semibold">Wygląd aplikacji</h3>
        <p className="text-xs text-muted-foreground">
          Wybierz paletę kolorów oraz tryb jasny/ciemny. Zmiany są natychmiastowe.
        </p>
      </header>

      {/* Tryb jasny / ciemny / systemowy */}
      <div
        role="radiogroup"
        aria-label="Tryb kolorów"
        className="grid grid-cols-3 gap-2"
      >
        {MODE_OPTIONS.map(({ id, label, icon: Icon }) => {
          const selected = mode === id
          return (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => setMode(id)}
              className={cn(
                'flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                selected
                  ? 'border-primary bg-primary/10 text-foreground ring-1 ring-primary/30'
                  : 'border-border text-muted-foreground hover:bg-accent hover:text-accent-foreground',
              )}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              <span>{label}</span>
            </button>
          )
        })}
      </div>

      {/* Paleta motywów */}
      <div className="space-y-3">
        <p className="text-xs font-medium text-muted-foreground">Motyw kolorystyczny</p>
        <div
          role="radiogroup"
          aria-label="Motyw kolorystyczny"
          className="grid grid-cols-1 gap-3 sm:grid-cols-2"
        >
          {COLOR_THEMES.map((theme) => (
            <ThemeCard
              key={theme.id}
              theme={theme}
              selected={activeTheme === theme.id}
              onSelect={setColorTheme}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
