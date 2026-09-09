import { describe, expect, it } from 'vitest'

import { APP_LOCALES, DEFAULT_LOCALE } from '@/i18n/config'
import { alternateLanguages, localizedUrl } from '@/lib/seo/site'
import sitemap from '@/app/sitemap'
import robots from '@/app/robots'

/**
 * SEO wielojezyczne stoi na trzech rzeczach: kazda wersja ma WLASNY adres,
 * canonical wskazuje NA SIEBIE, a `hreflang` opisuje komplet wersji plus
 * `x-default`. Zlamanie ktorejkolwiek zamienia trzy wersje jezykowe w
 * zduplikowana tresc.
 */
describe('adresy wersji jezykowych', () => {
  it('jezyk bazowy nie dostaje prefiksu, pozostale dostaja', () => {
    expect(localizedUrl('pl', '/')).toMatch(/\/$|^[^/]+:\/\/[^/]+$/)
    expect(localizedUrl('de', '/')).toMatch(/\/de$/)
    expect(localizedUrl('en', '/')).toMatch(/\/en$/)
  })

  it('sciezka wewnetrzna zachowuje sie tak samo', () => {
    expect(localizedUrl('pl', '/dashboard')).toMatch(/\/dashboard$/)
    expect(localizedUrl('de', '/dashboard')).toMatch(/\/de\/dashboard$/)
    expect(localizedUrl('en', '/dashboard')).toMatch(/\/en\/dashboard$/)
  })
})

describe('hreflang', () => {
  const languages = alternateLanguages('/')

  it('opisuje kazdy obslugiwany jezyk', () => {
    for (const locale of APP_LOCALES) expect(languages[locale]).toBe(localizedUrl(locale, '/'))
  })

  it('ma x-default wskazujacy na jezyk bazowy', () => {
    expect(languages['x-default']).toBe(localizedUrl(DEFAULT_LOCALE, '/'))
  })

  it('nie zawiera niczego ponad jezyki i x-default', () => {
    expect(Object.keys(languages).sort()).toEqual([...APP_LOCALES, 'x-default'].sort())
  })
})

describe('sitemap', () => {
  it('publikuje kazda wersje jezykowa landingu', async () => {
    const entries = await sitemap()
    const urls = entries.map((entry) => entry.url)

    for (const locale of APP_LOCALES) expect(urls).toContain(localizedUrl(locale, '/'))
    expect(urls).toHaveLength(APP_LOCALES.length)
  })

  it('kazdy wpis niesie komplet alternates — inaczej to duplikaty tresci', async () => {
    for (const entry of await sitemap()) {
      expect(Object.keys(entry.alternates?.languages ?? {}).sort()).toEqual(
        [...APP_LOCALES, 'x-default'].sort(),
      )
    }
  })

  it('nie publikuje ani jednej trasy prywatnej', async () => {
    const urls = (await sitemap()).map((entry) => entry.url).join(' ')
    for (const segment of ['dashboard', 'invoices', 'settings', 'clients', 'auth']) {
      expect(urls).not.toContain(segment)
    }
  })
})

describe('robots', () => {
  /**
   * `robots()` ma dwie galezie: poza produkcja blokuje CALA strone, zeby
   * podglady Vercela nie trafialy do indeksu. Sprawdzamy galaz produkcyjna —
   * to ona decyduje o SEO.
   */
  const rules = () => {
    const previous = process.env.VERCEL_ENV
    process.env.VERCEL_ENV = 'production'
    try {
      const value = robots().rules
      return Array.isArray(value) ? value : [value]
    } finally {
      if (previous === undefined) delete process.env.VERCEL_ENV
      else process.env.VERCEL_ENV = previous
    }
  }

  it('odcina strefe prywatna w KAZDEJ wersji jezykowej', () => {
    const disallow = rules()
      .flatMap((rule) => (Array.isArray(rule.disallow) ? rule.disallow : [rule.disallow ?? '']))
      .filter(Boolean)

    for (const segment of ['dashboard', 'invoices', 'settings', 'auth']) {
      expect(disallow).toContain(`/${segment}/`)
      expect(disallow).toContain(`/de/${segment}/`)
      expect(disallow).toContain(`/en/${segment}/`)
    }
  })

  it('nie blokuje wersji jezykowych landingu', () => {
    const disallow = rules()
      .flatMap((rule) => (Array.isArray(rule.disallow) ? rule.disallow : [rule.disallow ?? '']))
      .filter(Boolean)

    expect(disallow).not.toContain('/de/')
    expect(disallow).not.toContain('/en/')
  })
})
