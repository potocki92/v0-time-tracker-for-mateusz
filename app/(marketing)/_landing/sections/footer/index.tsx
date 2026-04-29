import { Logo, BRAND } from '@/components/brand/logo'
import { SITE } from '@/lib/seo/site'

import { FOOTER_LINK_GROUPS } from './data'
import { FooterLinkGroup } from './FooterLinkGroup'

export function FooterSection() {
  return (
    <footer className="bg-background">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div>
            <div className="flex items-center gap-3">
              <Logo size="md" />
              <span className="text-sm font-semibold tracking-tight">{BRAND.name}</span>
            </div>
            <p className="mt-4 max-w-sm text-sm text-muted-foreground">
              {BRAND.tagline} · profesjonalny system do rejestracji czasu pracy, klientów i
              fakturowania dla freelancerów i małych firm.
            </p>
          </div>

          {FOOTER_LINK_GROUPS.map((group) => (
            <FooterLinkGroup key={group.title} title={group.title} links={group.links} />
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {SITE.legalName}. Wszelkie prawa zastrzeżone.
          </p>
          <p>Zbudowane z Next.js · Hostowane na Vercel · Zgodne z RODO</p>
        </div>
      </div>
    </footer>
  )
}
