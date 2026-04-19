import type { Metadata } from 'next'
import { buildMetadata } from '@/lib/seo/metadata'

export const metadata: Metadata = buildMetadata({
  path: '/auth/sign-up-success',
  noindex: true,
  title: 'Konto utworzone',
  description: 'Potwierdź adres e-mail, aby aktywować konto WorkFlow Pro.',
})

export default function SignUpSuccessLayout({ children }: { children: React.ReactNode }) {
  return children
}
