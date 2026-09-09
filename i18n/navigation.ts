import { createNavigation } from 'next-intl/navigation'

import { routing } from './routing'

/**
 * Nawigacja swiadoma jezyka — uzywaj TEGO `Link`/`redirect`/`useRouter`
 * wszedzie tam, gdzie cel jest strona aplikacji.
 *
 *   <Link href="/dashboard" />   →   /dashboard | /de/dashboard | /en/dashboard
 *
 * Czego NIE zamieniac na te wersje (zostaje `next/link` albo zwykle `<a>`):
 *   • trasy `/api/*` — nie maja wersji jezykowych,
 *   • adresy zewnetrzne, `mailto:`, `tel:`,
 *   • pliki i pobierania z `/public`,
 *   • kotwice w obrebie strony (`#product`) — prefiks doklada `Link`
 *     nadrzednej trasy, a nie sam hash.
 */
export const { Link, redirect, permanentRedirect, usePathname, useRouter, getPathname } =
  createNavigation(routing)
