/**
 * Centralna konfiguracja SEO/brandingu.
 *
 * Jedno źródło prawdy dla metadanych, JSON-LD, sitemap oraz robots.
 * Czytane po stronie serwera i klienta — bez odwołań do server-only env.
 */

const rawUrl =
  process.env.NEXT_PUBLIC_APP_URL ??
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined) ??
  'http://localhost:3000'

const SITE_URL = rawUrl.replace(/\/+$/, '')

export const SITE = {
  url: SITE_URL,
  name: 'WorkFlow Pro',
  shortName: 'WorkFlow',
  legalName: 'WorkFlow Pro',
  title: 'WorkFlow Pro — rejestr czasu pracy, faktury i rozliczenia dla freelancerów',
  titleTemplate: '%s · WorkFlow Pro',
  description:
    'WorkFlow Pro to profesjonalny system do rejestracji czasu pracy, wystawiania faktur i rozliczania projektów dla freelancerów oraz małych firm. Rozliczaj klientów szybciej i bez błędów.',
  keywords: [
    'rejestr czasu pracy',
    'time tracker',
    'ewidencja czasu pracy',
    'faktury dla freelancerów',
    'rozliczanie projektów',
    'aplikacja do fakturowania',
    'CRM dla freelancerów',
    'ewidencja godzin',
    'kalkulator godzin pracy',
    'workflow pro',
  ],
  locale: 'pl_PL',
  language: 'pl-PL',
  twitterHandle: '@workflowpro',
  ogImage: {
    url: '/logo.png',
    width: 1024,
    height: 1536,
    alt: 'WorkFlow Pro — logo aplikacji do rejestracji czasu pracy',
  },
  category: 'BusinessApplication',
  operatingSystem: 'Web, iOS, Android',
  pricingModel: 'freemium',
  themeColor: {
    light: '#ffffff',
    dark: '#0f172a',
  },
  contact: {
    email: 'kontakt@workflow-pro.app',
  },
  social: {
    twitter: 'https://twitter.com/workflowpro',
    linkedin: 'https://www.linkedin.com/company/workflowpro',
    facebook: 'https://www.facebook.com/workflowpro',
  },
} as const

export type SiteConfig = typeof SITE

export function absoluteUrl(path = '/'): string {
  if (!path.startsWith('/')) path = `/${path}`
  return `${SITE.url}${path}`
}
