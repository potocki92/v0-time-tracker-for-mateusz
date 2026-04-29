import Link from 'next/link'

import { Button } from '@/components/ui/button'

interface NavbarActionsProps {
  isAuthenticated: boolean
  mobile?: boolean
}

export function NavbarActions({ isAuthenticated, mobile = false }: NavbarActionsProps) {
  const size = mobile ? 'default' : 'sm'

  if (isAuthenticated) {
    return (
      <Button asChild size={size}>
        <Link href="/dashboard">Przejdź do panelu</Link>
      </Button>
    )
  }

  return (
    <>
      <Button asChild variant={mobile ? 'outline' : 'ghost'} size={size}>
        <Link href="/auth/login">Zaloguj się</Link>
      </Button>
      <Button asChild size={size}>
        <Link href="/auth/sign-up">Wypróbuj za darmo</Link>
      </Button>
    </>
  )
}
