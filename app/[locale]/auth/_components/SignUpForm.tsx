'use client'

import { useActionState } from 'react'
import { ArrowRight, KeyRound, Mail, User } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { FormWrapper } from '@/components/common/form/FormWrapper'
import { Link } from '@/i18n/navigation'
import { PASSWORD_MIN } from '@/lib/schemas/auth.constants'

import { signUpAction, type SignUpState } from '../_actions/sign-up.action'
import { AuthField, AuthSubmitButton } from './AuthField'

const INITIAL_STATE: SignUpState = {}

/**
 * Warstwa prezentacji rejestracji. Schemat Zod pozostaje jedynym zrodlem
 * prawdy dla walidacji, ale wykonuje sie w `signUpAction` na serwerze i
 * zwraca KLUCZE — parametry (`min`, `max`) doklada tlumaczenie tutaj.
 */
export function SignUpForm() {
  const t = useTranslations('auth.signUp')
  const tv = useTranslations('validation')
  const te = useTranslations('errors')
  const [state, formAction, pending] = useActionState(signUpAction, INITIAL_STATE)

  const fieldError = (key?: string) =>
    key ? tv(key, { min: PASSWORD_MIN, max: 128 }) : undefined

  return (
    <FormWrapper
      title={t('title')}
      description={t('description')}
      footer={
        <p className="text-center text-sm text-muted-foreground">
          {t('haveAccount')}{' '}
          <Link
            href="/auth/login"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            {t('signInLink')}
          </Link>
        </p>
      }
    >
      <form action={formAction} aria-label={t('formLabel')} noValidate className="space-y-6">
        <AuthField
          name="fullName"
          type="text"
          label={t('fullName')}
          placeholder={t('fullNamePlaceholder')}
          autoComplete="name"
          icon={<User className="h-4 w-4" />}
          error={fieldError(state.fieldErrors?.fullName)}
          disabled={pending}
        />
        <AuthField
          name="email"
          type="email"
          label={t('email')}
          placeholder={t('emailPlaceholder')}
          autoComplete="email"
          icon={<Mail className="h-4 w-4" />}
          error={fieldError(state.fieldErrors?.email)}
          disabled={pending}
        />
        <AuthField
          name="password"
          type="password"
          label={t('password')}
          placeholder={t('passwordPlaceholder', { min: PASSWORD_MIN })}
          autoComplete="new-password"
          icon={<KeyRound className="h-4 w-4" />}
          description={t('passwordHint')}
          error={fieldError(state.fieldErrors?.password)}
          disabled={pending}
        />
        <AuthField
          name="confirmPassword"
          type="password"
          label={t('confirmPassword')}
          placeholder={t('confirmPasswordPlaceholder')}
          autoComplete="new-password"
          icon={<KeyRound className="h-4 w-4" />}
          error={fieldError(state.fieldErrors?.confirmPassword)}
          disabled={pending}
        />

        {state.errorCode ? (
          <p
            role="alert"
            className="rounded-xl border border-destructive/40 bg-destructive/5 px-4 py-3 text-xs text-destructive/85"
          >
            {te(state.errorCode)}
          </p>
        ) : null}

        <AuthSubmitButton pending={pending} pendingLabel={t('submitting')}>
          {t('submit')}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </AuthSubmitButton>
      </form>
    </FormWrapper>
  )
}
