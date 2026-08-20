import { SITE, absoluteUrl } from './site'

type JsonLdNode = Record<string, unknown>

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
        availableLanguage: ['Polish', 'English'],
      },
    ],
  }
}

export function websiteLd(): JsonLdNode {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': absoluteUrl('#website'),
    url: SITE.url,
    name: SITE.name,
    description: SITE.description,
    inLanguage: SITE.language,
    publisher: { '@id': absoluteUrl('#organization') },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE.url}/dashboard?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  }
}

export function softwareApplicationLd(): JsonLdNode {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    '@id': absoluteUrl('#app'),
    name: SITE.name,
    description: SITE.description,
    url: SITE.url,
    applicationCategory: SITE.category,
    applicationSubCategory: 'TimeTrackingApplication',
    operatingSystem: SITE.operatingSystem,
    browserRequirements: 'Requires JavaScript. Requires HTML5.',
    inLanguage: SITE.language,
    image: absoluteUrl(SITE.ogImage.url),
    softwareVersion: '3.0',
    featureList: [
      'Rejestracja czasu pracy w czasie rzeczywistym',
      'Generowanie faktur PDF',
      'Rozliczanie projektów i klientów',
      'Kalendarz pracy',
      'Integracja z API NBP (kurs EUR)',
      'Powiadomienia push',
    ],
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
