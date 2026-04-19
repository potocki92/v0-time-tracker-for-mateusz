import type { Metadata } from 'next'
import { buildMetadata } from '@/lib/seo/metadata'

export const metadata: Metadata = buildMetadata({
  path: '/auth/error',
  noindex: true,
  title: 'Błąd uwierzytelniania',
  description: 'Wystąpił błąd podczas logowania do WorkFlow Pro. Spróbuj ponownie.',
})

export default function AuthErrorLayout({ children }: { children: React.ReactNode }) {
  return children
}
