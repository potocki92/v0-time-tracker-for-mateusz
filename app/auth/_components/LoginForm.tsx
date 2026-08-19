'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { ArrowRight, KeyRound, Mail } from 'lucide-react'

import { FormWrapper } from '@/components/common/form/FormWrapper'

import { loginAction, type LoginState } from '../_actions/login.action'
import { AuthField, AuthSubmitButton } from './AuthField'

const INITIAL_STATE: LoginState = {}

/**
 * Warstwa prezentacji — walidacja i wywolanie Supabase zyja w
 * `loginAction`, wiec ten formularz nie wciaga do przegladarki ani
 * `@supabase/supabase-js`, ani `zod`, ani react-hook-form.
 */
export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, INITIAL_STATE)

  return (
    <FormWrapper
      title="Witaj z powrotem"
      description="Zaloguj się, aby wrócić do rejestracji czasu pracy i zarządzania klientami."
      footer={
        <p className="text-center text-sm text-muted-foreground">
          Nie masz jeszcze konta?{' '}
          <Link
            href="/auth/sign-up"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Zarejestruj się
          </Link>
        </p>
      }
    >
      <form action={formAction} aria-label="Formularz logowania" noValidate className="space-y-6">
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
          placeholder="••••••••"
          autoComplete="current-password"
          icon={<KeyRound className="h-4 w-4" />}
          error={state.fieldErrors?.password}
          disabled={pending}
        />

        {state.error ? (
          <p
            role="alert"
            className="rounded-xl border border-destructive/40 bg-destructive/5 px-4 py-3 text-xs text-destructive/85"
          >
            {state.error}
          </p>
        ) : null}

        <AuthSubmitButton pending={pending} pendingLabel="Logowanie...">
          Zaloguj się
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </AuthSubmitButton>
      </form>
    </FormWrapper>
  )
}
