import { INTL_LOCALE, type AppLocale } from '@/i18n/config'

import { SITE, absoluteUrl, localizedUrl } from './site'

type JsonLdNode = Record<string, unknown>

/**
 * Wezly JSON-LD zawierajace TEKST sa lokalizowane — opis produktu w wynikach
 * wyszukiwania musi byc w tym samym jezyku, co strona. Wezly czysto
 * strukturalne (adresy, logo, profile spolecznosciowe) jezyka nie maja.
 */
export interface LocalizedSeoCopy {
  name: string
  description: string
}

export function organizationLd(): JsonLdNode {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': absoluteUrl('#organization'),
    name: SITE.legalName,
    alternateName: SITE.shortName,
    url: SITE.url,
    logo: {
      '@type': 'ImageObject',
      url: absoluteUrl('/logo.png'),
      width: SITE.ogImage.width,
      height: SITE.ogImage.height,
    },
    sameAs: [SITE.social.twitter, SITE.social.linkedin, SITE.social.facebook],
    contactPoint: [
      {
        '@type': 'ContactPoint',
        contactType: 'customer support',
        email: SITE.contact.email,
        availableLanguage: ['Polish', 'German', 'English'],
      },
    ],
  }
}

export function websiteLd(locale: AppLocale, copy: LocalizedSeoCopy): JsonLdNode {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${localizedUrl(locale, '/')}#website`,
    url: localizedUrl(locale, '/'),
    name: SITE.name,
    description: copy.description,
    inLanguage: INTL_LOCALE[locale],
    publisher: { '@id': absoluteUrl('#organization') },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${localizedUrl(locale, '/dashboard')}?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  }
}

export function softwareApplicationLd(
  locale: AppLocale,
  copy: LocalizedSeoCopy,
  featureList: string[],
): JsonLdNode {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    '@id': `${localizedUrl(locale, '/')}#app`,
    name: SITE.name,
    description: copy.description,
    url: localizedUrl(locale, '/'),
    applicationCategory: SITE.category,
    applicationSubCategory: 'TimeTrackingApplication',
    operatingSystem: SITE.operatingSystem,
    browserRequirements: 'Requires JavaScript. Requires HTML5.',
    inLanguage: INTL_LOCALE[locale],
    image: absoluteUrl(SITE.ogImage.url),
    softwareVersion: '3.0',
    featureList,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'PLN',
      availability: 'https://schema.org/InStock',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.9',
      ratingCount: '128',
      bestRating: '5',
      worstRating: '1',
    },
    publisher: { '@id': absoluteUrl('#organization') },
  }
}

/**
 * Serializuje JSON-LD bezpiecznie do wstrzyknięcia w `<script>`.
 * Escape-uje `<` aby zapobiec zamknięciu taga w treści.
 */
export function serializeJsonLd(node: JsonLdNode | JsonLdNode[]): string {
  return JSON.stringify(node).replace(/</g, '\\u003c')
}
