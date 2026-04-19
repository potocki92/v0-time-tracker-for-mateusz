import type { MetadataRoute } from 'next'
import { SITE, absoluteUrl } from '@/lib/seo/site'

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
        disallow: [
          '/api/',
          '/auth/',
          '/dashboard/',
          '/calendar/',
          '/invoices/',
          '/clients/',
          '/projects/',
          '/settings/',
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
