import Link from 'next/link'
import { ArrowLeft, Mail } from 'lucide-react'

import { Button } from '@/components/ui/button'

export default function SignUpSuccessPage() {
  return (
    <section className="flex flex-col items-center gap-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/20">
        <Mail className="h-8 w-8 text-primary" aria-hidden="true" />
      </div>

      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-[2rem]">
          Sprawdź swoją skrzynkę
        </h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Wysłaliśmy link potwierdzający na Twój adres email. Kliknij w link,
          aby aktywować konto.
        </p>
      </div>

      <div className="w-full rounded-2xl border border-border/60 bg-muted/40 p-5 text-left text-sm text-muted-foreground">
        <p className="mb-2 font-medium text-foreground">Nie widzisz emaila?</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Sprawdź folder spam</li>
          <li>Upewnij się, że podałeś poprawny adres</li>
          <li>Poczekaj kilka minut</li>
        </ul>
      </div>

      <Button asChild variant="outline" className="h-12 w-full rounded-xl">
        <Link href="/auth/login">
          <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
          Powrót do logowania
        </Link>
      </Button>
    </section>
  )
}
