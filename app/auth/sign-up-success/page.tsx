import Link from 'next/link'
import { ArrowLeft, Mail } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { FormWrapper } from '@/components/common/form/FormWrapper'

export default function SignUpSuccessPage() {
  return (
    <FormWrapper>
      <div className="flex flex-col items-center gap-5 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 ring-1 ring-primary/20">
          <Mail className="h-8 w-8 text-primary" aria-hidden="true" />
        </div>

        <div className="space-y-1.5">
          <h2 className="text-2xl font-semibold tracking-tight">
            Sprawdź swoją skrzynkę
          </h2>
          <p className="text-sm text-muted-foreground">
            Wysłaliśmy link potwierdzający na Twój adres email. Kliknij w link,
            aby aktywować konto.
          </p>
        </div>

        <div className="w-full rounded-lg border border-border/50 bg-muted/40 p-4 text-left text-sm text-muted-foreground">
          <p className="mb-1 font-medium text-foreground">Nie widzisz emaila?</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Sprawdź folder spam</li>
            <li>Upewnij się, że podałeś poprawny adres</li>
            <li>Poczekaj kilka minut</li>
          </ul>
        </div>

        <Button asChild variant="outline" className="h-11 w-full">
          <Link href="/auth/login">
            <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
            Powrót do logowania
          </Link>
        </Button>
      </div>
    </FormWrapper>
  )
}
