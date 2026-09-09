import { getTranslations } from 'next-intl/server'

import type { AppLocale } from '@/i18n/config'
import {
  organizationLd,
  websiteLd,
  softwareApplicationLd,
  serializeJsonLd,
} from '@/lib/seo/json-ld'

interface JsonLdProps {
  id: string
  data: unknown
}

function JsonLd({ id, data }: JsonLdProps) {
  return (
    <script
      id={id}
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(data as Record<string, unknown>) }}
    />
  )
}

/**
 * Globalne wezly JSON-LD (Organization + WebSite + SoftwareApplication).
 *
 * Opis i lista funkcji ida z `messages/<locale>/seo.json` i `marketing.json`,
 * wiec strukturalne dane wyszukiwarki mowia tym samym jezykiem, co strona.
 */
export async function GlobalJsonLd({ locale }: { locale: AppLocale }) {
  const seo = await getTranslations({ locale, namespace: 'seo' })
  const marketing = await getTranslations({ locale, namespace: 'marketing' })

  const copy = { name: seo('site.title'), description: seo('site.description') }
  const featureList = [
    'dayEntries',
    'clientRates',
    'projectBudgets',
    'invoiceBuilder',
    'reports',
    'workAutomation',
  ].map((key) => marketing(`everything.items.${key}.title`))

  return (
    <>
      <JsonLd id="ld-organization" data={organizationLd()} />
      <JsonLd id="ld-website" data={websiteLd(locale, copy)} />
      <JsonLd id="ld-software" data={softwareApplicationLd(locale, copy, featureList)} />
    </>
  )
}
