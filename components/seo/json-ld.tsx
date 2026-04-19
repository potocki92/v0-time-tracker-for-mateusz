import {
  organizationLd,
  websiteLd,
  softwareApplicationLd,
  breadcrumbLd,
  serializeJsonLd,
  type BreadcrumbItem,
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

export function OrganizationJsonLd() {
  return <JsonLd id="ld-organization" data={organizationLd()} />
}

export function WebsiteJsonLd() {
  return <JsonLd id="ld-website" data={websiteLd()} />
}

export function SoftwareApplicationJsonLd() {
  return <JsonLd id="ld-software" data={softwareApplicationLd()} />
}

export function BreadcrumbJsonLd({ items }: { items: BreadcrumbItem[] }) {
  return <JsonLd id="ld-breadcrumb" data={breadcrumbLd(items)} />
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
