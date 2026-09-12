import { NextIntlClientProvider } from 'next-intl'
import { setRequestLocale } from 'next-intl/server'

import { Providers } from '@/app/providers'
import { toAppLocale } from '@/i18n/config'
import { loadMessages, pickMessages } from '@/i18n/messages'
import { redirect } from '@/i18n/navigation'
import { getServerUser } from '@/lib/auth/server-user'
import { AppShell } from './_layout/AppShell'
import { fetchUnpaidInvoicesCount } from './_layout/services/sidebar-badges.server'

// Server Component — shell renderuje się po stronie serwera, więc treść strony
// trafia do HTML bez czekania na hydrację i na kliencki `auth.getUser()`.
export default async function AppLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const appLocale = toAppLocale(locale)
  setRequestLocale(locale)

  const [user, unpaidInvoices] = await Promise.all([
    getServerUser(),
    fetchUnpaidInvoicesCount(),
  ])

  // Redirect swiadomy jezyka: niezalogowany uzytkownik z `/de/dashboard`
  // laduje na `/de/auth/login`, a nie na polskiej wersji logowania.
  if (!user) redirect({ href: '/auth/login', locale })

  // Panel dostaje przestrzenie SWOJEJ strefy. `marketing` NIE jedzie tutaj —
  // landing i panel maja rozlaczne slowniki po stronie klienta.
  const messages = pickMessages(await loadMessages(appLocale), [
    'common',
    'navigation',
    'settings',
    'validation',
    'errors',
    'dashboard',
    'calendar',
    'projects',
    'clients',
    'invoices',
    'reports',
    'accounting',
  ])

  return (
    <NextIntlClientProvider locale={appLocale} messages={messages}>
      <Providers>
        <AppShell user={user} badges={{ '/invoices': unpaidInvoices }}>
          {children}
        </AppShell>
      </Providers>
    </NextIntlClientProvider>
  )
}
