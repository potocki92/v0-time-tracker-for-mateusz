import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

import { OG_LOCALE, type AppLocale } from '@/i18n/config'

import { SITE, absoluteUrl, alternateLanguages, localizedUrl } from './site'

interface BuildMetadataInput {
  /** Jezyk WERSJI, dla ktorej budujemy metadane. */
  locale: AppLocale
  /** Sciezka BEZ prefiksu jezyka, np. `/` albo `/auth/login`. */
  path?: string
  /** Nadpisanie tytulu; domyslnie tytul strony glownej z `messages/<locale>/seo.json`. */
  title?: string
  description?: string
  keywords?: string[]
  noindex?: boolean
  ogImage?: {
    url: string
    width?: number
    height?: number
    alt?: string
  }
  type?: 'website' | 'article'
  publishedTime?: string
  modifiedTime?: string
}

/**
 * Buduje spójny obiekt `Metadata` z OG + Twitter Cards + canonical + hreflang.
 *
 * Kluczowa zasada SEO wielojezycznego: KAZDA wersja ma canonical wskazujacy na
 * SIEBIE (`/de` → `/de`, nigdy `/de` → `/`), a `alternates.languages` opisuje
 * pelen komplet wersji plus `x-default`. Bez tego trzy wersje jezykowe tej
 * samej strony wygladaja dla wyszukiwarki jak zduplikowana tresc.
 */
export async function buildLocalizedMetadata(input: BuildMetadataInput): Promise<Metadata> {
  const {
    locale,
    path = '/',
    title,
    description,
    keywords,
    noindex = false,
    ogImage = SITE.ogImage,
    type = 'website',
    publishedTime,
    modifiedTime,
  } = input

  const t = await getTranslations({ locale, namespace: 'seo' })

  const resolvedTitle = title ?? t('site.title')
  const resolvedDescription = description ?? t('site.description')
  const url = localizedUrl(locale, path)
  const ogImageUrl = ogImage.url.startsWith('http')
    ? ogImage.url
    : absoluteUrl(ogImage.url)

  return {
    metadataBase: new URL(SITE.url),
    title: title
      ? { absolute: title.includes(SITE.name) ? title : `${title} · ${SITE.name}` }
      : { default: resolvedTitle, template: SITE.titleTemplate },
    description: resolvedDescription,
    keywords:
      keywords ??
      t('site.keywords')
        .split(',')
        .map((keyword) => keyword.trim())
        .filter(Boolean),
    applicationName: SITE.name,
    authors: [{ name: SITE.legalName, url: SITE.url }],
    creator: SITE.legalName,
    publisher: SITE.legalName,
    category: 'business',
    alternates: {
      canonical: url,
      // Strony `noindex` (auth) nie potrzebuja mapy wersji jezykowych —
      // wyszukiwarka i tak ich nie indeksuje, a `hreflang` na nieindeksowanej
      // stronie jest sygnalem sprzecznym.
      ...(noindex ? {} : { languages: alternateLanguages(path) }),
    },
    robots: noindex
      ? {
          index: false,
          follow: false,
          nocache: true,
          googleBot: { index: false, follow: false, noimageindex: true },
        }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            'max-image-preview': 'large',
            'max-snippet': -1,
            'max-video-preview': -1,
          },
        },
    openGraph: {
      type,
      siteName: SITE.name,
      title: resolvedTitle,
      description: resolvedDescription,
      url,
      locale: OG_LOCALE[locale],
      alternateLocale: Object.values(OG_LOCALE).filter((tag) => tag !== OG_LOCALE[locale]),
      images: [
        {
          url: ogImageUrl,
          width: ogImage.width ?? SITE.ogImage.width,
          height: ogImage.height ?? SITE.ogImage.height,
          alt: ogImage.alt ?? SITE.ogImage.alt,
        },
      ],
      ...(type === 'article' && publishedTime ? { publishedTime, modifiedTime } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title: resolvedTitle,
      description: resolvedDescription,
      site: SITE.twitterHandle,
      creator: SITE.twitterHandle,
      images: [ogImageUrl],
    },
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    referrer: 'origin-when-cross-origin',
  }
}
