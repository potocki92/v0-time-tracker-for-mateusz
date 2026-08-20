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

function OrganizationJsonLd() {
  return <JsonLd id="ld-organization" data={organizationLd()} />
}

function WebsiteJsonLd() {
  return <JsonLd id="ld-website" data={websiteLd()} />
}

function SoftwareApplicationJsonLd() {
  return <JsonLd id="ld-software" data={softwareApplicationLd()} />
}

/** Wstrzykuje wszystkie globalne węzły JSON-LD (Organization + WebSite + Software). */
export function GlobalJsonLd() {
  return (
    <>
      <OrganizationJsonLd />
      <WebsiteJsonLd />
      <SoftwareApplicationJsonLd />
    </>
  )
}
