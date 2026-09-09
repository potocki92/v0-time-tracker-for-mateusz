'use client'

import { useTransition } from 'react'
import { useSearchParams } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'

import { setPreferredLocaleAction } from '@/i18n/actions'
import { APP_LOCALES, LOCALE_LABELS, type AppLocale } from '@/i18n/config'
import { usePathname, useRouter } from '@/i18n/navigation'
import { cn } from '@/lib/utils'

interface LocaleSwitcherProps {
  /** `segmented` — trzy przyciski PL/DE/EN; `compact` — te same, weziej. */
  variant?: 'segmented' | 'compact'
  className?: string
}

/**
 * Przelacznik jezyka interfejsu — JEDEN komponent dla landingu i panelu.
 *
 * Zachowanie:
 *  • zostaje na tej samej stronie (`/de/dashboard?range=current_week` →
 *    `/dashboard?range=current_week`), a nie wyrzuca na stone glowna,
 *  • zachowuje query string i kotwice (`/#automation` → `/de#automation`),
 *  • zapisuje wybor w trwalym ciasteczku przez Server Action, wiec decyzja
 *    przezywa restart przegladarki i wygrywa z geolokalizacja,
 *  • nie wylogowuje: to nawigacja klientowa, ciasteczka sesji nie sa ruszane,
 *  • dziala z klawiatury (zwykle `<button>` w `role="group"`),
 *  • nie polega na samej fladze — kod jezyka niesie tekst, a pelna nazwe
 *    dostaje czytnik ekranu.
 */
export function LocaleSwitcher({ variant = 'segmented', className }: LocaleSwitcherProps) {
  const t = useTranslations('navigation.localeSwitcher')
  const active = useLocale() as AppLocale
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function switchTo(locale: AppLocale) {
    if (locale === active) return

    const query = searchParams.toString()
    // Hash nigdy nie dociera do serwera, wiec czytamy go z przegladarki i
    // doklejamy do celu — inaczej zmiana jezyka na `/#automation` gubilaby
    // pozycje na stronie.
    const hash = typeof window === 'undefined' ? '' : window.location.hash

    startTransition(async () => {
      await setPreferredLocaleAction(locale)
      router.replace(`${pathname}${query ? `?${query}` : ''}${hash}`, { locale })
    })
  }

  return (
    <div
      role="group"
      aria-label={t('label')}
      className={cn(
        'inline-flex items-center gap-0.5 rounded-lg border border-white/10 p-0.5',
        variant === 'compact' && 'gap-0',
        className,
      )}
    >
      {APP_LOCALES.map((locale) => {
        const isActive = locale === active
        return (
          <button
            key={locale}
            type="button"
            lang={locale}
            onClick={() => switchTo(locale)}
            disabled={isPending}
            aria-current={isActive ? 'true' : undefined}
            className={cn(
              'rounded-md px-2 py-1 text-xs font-medium transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current',
              isActive
                ? 'bg-white/10 text-white'
                : 'text-white/60 hover:text-white disabled:opacity-50',
            )}
          >
            {/* Kod jest tym, co widac; pelna nazwa dopowiada jezyk czytnikowi
                ekranu. Oba zostaja w nazwie dostepnej („PL Polski"), bo sam
                kod bywa dwuznaczny, a sama flaga nie jest jezykiem. */}
            <span>{LOCALE_LABELS[locale].code}</span>
            <span className="sr-only">{LOCALE_LABELS[locale].native}</span>
          </button>
        )
      })}
    </div>
  )
}
