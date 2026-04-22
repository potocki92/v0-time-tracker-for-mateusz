import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

import { Button } from '@/components/ui/button'

interface FinalCtaActionsProps {
  isAuthenticated: boolean
}

export function FinalCtaActions({ isAuthenticated }: FinalCtaActionsProps) {
  if (isAuthenticated) {
    return (
      <Button asChild size="lg" className="h-12 px-6 text-base">
        <Link href="/dashboard">
          Przejdź do panelu
          <ArrowRight className="size-4" />
        </Link>
      </Button>
    )
  }

  return (
    <>
      <Button asChild size="lg" className="h-12 px-6 text-base">
        <Link href="/auth/sign-up">
          Rozpocznij za darmo
          <ArrowRight className="size-4" />
        </Link>
      </Button>
      <Button asChild variant="outline" size="lg" className="h-12 px-6 text-base">
        <Link href="/auth/login">Mam już konto</Link>
      </Button>
    </>
  )
}
