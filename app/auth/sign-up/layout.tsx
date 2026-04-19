import type { Metadata } from 'next'
import { buildMetadata } from '@/lib/seo/metadata'

export const metadata: Metadata = buildMetadata({
  path: '/auth/sign-up',
  noindex: true,
  title: 'Rejestracja konta',
  description:
    'Załóż konto WorkFlow Pro i zacznij śledzić czas pracy oraz wystawiać faktury już w kilka minut.',
})

export default function SignUpLayout({ children }: { children: React.ReactNode }) {
  return children
}
