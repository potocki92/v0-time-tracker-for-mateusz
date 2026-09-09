import type { ReactNode } from 'react'
import { NextIntlClientProvider } from 'next-intl'
import { getLocale } from 'next-intl/server'

import { MotionProvider } from '@/components/common/motion-provider'
import { toAppLocale } from '@/i18n/config'
import { loadMessages, pickMessages } from '@/i18n/messages'

import './landing.css'

/**
 * Layout landingu.
 *
 * `MotionProvider` (LazyMotion + `reducedMotion="user"`) stoi TUTAJ, nie w
 * roocie — animowane jest tylko to jedno poddrzewo, panel nie placi za nie
 * ani bajta.
 *
 * Tak samo z tlumaczeniami: do przegladarki jedzie tylko to, czego landing
 * naprawde uzywa — `marketing` (copy), `navigation` (mockup panelu i
 * przelacznik jezyka) i `common` (jednostki). Klucze faktur, ustawien czy
 * walidacji tu nie docieraja, a wersja niemiecka nie pobiera polskiej ani
 * angielskiej.
 */
export default async function MarketingLayout({ children }: { children: ReactNode }) {
  const locale = toAppLocale(await getLocale())
  const messages = pickMessages(await loadMessages(locale), ['marketing', 'navigation', 'common'])

  return (
    <>
      {/* Panel i landing dziela <html>; motyw uzytkownika nie moze rozjasnic
          strony marketingowej, ktora jest z zalozenia czarna. */}
      <style>{`html,body{background:#000!important;}`}</style>
      <div className="lp">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <MotionProvider>{children}</MotionProvider>
        </NextIntlClientProvider>
      </div>
    </>
  )
}
