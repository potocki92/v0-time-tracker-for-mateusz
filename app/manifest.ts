import type { MetadataRoute } from 'next'
import { DEFAULT_LOCALE, INTL_LOCALE } from '@/i18n/config'
import { loadMessages } from '@/i18n/messages'
import { SITE } from '@/lib/seo/site'

/**
 * Dynamiczny PWA manifest serwowany jako /manifest.webmanifest.
 *
 * Manifest jest JEDEN na aplikacje — przegladarka pobiera go spod stalego
 * adresu, bez prefiksu jezyka — wiec opisuje instalacje w jezyku bazowym.
 * Interfejs po instalacji negocjuje jezyk normalnie, przez middleware.
 */
export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const messages = await loadMessages(DEFAULT_LOCALE)
  const seo = messages.seo as { site: { description: string } }

  return {
    name: SITE.name,
    short_name: SITE.shortName,
    description: seo.site.description,
    start_url: '/dashboard',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait-primary',
    background_color: SITE.themeColor.light,
    theme_color: SITE.themeColor.light,
    lang: INTL_LOCALE[DEFAULT_LOCALE],
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
