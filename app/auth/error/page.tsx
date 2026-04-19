import Link from 'next/link'
import { AlertCircle, ArrowLeft } from 'lucide-react'

import { Button } from '@/components/ui/button'

export default function AuthErrorPage() {
  return (
    <section
      role="alert"
      aria-live="assertive"
      className="flex flex-col items-center gap-6 text-center"
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10 ring-1 ring-destructive/20">
        <AlertCircle className="h-8 w-8 text-destructive/80" aria-hidden="true" />
      </div>

      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-[2rem]">
          Wystąpił błąd
        </h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Coś poszło nie tak podczas uwierzytelniania. Spróbuj ponownie lub
          skontaktuj się z pomocą techniczną, jeśli problem będzie się
          powtarzać.
        </p>
      </div>

      <Button asChild className="h-12 w-full rounded-xl">
        <Link href="/auth/login">
          <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
          Powrót do logowania
        </Link>
      </Button>
    </section>
  )
}
