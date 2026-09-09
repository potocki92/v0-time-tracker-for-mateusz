'use server'

import { getLocale } from 'next-intl/server'

import { toAppLocale } from '@/i18n/config'
import { redirect } from '@/i18n/navigation'
import { createClient } from '@/lib/supabase/server'
import { signUpSchema } from '@/lib/schemas/auth.schema'
import { localizedUrl } from '@/lib/seo/site'

type SignUpField = 'fullName' | 'email' | 'password' | 'confirmPassword'

export interface SignUpState {
  /** Kod bledu z `messages/<locale>/errors.json`. */
  errorCode?: string
  /** Klucze walidacji z `messages/<locale>/validation.json`. */
  fieldErrors?: Partial<Record<SignUpField, string>>
}

/**
 * Rejestracja na serwerze — ten sam schemat Zod co wczesniej, tyle ze
 * wykonywany po stronie serwera, wiec walidator nie jedzie do przegladarki.
 */
export async function signUpAction(
  _prev: SignUpState,
  formData: FormData,
): Promise<SignUpState> {
  const parsed = signUpSchema.safeParse({
    fullName:        formData.get('fullName'),
    email:           formData.get('email'),
    password:        formData.get('password'),
    confirmPassword: formData.get('confirmPassword'),
  })

  if (!parsed.success) {
    const fieldErrors: SignUpState['fieldErrors'] = {}
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as SignUpField
      fieldErrors[key] ??= issue.message
    }
    return { fieldErrors }
  }

  const locale = toAppLocale(await getLocale())
  const supabase = await createClient()
  const { error } = await supabase.auth.signUp({
    email:    parsed.data.email,
    password: parsed.data.password,
    options: {
      // Link z maila potwierdzajacego wraca do TEJ SAMEJ wersji jezykowej,
      // w ktorej uzytkownik sie rejestrowal.
      emailRedirectTo:
        process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ||
        localizedUrl(locale, '/dashboard'),
      // `preferred_locale` od pierwszej sekundy konta — dzieki temu jezyk
      // jedzie za uzytkownikiem na kolejne urzadzenie.
      data: { full_name: parsed.data.fullName, preferred_locale: locale },
    },
  })

  if (error) return { errorCode: 'AUTH_SIGN_UP_FAILED' }

  redirect({ href: '/auth/sign-up-success', locale })

  // Patrz komentarz w `login.action.ts` — linia nieosiagalna, wymagana przez typ.
  return {}
}
