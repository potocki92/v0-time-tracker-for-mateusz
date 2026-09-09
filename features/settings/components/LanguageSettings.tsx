'use client'

import { useTranslations } from 'next-intl'

import { LocaleSwitcher } from '@/components/i18n/locale-switcher'

/**
 * Jezyk interfejsu w ustawieniach konta.
 *
 * Sekcja mowi wprost, czego wybor NIE zmienia — bo w tym produkcie jezyk UI,
 * waluta, strefa czasowa i `client.locale` to CZTERY NIEZALEZNE rzeczy.
 * Uzytkownik z polskim interfejsem moze miec klienta z `de-DE`, faktury w EUR
 * i strefe `Europe/Berlin`; przelacznik jezyka niczego z tego nie rusza.
 */
export function LanguageSettings() {
  const t = useTranslations('settings.language')

  return (
    <section className="space-y-3 rounded-xl border p-4">
      <header>
        <h3 className="text-sm font-semibold">{t('title')}</h3>
        <p className="text-xs text-muted-foreground">{t('description')}</p>
      </header>

      <LocaleSwitcher className="border-border" />
    </section>
  )
}
