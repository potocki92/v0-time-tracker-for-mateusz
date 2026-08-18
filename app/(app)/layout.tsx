import { redirect } from 'next/navigation'

import { Providers } from '@/app/providers'
import { getServerUser } from '@/lib/auth/server-user'
import { AppShell } from './_layout/AppShell'
import { fetchUnpaidInvoicesCount } from './_layout/services/sidebar-badges.server'

// Server Component — shell renderuje się po stronie serwera, więc treść strony
// trafia do HTML bez czekania na hydrację i na kliencki `auth.getUser()`.
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const [user, unpaidInvoices] = await Promise.all([
    getServerUser(),
    fetchUnpaidInvoicesCount(),
  ])

  if (!user) redirect('/auth/login')

  return (
    <Providers>
      <AppShell user={user} badges={{ '/invoices': unpaidInvoices }}>
        {children}
      </AppShell>
    </Providers>
  )
}
