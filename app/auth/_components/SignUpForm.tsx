'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { ArrowRight, KeyRound, Mail, User } from 'lucide-react'

import { FormWrapper } from '@/components/common/form/FormWrapper'
import { PASSWORD_MIN } from '@/lib/schemas/auth.constants'

import { signUpAction, type SignUpState } from '../_actions/sign-up.action'
import { AuthField, AuthSubmitButton } from './AuthField'

const INITIAL_STATE: SignUpState = {}

/**
 * Warstwa prezentacji rejestracji. Schemat Zod pozostaje jedynym zrodlem
 * prawdy dla walidacji, ale wykonuje sie w `signUpAction` na serwerze.
 */
export function SignUpForm() {
  const [state, formAction, pending] = useActionState(signUpAction, INITIAL_STATE)

  return (
    <FormWrapper
      title="Utwórz konto"
      description="Zacznij śledzić czas pracy i wystawiać faktury w kilka minut. To nie zajmie więcej niż chwila."
      footer={
        <p className="text-center text-sm text-muted-foreground">
          Masz już konto?{' '}
          <Link
            href="/auth/login"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Zaloguj się
          </Link>
        </p>
      }
    >
      <form action={formAction} aria-label="Formularz rejestracji" noValidate className="space-y-6">
        <AuthField
          name="fullName"
          type="text"
          label="Imię i nazwisko"
          placeholder="Jan Kowalski"
          autoComplete="name"
          icon={<User className="h-4 w-4" />}
          error={state.fieldErrors?.fullName}
          disabled={pending}
        />
        <AuthField
          name="email"
          type="email"
          label="Email"
          placeholder="jan@przyklad.pl"
          autoComplete="email"
          icon={<Mail className="h-4 w-4" />}
          error={state.fieldErrors?.email}
          disabled={pending}
        />
        <AuthField
          name="password"
          type="password"
          label="Hasło"
          placeholder={`Minimum ${PASSWORD_MIN} znaków`}
          autoComplete="new-password"
          icon={<KeyRound className="h-4 w-4" />}
          description="Użyj unikalnego hasła, którego nie wykorzystujesz gdzie indziej."
          error={state.fieldErrors?.password}
          disabled={pending}
        />
        <AuthField
          name="confirmPassword"
          type="password"
          label="Potwierdź hasło"
          placeholder="Powtórz hasło"
          autoComplete="new-password"
          icon={<KeyRound className="h-4 w-4" />}
          error={state.fieldErrors?.confirmPassword}
          disabled={pending}
        />

        {state.error ? (
          <p
            role="alert"
            className="rounded-xl border border-destructive/40 bg-destructive/5 px-4 py-3 text-[13px] text-destructive/85"
          >
            {state.error}
          </p>
        ) : null}

        <AuthSubmitButton pending={pending} pendingLabel="Tworzenie konta...">
          Zarejestruj się
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </AuthSubmitButton>
      </form>
    </FormWrapper>
  )
}
