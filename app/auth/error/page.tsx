import Link from 'next/link'
import { AlertCircle, ArrowLeft } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { FormWrapper } from '@/components/common/form/FormWrapper'

export default function AuthErrorPage() {
  return (
    <div role="alert" aria-live="assertive">
      <FormWrapper>
        <div className="flex flex-col items-center gap-5 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 ring-1 ring-destructive/20">
            <AlertCircle className="h-8 w-8 text-destructive" aria-hidden="true" />
          </div>

          <div className="space-y-1.5">
            <h2 className="text-2xl font-semibold tracking-tight">
              Wystąpił błąd
            </h2>
            <p className="text-sm text-muted-foreground">
              Coś poszło nie tak podczas uwierzytelniania. Spróbuj ponownie.
            </p>
          </div>

          <Button asChild className="h-11 w-full">
            <Link href="/auth/login">
              <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
              Powrót do logowania
            </Link>
          </Button>
        </div>
      </FormWrapper>
    </div>
  )
}
