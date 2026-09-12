import type { AppLocale } from './config'
import { DEFAULT_LOCALE } from './config'

/**
 * Ladowanie tlumaczen.
 *
 * Podzial na przestrzenie nazw idzie za architektura feature'ow repo
 * (`messages/<locale>/<namespace>.json`). Jeden plik na jezyk bylby nieczytelny
 * przy kilkuset kluczach i nie dalby sie podzielic miedzy landing a panel.
 *
 * Do przegladarki jedzie WYLACZNIE aktywny jezyk i wylacznie te przestrzenie,
 * ktorych dana czesc aplikacji naprawde uzywa — landing dostaje `marketing`,
 * panel `dashboard`/`invoices`/…; patrz `pickMessages`.
 */

export const MESSAGE_NAMESPACES = [
  'common',
  'navigation',
  'marketing',
  'auth',
  'dashboard',
  'calendar',
  'projects',
  'clients',
  'invoices',
  'reports',
  'accounting',
  'settings',
  'validation',
  'errors',
  'seo',
] as const

export type MessageNamespace = (typeof MESSAGE_NAMESPACES)[number]

export type Messages = Record<MessageNamespace, Record<string, unknown>>

/**
 * Statyczna mapa importow zamiast `import(\`../messages/${locale}/…\`)`:
 * dynamiczny literal zmusilby bundler do wciagniecia WSZYSTKICH jezykow do
 * jednego chunka, wiec uzytkownik niemiecki pobieralby takze polski i
 * angielski. Tutaj kazdy plik jest osobnym, leniwym modulem.
 */
const LOADERS: Record<AppLocale, Record<MessageNamespace, () => Promise<{ default: Record<string, unknown> }>>> = {
  pl: {
    common: () => import('../messages/pl/common.json'),
    navigation: () => import('../messages/pl/navigation.json'),
    marketing: () => import('../messages/pl/marketing.json'),
    auth: () => import('../messages/pl/auth.json'),
    dashboard: () => import('../messages/pl/dashboard.json'),
    calendar: () => import('../messages/pl/calendar.json'),
    projects: () => import('../messages/pl/projects.json'),
    clients: () => import('../messages/pl/clients.json'),
    invoices: () => import('../messages/pl/invoices.json'),
    reports: () => import('../messages/pl/reports.json'),
    accounting: () => import('../messages/pl/accounting.json'),
    settings: () => import('../messages/pl/settings.json'),
    validation: () => import('../messages/pl/validation.json'),
    errors: () => import('../messages/pl/errors.json'),
    seo: () => import('../messages/pl/seo.json'),
  },
  de: {
    common: () => import('../messages/de/common.json'),
    navigation: () => import('../messages/de/navigation.json'),
    marketing: () => import('../messages/de/marketing.json'),
    auth: () => import('../messages/de/auth.json'),
    dashboard: () => import('../messages/de/dashboard.json'),
    calendar: () => import('../messages/de/calendar.json'),
    projects: () => import('../messages/de/projects.json'),
    clients: () => import('../messages/de/clients.json'),
    invoices: () => import('../messages/de/invoices.json'),
    reports: () => import('../messages/de/reports.json'),
    accounting: () => import('../messages/de/accounting.json'),
    settings: () => import('../messages/de/settings.json'),
    validation: () => import('../messages/de/validation.json'),
    errors: () => import('../messages/de/errors.json'),
    seo: () => import('../messages/de/seo.json'),
  },
  en: {
    common: () => import('../messages/en/common.json'),
    navigation: () => import('../messages/en/navigation.json'),
    marketing: () => import('../messages/en/marketing.json'),
    auth: () => import('../messages/en/auth.json'),
    dashboard: () => import('../messages/en/dashboard.json'),
    calendar: () => import('../messages/en/calendar.json'),
    projects: () => import('../messages/en/projects.json'),
    clients: () => import('../messages/en/clients.json'),
    invoices: () => import('../messages/en/invoices.json'),
    reports: () => import('../messages/en/reports.json'),
    accounting: () => import('../messages/en/accounting.json'),
    settings: () => import('../messages/en/settings.json'),
    validation: () => import('../messages/en/validation.json'),
    errors: () => import('../messages/en/errors.json'),
    seo: () => import('../messages/en/seo.json'),
  },
}

export async function loadMessages(locale: AppLocale): Promise<Messages> {
  const loaders = LOADERS[locale] ?? LOADERS[DEFAULT_LOCALE]
  const entries = await Promise.all(
    MESSAGE_NAMESPACES.map(async (namespace) => [namespace, (await loaders[namespace]()).default] as const),
  )
  return Object.fromEntries(entries) as Messages
}

/**
 * Wycinek tlumaczen dla `NextIntlClientProvider`.
 *
 * Landing nie ma czego szukac w kluczach faktur, a panel w kluczach
 * marketingu — bez tego filtra kazda strona wysylalaby do przegladarki
 * komplet tlumaczen aplikacji.
 */
export function pickMessages<T extends MessageNamespace>(
  messages: Messages,
  namespaces: readonly T[],
): Pick<Messages, T> {
  const picked = {} as Pick<Messages, T>
  for (const namespace of namespaces) picked[namespace] = messages[namespace]
  return picked
}
