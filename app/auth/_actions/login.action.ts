'use server'

import { redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'
import { loginSchema } from '@/lib/schemas/auth.schema'

export interface LoginState {
  error?: string
  fieldErrors?: Partial<Record<'email' | 'password', string>>
}

/**
 * Logowanie wykonuje sie w calosci na serwerze — dzieki temu ani
 * `@supabase/supabase-js`, ani `zod` nie trafiaja do bundla klienta.
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
  if (error) return { error: 'Nieprawidłowy email lub hasło' }

  redirect('/dashboard')
}
