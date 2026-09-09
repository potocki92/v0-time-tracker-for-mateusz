import { describe, expect, it } from 'vitest'

import { resolveLocale } from '@/i18n/locale'

/**
 * Negocjacja jezyka to jedyna regula, ktora decyduje „jaki jezyk widzi ten
 * uzytkownik". Kazdy scenariusz z zadania ma tu swoj przypadek.
 *
 * NADRZEDNA ZASADA: swiadomy wybor uzytkownika zawsze wygrywa z automatyczna
 * detekcja. Geolokalizacja jest wylacznie pierwsza podpowiedzia.
 */
describe('resolveLocale — priorytety', () => {
  it('jezyk z adresu wygrywa z geolokalizacja', () => {
    expect(resolveLocale({ explicit: 'pl', country: 'DE' })).toEqual({
      locale: 'pl',
      source: 'explicit',
    })
    expect(resolveLocale({ explicit: 'de', country: 'PL' })).toEqual({
      locale: 'de',
      source: 'explicit',
    })
  })

  it('preferencja konta wygrywa z ciasteczkiem i geolokalizacja', () => {
    expect(
      resolveLocale({ userPreference: 'en', cookie: 'pl', country: 'DE' }),
    ).toEqual({ locale: 'en', source: 'user' })
  })

  it('ciasteczko wygrywa z geolokalizacja', () => {
    expect(resolveLocale({ cookie: 'en', country: 'DE' })).toEqual({
      locale: 'en',
      source: 'cookie',
    })
  })

  it('bez preferencji decyduje kraj', () => {
    expect(resolveLocale({ country: 'DE' })).toEqual({ locale: 'de', source: 'geo' })
    expect(resolveLocale({ country: 'PL' })).toEqual({ locale: 'pl', source: 'geo' })
  })

  it('kraj bez mapowania oddaje decyzje przegladarce', () => {
    expect(resolveLocale({ country: 'NL', acceptLanguage: 'de-DE,de;q=0.9' })).toEqual({
      locale: 'de',
      source: 'header',
    })
    expect(resolveLocale({ country: 'NL', acceptLanguage: 'en-GB,en;q=0.9' })).toEqual({
      locale: 'en',
      source: 'header',
    })
    expect(resolveLocale({ country: 'US', acceptLanguage: 'en-US,en;q=0.9' })).toEqual({
      locale: 'en',
      source: 'header',
    })
  })

  it('nieobslugiwany jezyk przegladarki spada na jezyk bazowy', () => {
    expect(resolveLocale({ country: 'NL', acceptLanguage: 'fr-FR,fr;q=0.9' })).toEqual({
      locale: 'pl',
      source: 'default',
    })
  })

  it('brak jakichkolwiek naglowkow daje jezyk bazowy', () => {
    expect(resolveLocale()).toEqual({ locale: 'pl', source: 'default' })
    expect(resolveLocale({})).toEqual({ locale: 'pl', source: 'default' })
  })
})

describe('resolveLocale — odpornosc na smiecie', () => {
  it('podrobione ciasteczko jest pomijane, nie wywraca requestu', () => {
    expect(resolveLocale({ cookie: '<script>alert(1)</script>' })).toEqual({
      locale: 'pl',
      source: 'default',
    })
    expect(resolveLocale({ cookie: 'klingon', country: 'DE' })).toEqual({
      locale: 'de',
      source: 'geo',
    })
  })

  it('pusty i uszkodzony Accept-Language nie rzuca', () => {
    expect(resolveLocale({ acceptLanguage: '' }).locale).toBe('pl')
    expect(resolveLocale({ acceptLanguage: ';;;q=' }).locale).toBe('pl')
    expect(resolveLocale({ acceptLanguage: '*' }).locale).toBe('pl')
  })

  it('kraj podany malymi literami i ze spacjami nadal dziala', () => {
    expect(resolveLocale({ country: ' de ' })).toEqual({ locale: 'de', source: 'geo' })
  })

  it('nieznana wartosc `explicit` nie blokuje dalszych zrodel', () => {
    expect(resolveLocale({ explicit: 'xx', cookie: 'en' })).toEqual({
      locale: 'en',
      source: 'cookie',
    })
  })
})

describe('resolveLocale — scenariusze akceptacyjne', () => {
  it('pierwsze wejscie z Niemiec bez preferencji daje niemiecki', () => {
    expect(resolveLocale({ country: 'DE' }).locale).toBe('de')
  })

  it('po recznej zmianie na polski Niemcy juz nie przelaczaja jezyka', () => {
    expect(resolveLocale({ cookie: 'pl', country: 'DE' }).locale).toBe('pl')
  })

  it('wybor przezywa zmiane kraju', () => {
    for (const country of ['DE', 'NL', 'US', 'XX']) {
      expect(resolveLocale({ cookie: 'pl', country }).locale).toBe('pl')
    }
  })

  it('nowy uzytkownik w Polsce dostaje polski', () => {
    expect(resolveLocale({ country: 'PL', acceptLanguage: 'en-US,en;q=0.9' })).toEqual({
      locale: 'pl',
      source: 'geo',
    })
  })
})
