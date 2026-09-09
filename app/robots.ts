import type { MetadataRoute } from 'next'

import { APP_LOCALES, DEFAULT_LOCALE } from '@/i18n/config'
import { SITE, absoluteUrl } from '@/lib/seo/site'

/** Segmenty wymagajace sesji — nie maja czego szukac w indeksie. */
const PRIVATE_SEGMENTS = [
  'auth',
  'dashboard',
  'calendar',
  'invoices',
  'clients',
  'projects',
  'settings',
] as const

/**
 * Dynamiczny /robots.txt — zgodny z Next.js App Router.
 * Odcinamy crawlery od stref auth/app (dane sesyjne) i API.
 */
export default function robots(): MetadataRoute.Robots {
  const isProd = process.env.VERCEL_ENV === 'production' || process.env.NODE_ENV === 'production'

  if (!isProd) {
    return {
      rules: [{ userAgent: '*', disallow: '/' }],
      host: SITE.url,
    }
  }

  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/'],
        // Strefa prywatna jest wycieta w KAZDEJ wersji jezykowej — bez
        // prefiksu (pl) i z prefiksem (`/de/dashboard`, `/en/auth/...`).
        disallow: [
          '/api/',
          ...PRIVATE_SEGMENTS.flatMap((segment) => [
            `/${segment}/`,
            ...APP_LOCALES.filter((locale) => locale !== DEFAULT_LOCALE).map(
              (locale) => `/${locale}/${segment}/`,
            ),
          ]),
          '/_next/',
          '/*?*',
        ],
      },
      // Blokada modeli LLM — opcjonalnie, ograniczamy skrapowanie treści prywatnej
      {
        userAgent: ['GPTBot', 'ClaudeBot', 'CCBot', 'Google-Extended', 'PerplexityBot'],
        disallow: '/',
      },
    ],
    sitemap: absoluteUrl('/sitemap.xml'),
    host: SITE.url,
  }
}
