'use server'

import { getLocale } from 'next-intl/server'

import { redirect } from '@/i18n/navigation'
import { createClient } from '@/lib/supabase/server'
import { loginSchema } from '@/lib/schemas/auth.schema'

export interface LoginState {
  /** Kod bledu z `messages/<locale>/errors.json`, nie gotowe zdanie. */
  errorCode?: string
  /** Klucze walidacji z `messages/<locale>/validation.json`. */
  fieldErrors?: Partial<Record<'email' | 'password', string>>
}

/**
 * Logowanie wykonuje sie w calosci na serwerze — dzieki temu ani
 * `@supabase/supabase-js`, ani `zod` nie trafiaja do bundla klienta.
 *
 * Akcja nie zwraca ani jednego zdania w jezyku naturalnym: oddaje KODY,
 * ktore tlumaczy formularz. Surowy komunikat Supabase nigdy nie trafia do
 * uzytkownika — niesie szczegoly implementacyjne i jest po angielsku
 * niezaleznie od jezyka interfejsu.
 */
export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email:    formData.get('email'),
    password: formData.get('password'),
  })

  if (!parsed.success) {
    const fieldErrors: LoginState['fieldErrors'] = {}
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as 'email' | 'password'
      fieldErrors[key] ??= issue.message
    }
    return { fieldErrors }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword(parsed.data)
  if (error) return { errorCode: 'AUTH_INVALID_CREDENTIALS' }

  // Redirect swiadomy jezyka: uzytkownik, ktory logowal sie na `/de/auth/login`,
  // ma wyladowac na `/de/dashboard`, a nie na polskiej wersji panelu.
  redirect({ href: '/dashboard', locale: await getLocale() })

  // `redirect()` rzuca wyjatek nawigacyjny — ponizsza linia jest nieosiagalna,
  // ale wariant i18n nie ma sygnatury `never`, wiec TypeScript jej wymaga.
  return {}
}
