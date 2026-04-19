import type { MetadataRoute } from 'next'
import { absoluteUrl } from '@/lib/seo/site'

/**
 * Dynamiczna /sitemap.xml — zgodna z Next.js App Router.
 * Publikujemy wyłącznie publiczne landing-y. Strefa aplikacji
 * (dashboard, invoices itd.) wymaga uwierzytelnienia, więc pomijamy ją.
 *
 * Aby dołożyć dynamiczne wpisy (np. publiczne case-study), zaciągnij
 * dane z Supabase i zmapuj na obiekty MetadataRoute.Sitemap[number].
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()

  return [
    {
      url: absoluteUrl('/'),
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 1.0,
      alternates: { languages: { 'pl-PL': absoluteUrl('/') } },
    },
  ]
}
