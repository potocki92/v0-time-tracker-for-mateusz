'use client'

import Link from 'next/link'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowRight, KeyRound, Mail, User } from 'lucide-react'

import {
  SubmitButton,
  UniversalForm,
  type UniversalFieldConfig,
} from '@/components/common/form'
import { FormWrapper } from '@/components/common/form/FormWrapper'
import {
  signUpSchema,
  PASSWORD_MIN,
  type SignUpInput,
} from '@/lib/schemas/auth.schema'
import { useSignUpMutation } from '@/hooks/auth/useSignUpMutation'

const DEFAULT_VALUES: SignUpInput = {
  fullName:        '',
  email:           '',
  password:        '',
  confirmPassword: '',
}

const SIGNUP_FIELDS: ReadonlyArray<UniversalFieldConfig<SignUpInput>> = [
  {
    name:         'fullName',
    type:         'text',
    label:        'Imię i nazwisko',
    placeholder:  'Jan Kowalski',
    autoComplete: 'name',
    icon:         <User className="h-4 w-4" />,
  },
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
    placeholder:  `Minimum ${PASSWORD_MIN} znaków`,
    autoComplete: 'new-password',
    icon:         <KeyRound className="h-4 w-4" />,
    description:  'Użyj unikalnego hasła, którego nie wykorzystujesz gdzie indziej.',
  },
  {
    name:         'confirmPassword',
    type:         'password',
    label:        'Potwierdź hasło',
    placeholder:  'Powtórz hasło',
    autoComplete: 'new-password',
    icon:         <KeyRound className="h-4 w-4" />,
  },
]

/**
 * Presentation layer for signup. All network/business logic lives in
 * `useSignUpMutation`, the Zod schema is the single source of truth for
 * validation, and `UniversalForm` orchestrates RHF.
 */
export function SignUpForm() {
  const signUpMutation = useSignUpMutation()

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
      <UniversalForm<SignUpInput>
        resolver={zodResolver(signUpSchema)}
        defaultValues={DEFAULT_VALUES}
        fields={SIGNUP_FIELDS}
        ariaLabel="Formularz rejestracji"
        onSubmit={(values) => signUpMutation.mutateAsync(values)}
      >
        <SubmitButton pendingLabel="Tworzenie konta...">
          Zarejestruj się
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </SubmitButton>
      </UniversalForm>
    </FormWrapper>
  )
}
