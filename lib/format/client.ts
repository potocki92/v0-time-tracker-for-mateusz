'use client'

import { useLocale } from 'next-intl'

import { DEFAULT_LOCALE, isAppLocale } from '@/i18n/config'

import { createFormat, type AppFormat } from './index'

/**
 * Formattery zwiazane z jezykiem AKTUALNEGO renderu — Client Components.
 *
 * Jezyk bierze sie z `NextIntlClientProvider`, ktory dostaje go z serwera,
 * wiec serwer i przegladarka formatuja identycznie. Zadnego `navigator.language`
 * — to bylo by zrodlo bledow hydracji.
 */
export function useFormat(): AppFormat {
  const locale = useLocale()
  return createFormat(isAppLocale(locale) ? locale : DEFAULT_LOCALE)
}
