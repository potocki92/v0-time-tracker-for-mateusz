import type { Metadata } from 'next'
import { SITE, absoluteUrl } from './site'

interface BuildMetadataInput {
  title?: string
  description?: string
  path?: string
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
 * Buduje spójny obiekt `Metadata` z OG + Twitter Cards + canonical + robots.
 * Wywołuj w każdym `page.tsx` / `layout.tsx` (Server Component).
 */
export function buildMetadata(input: BuildMetadataInput = {}): Metadata {
  const {
    title,
    description = SITE.description,
    path = '/',
    keywords,
    noindex = false,
    ogImage = SITE.ogImage,
    type = 'website',
    publishedTime,
    modifiedTime,
  } = input

  const fullTitle = title ? title : SITE.title
  const url = absoluteUrl(path)
  const ogImageUrl = ogImage.url.startsWith('http')
    ? ogImage.url
    : absoluteUrl(ogImage.url)

  return {
    metadataBase: new URL(SITE.url),
    title: title
      ? { absolute: title.includes(SITE.shortName) ? title : `${title} · ${SITE.name}` }
      : { default: SITE.title, template: SITE.titleTemplate },
    description,
    keywords: keywords ?? Array.from(SITE.keywords),
    applicationName: SITE.name,
    authors: [{ name: SITE.legalName, url: SITE.url }],
    creator: SITE.legalName,
    publisher: SITE.legalName,
    category: 'business',
    alternates: {
      canonical: url,
      languages: {
        'pl-PL': url,
        'x-default': url,
      },
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
      title: fullTitle,
      description,
      url,
      locale: SITE.locale,
      images: [
        {
          url: ogImageUrl,
          width: ogImage.width ?? SITE.ogImage.width,
          height: ogImage.height ?? SITE.ogImage.height,
          alt: ogImage.alt ?? SITE.ogImage.alt,
        },
      ],
      ...(type === 'article' && publishedTime
        ? { publishedTime, modifiedTime }
        : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
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
