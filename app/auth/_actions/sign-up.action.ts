'use server'

import { redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'
import { signUpSchema } from '@/lib/schemas/auth.schema'
import { SITE } from '@/lib/seo/site'

type SignUpField = 'fullName' | 'email' | 'password' | 'confirmPassword'

export interface SignUpState {
  error?: string
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

  const supabase = await createClient()
  const { error } = await supabase.auth.signUp({
    email:    parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo:
        process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${SITE.url}/dashboard`,
      data: { full_name: parsed.data.fullName },
    },
  })

  if (error) return { error: error.message }

  redirect('/auth/sign-up-success')
}
