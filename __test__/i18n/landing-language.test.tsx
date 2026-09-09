import { render, screen } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import { describe, expect, it } from 'vitest'

import { APP_LOCALES, type AppLocale } from '@/i18n/config'
import commonDe from '@/messages/de/common.json'
import commonEn from '@/messages/en/common.json'
import commonPl from '@/messages/pl/common.json'
import marketingDe from '@/messages/de/marketing.json'
import marketingEn from '@/messages/en/marketing.json'
import marketingPl from '@/messages/pl/marketing.json'
import navigationDe from '@/messages/de/navigation.json'
import navigationEn from '@/messages/en/navigation.json'
import navigationPl from '@/messages/pl/navigation.json'

import { AppFrame } from '@/app/[locale]/(marketing)/_landing/product/AppFrame'
import { EverythingElse } from '@/app/[locale]/(marketing)/_landing/sections/EverythingElse'
import { FinalCta } from '@/app/[locale]/(marketing)/_landing/sections/FinalCta'
import { ProjectsScreen } from '@/app/[locale]/(marketing)/_landing/product/screens/ProjectsScreen'

/**
 * Landing ma byc JEZYKOWO SPOJNY.
 *
 * Regresja, ktorej ten plik pilnuje: niemiecki naglowek nad polskim mockiem
 * pulpitu. Mockowana aplikacja jest czescia strony marketingowej, wiec musi
 * mowic tym samym jezykiem, co copy nad nia — lacznie z nawigacja, dolnym
 * paskiem i etykietami w tabelach.
 */
const MESSAGES: Record<AppLocale, Record<string, unknown>> = {
  pl: { marketing: marketingPl, navigation: navigationPl, common: commonPl },
  de: { marketing: marketingDe, navigation: navigationDe, common: commonDe },
  en: { marketing: marketingEn, navigation: navigationEn, common: commonEn },
}

/**
 * Frazy-sygnatury: krotkie, jednoznaczne dla jednego jezyka. Jesli wersja DE
 * pokaze „Faktury" albo „Invoices", test od razu wskaze, ktora warstwa
 * ekranu zostala w innym jezyku.
 */
const SIGNATURES: Record<AppLocale, string[]> = {
  pl: ['Faktury', 'Obszar roboczy', 'Wszystkie projekty', 'Godzinowe'],
  de: ['Rechnungen', 'Arbeitsbereich', 'Alle Projekte', 'Stundenbasis'],
  en: ['Invoices', 'Workspace', 'All projects', 'Hourly'],
}

function renderLanding(locale: AppLocale) {
  return render(
    <NextIntlClientProvider locale={locale} messages={MESSAGES[locale]}>
      <AppFrame active="invoices" label="mock">
        <ProjectsScreen />
      </AppFrame>
      <EverythingElse />
      <FinalCta />
    </NextIntlClientProvider>,
  )
}

describe.each(APP_LOCALES)('landing w jezyku %s', (locale) => {
  it('pokazuje wlasne frazy w kazdej warstwie ekranu', () => {
    renderLanding(locale)

    for (const phrase of SIGNATURES[locale]) {
      expect(screen.getAllByText(phrase, { exact: false }).length).toBeGreaterThan(0)
    }
  })

  it('nie przemyca ani jednej frazy z innego jezyka', () => {
    const { container } = renderLanding(locale)
    const text = container.textContent ?? ''

    const foreign = APP_LOCALES.filter((other) => other !== locale)
      .flatMap((other) => SIGNATURES[other])
      // „Invoices" i „Projects" bywaja identyczne miedzy DE a EN — sygnatura
      // ma sens tylko wtedy, gdy nie wystepuje w jezyku badanym.
      .filter((phrase) => !SIGNATURES[locale].includes(phrase))
      .filter((phrase) => text.includes(phrase))

    expect(foreign, `${locale}: obce frazy na ekranie — ${foreign.join(', ')}`).toEqual([])
  })

  it('nie zostawia nierozwiazanych kluczy tlumaczen', () => {
    const { container } = renderLanding(locale)
    const text = container.textContent ?? ''

    // `getMessageFallback` oddaje sciezke klucza — jesli wyladuje na ekranie,
    // znaczy ze komunikat nie istnieje w tym jezyku.
    expect(text).not.toMatch(/\b(marketing|navigation|common)\.[a-zA-Z]+\.[a-zA-Z]/)
  })
})

describe('landing — kompletna nawigacja mockupu', () => {
  it('kazda sekcja sidebara ma tlumaczenie w kazdym jezyku', () => {
    for (const locale of APP_LOCALES) {
      const { container, unmount } = render(
        <NextIntlClientProvider locale={locale} messages={MESSAGES[locale]}>
          <AppFrame active="dashboard" label="mock">
            <div />
          </AppFrame>
        </NextIntlClientProvider>,
      )
      const sections = MESSAGES[locale].navigation as { sections: Record<string, string> }
      // `clients` jest celowo ukryte w mockupie — patrz `product/nav.ts`.
      for (const [segment, label] of Object.entries(sections.sections)) {
        if (segment === 'clients') continue
        expect(container.textContent, `${locale}/${segment}`).toContain(label)
      }
      unmount()
    }
  })
})
