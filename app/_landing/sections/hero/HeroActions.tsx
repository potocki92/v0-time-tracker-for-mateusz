import Link from 'next/link'
import { ArrowRight, Play } from 'lucide-react'

import { Button } from '@/components/ui/button'

interface HeroActionsProps {
  isAuthenticated: boolean
}

export function HeroActions({ isAuthenticated }: HeroActionsProps) {
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
        <a href="#jak-dziala">
          <Play className="size-4" />
          Zobacz jak to działa
        </a>
      </Button>
    </>
  )
}
