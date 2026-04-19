import type { Metadata } from 'next'
import { buildMetadata } from '@/lib/seo/metadata'

export const metadata: Metadata = buildMetadata({
  path: '/auth/login',
  noindex: true,
  title: 'Logowanie',
  description:
    'Zaloguj się do WorkFlow Pro i błyskawicznie wróć do rejestracji czasu pracy oraz rozliczania projektów.',
})

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children
}
