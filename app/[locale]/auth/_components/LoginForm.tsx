'use client'

import { useActionState } from 'react'
import { ArrowRight, KeyRound, Mail } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { FormWrapper } from '@/components/common/form/FormWrapper'
import { Link } from '@/i18n/navigation'

import { loginAction, type LoginState } from '../_actions/login.action'
import { AuthField, AuthSubmitButton } from './AuthField'

const INITIAL_STATE: LoginState = {}

/**
 * Warstwa prezentacji — walidacja i wywolanie Supabase zyja w
 * `loginAction`, wiec ten formularz nie wciaga do przegladarki ani
 * `@supabase/supabase-js`, ani `zod`, ani react-hook-form.
 *
 * Akcja zwraca KODY; tlumaczenie na jezyk uzytkownika dzieje sie tutaj.
 */
export function LoginForm() {
  const t = useTranslations('auth.login')
  const tv = useTranslations('validation')
  const te = useTranslations('errors')
  const [state, formAction, pending] = useActionState(loginAction, INITIAL_STATE)

  return (
    <FormWrapper
      title={t('title')}
      description={t('description')}
      footer={
        <p className="text-center text-sm text-muted-foreground">
          {t('noAccount')}{' '}
          <Link
            href="/auth/sign-up"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            {t('signUpLink')}
          </Link>
        </p>
      }
    >
      <form action={formAction} aria-label={t('formLabel')} noValidate className="space-y-6">
        <AuthField
          name="email"
          type="email"
          label={t('email')}
          placeholder={t('emailPlaceholder')}
          autoComplete="email"
          icon={<Mail className="h-4 w-4" />}
          error={state.fieldErrors?.email ? tv(state.fieldErrors.email) : undefined}
          disabled={pending}
        />
        <AuthField
          name="password"
          type="password"
          label={t('password')}
          placeholder={t('passwordPlaceholder')}
          autoComplete="current-password"
          icon={<KeyRound className="h-4 w-4" />}
          error={state.fieldErrors?.password ? tv(state.fieldErrors.password) : undefined}
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
