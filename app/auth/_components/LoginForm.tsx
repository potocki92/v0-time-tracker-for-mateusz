'use client'

import Link from 'next/link'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowRight, KeyRound, Mail } from 'lucide-react'

import {
  SubmitButton,
  UniversalForm,
  type UniversalFieldConfig,
} from '@/components/common/form'
import { FormWrapper } from '@/components/common/form/FormWrapper'
import { loginSchema, type LoginInput } from '@/lib/schemas/auth.schema'
import { useLoginMutation } from '@/hooks/auth/useLoginMutation'

const DEFAULT_VALUES: LoginInput = {
  email:    '',
  password: '',
}

const LOGIN_FIELDS: ReadonlyArray<UniversalFieldConfig<LoginInput>> = [
  {
    name:         'email',
    type:         'email',
    label:        'Email',
    placeholder:  'jan@przyklad.pl',
    autoComplete: 'email',
    icon:         <Mail className="h-4 w-4" />,
  },
  {
    name:         'password',
    type:         'password',
    label:        'Hasło',
    placeholder:  '••••••••',
    autoComplete: 'current-password',
    icon:         <KeyRound className="h-4 w-4" />,
  },
]

/**
 * Presentation layer — wires schema, fields, and mutation together.
 * Business logic (Supabase, routing, toasts) lives in `useLoginMutation`.
 */
export function LoginForm() {
  const loginMutation = useLoginMutation()

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
      <UniversalForm<LoginInput>
        resolver={zodResolver(loginSchema)}
        defaultValues={DEFAULT_VALUES}
        fields={LOGIN_FIELDS}
        ariaLabel="Formularz logowania"
        onSubmit={(values) => loginMutation.mutateAsync(values)}
      >
        <SubmitButton pendingLabel="Logowanie...">
          Zaloguj się
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </SubmitButton>
      </UniversalForm>
    </FormWrapper>
  )
}
