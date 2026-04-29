import { SITE } from '@/lib/seo/site'

export const FOOTER_LINK_GROUPS = [
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
    links: [{ href: `mailto:${SITE.contact.email}`, label: SITE.contact.email, external: true }],
  },
] as const
