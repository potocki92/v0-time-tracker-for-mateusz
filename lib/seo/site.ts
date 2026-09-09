import { APP_LOCALES, DEFAULT_LOCALE, type AppLocale } from '@/i18n/config'

/**
 * Centralna konfiguracja SEO/brandingu.
 *
 * Jedno źródło prawdy dla metadanych, JSON-LD, sitemap oraz robots.
 * Czytane po stronie serwera i klienta — bez odwołań do server-only env.
 */

const rawUrl =
  process.env.NEXT_PUBLIC_APP_URL ??
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined) ??
  'http://localhost:3000'

const SITE_URL = rawUrl.replace(/\/+$/, '')

/**
 * Nazwa produktu. NIE jest tlumaczona — marka zostaje marka w kazdym jezyku.
 *
 * UWAGA (do decyzji produktowej, poza zakresem i18n): repozytorium mialo dwie
 * nazwy — „WorkFlow Pro" w warstwie SEO i „TimeTracker" w interfejsie,
 * landingu i tytulach stron (`lib/workspace/sections.ts`). Ujednolicone tutaj
 * na „TimeTracker", czyli nazwe, ktora widzi uzytkownik. Rebranding domen
 * (adresy social, e-mail kontaktowy) celowo NIE zostal ruszony.
 */
export const SITE = {
  url: SITE_URL,
  name: 'TimeTracker',
  shortName: 'TimeTracker',
  legalName: 'TimeTracker',
  titleTemplate: '%s · TimeTracker',
  twitterHandle: '@workflowpro',
  ogImage: {
    url: '/logo.png',
    width: 1024,
    height: 1536,
    alt: 'TimeTracker',
  },
  category: 'BusinessApplication',
  operatingSystem: 'Web, iOS, Android',
  pricingModel: 'freemium',
  themeColor: {
    light: '#ffffff',
    dark: '#0f172a',
  },
  contact: {
    email: 'kontakt@workflow-pro.app',
  },
  social: {
    twitter: 'https://twitter.com/workflowpro',
    linkedin: 'https://www.linkedin.com/company/workflowpro',
    facebook: 'https://www.facebook.com/workflowpro',
  },
} as const

export function absoluteUrl(path = '/'): string {
  if (!path.startsWith('/')) path = `/${path}`
  return `${SITE.url}${path}`
}

/**
 * Kanoniczny adres wersji jezykowej.
 *
 *   pl → https://example.com/          (jezyk bazowy, bez prefiksu)
 *   de → https://example.com/de
 *   en → https://example.com/en/dashboard
 *
 * Uzywane przez `canonical`, `hreflang` i sitemape — jedno miejsce, wiec te
 * trzy nie moga sie rozjechac.
 */
export function localizedUrl(locale: AppLocale, path = '/'): string {
  const normalized = path.startsWith('/') ? path : `/${path}`
  const prefix = locale === DEFAULT_LOCALE ? '' : `/${locale}`
  const full = `${prefix}${normalized}`.replace(/\/+$/, '') || '/'
  return `${SITE.url}${full}`
}

/**
 * Komplet `hreflang` dla jednej sciezki: kazdy obslugiwany jezyk plus
 * `x-default` wskazujacy na jezyk bazowy.
 */
export function alternateLanguages(path = '/'): Record<string, string> {
  const languages: Record<string, string> = {}
  for (const locale of APP_LOCALES) languages[locale] = localizedUrl(locale, path)
  languages['x-default'] = localizedUrl(DEFAULT_LOCALE, path)
  return languages
}
