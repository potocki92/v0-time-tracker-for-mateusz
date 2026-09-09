import { getLocale } from 'next-intl/server'

import { DEFAULT_LOCALE, isAppLocale } from '@/i18n/config'

import { createFormat, type AppFormat } from './index'

/**
 * Formattery zwiazane z jezykiem BIEZACEGO ZADANIA — Server Components,
 * Server Actions i Route Handlery.
 */
export async function getFormat(): Promise<AppFormat> {
  const locale = await getLocale()
  return createFormat(isAppLocale(locale) ? locale : DEFAULT_LOCALE)
}
