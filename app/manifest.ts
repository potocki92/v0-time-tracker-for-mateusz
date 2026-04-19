import type { MetadataRoute } from 'next'
import { SITE } from '@/lib/seo/site'

/**
 * Dynamiczny PWA manifest serwowany jako /manifest.webmanifest.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE.name,
    short_name: SITE.shortName,
    description: SITE.description,
    start_url: '/dashboard',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait-primary',
    background_color: SITE.themeColor.light,
    theme_color: SITE.themeColor.light,
    lang: SITE.language,
    dir: 'ltr',
    categories: ['business', 'productivity', 'finance'],
    icons: [
      { src: '/icon-light-32x32.png', sizes: '32x32', type: 'image/png', purpose: 'any' },
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
      { src: '/apple-icon.png', sizes: '180x180', type: 'image/png', purpose: 'any' },
      { src: '/logo.png', sizes: '1024x1536', type: 'image/png', purpose: 'any' },
      { src: '/logo.png', sizes: '1024x1536', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
