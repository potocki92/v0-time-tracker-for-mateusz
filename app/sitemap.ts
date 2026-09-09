import type { MetadataRoute } from 'next'

import { APP_LOCALES } from '@/i18n/config'
import { alternateLanguages, localizedUrl } from '@/lib/seo/site'

/**
 * Dynamiczna /sitemap.xml — zgodna z Next.js App Router.
 *
 * Publikujemy wyłącznie publiczne, indeksowalne strony, i to w KAZDEJ wersji
 * jezykowej: `/`, `/de`, `/en`. Kazdy wpis niesie komplet `alternates`, wiec
 * wyszukiwarka widzi te trzy adresy jako tlumaczenia jednej strony, a nie
 * jako duplikaty.
 *
 * Strefa aplikacji (dashboard, invoices, settings…) wymaga uwierzytelnienia,
 * jest `noindex` i wyciecia w `robots.ts` — do sitemapy nie trafia.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()

  /** Publiczne sciezki BEZ prefiksu jezyka. Rozszerzaj tutaj. */
  const publicPaths = ['/'] as const

  return publicPaths.flatMap((path) =>
    APP_LOCALES.map((locale) => ({
      url: localizedUrl(locale, path),
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 1.0,
      alternates: { languages: alternateLanguages(path) },
    })),
  )
}
