import type { Metadata } from 'next'
import { buildMetadata } from '@/lib/seo/metadata'

import { AuthShell } from './_components/AuthShell'

/**
 * Strefa auth nie powinna być indeksowana — to formularze stanowe,
 * bez wartości SEO, z potencjalnymi parametrami redirect/tokenami.
 */
export const metadata: Metadata = buildMetadata({
  path: '/auth',
  noindex: true,
  title: 'Uwierzytelnianie',
  description:
    'Zaloguj się do WorkFlow Pro, aby zarządzać czasem pracy, klientami i fakturami.',
})

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AuthShell>{children}</AuthShell>
}
