import Link from 'next/link'

import { Logo, BRAND } from '@/components/brand/logo'
import { SITE } from '@/lib/seo/site'

const LINK_GROUPS = [
  {
    title: 'Produkt',
    links: [
      { href: '#funkcje', label: 'Funkcje' },
      { href: '#jak-dziala', label: 'Jak to działa' },
      { href: '#korzysci', label: 'Korzyści' },
      { href: '#faq', label: 'FAQ' },
    ],
  },
  {
    title: 'Konto',
    links: [
      { href: '/auth/sign-up', label: 'Zarejestruj się' },
      { href: '/auth/login', label: 'Zaloguj się' },
      { href: '/dashboard', label: 'Panel' },
    ],
  },
  {
    title: 'Kontakt',
    links: [
      { href: `mailto:${SITE.contact.email}`, label: SITE.contact.email, external: true },
    ],
  },
] as const

export function Footer() {
  return (
    <footer className="bg-background">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div>
            <div className="flex items-center gap-3">
              <Logo size="md" />
              <span className="text-sm font-semibold tracking-tight">
                {BRAND.name}
              </span>
            </div>
            <p className="mt-4 max-w-sm text-sm text-muted-foreground">
              {BRAND.tagline} · profesjonalny system do rejestracji czasu pracy,
              klientów i fakturowania dla freelancerów i małych firm.
            </p>
          </div>

          {LINK_GROUPS.map((group) => (
            <div key={group.title}>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {group.title}
              </p>
              <ul className="mt-4 space-y-2.5">
                {group.links.map((link) => {
                  const isExternal = 'external' in link && link.external
                  const className =
                    'text-sm text-foreground/80 transition-colors hover:text-foreground'
                  return (
                    <li key={link.href}>
                      {isExternal ? (
                        <a href={link.href} className={className}>
                          {link.label}
                        </a>
                      ) : (
                        <Link href={link.href} className={className}>
                          {link.label}
                        </Link>
                      )}
                    </li>
                  )
                })}
              </ul>
            </div>
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
