'use client'

import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'

import { createClient } from '@/lib/supabase/client'
import { MUTATION_KEYS } from '@/lib/query/mutationKeys'
import type { LoginInput } from '@/lib/schemas/auth.schema'

interface UseLoginMutationOptions {
  /** Destination after successful login. Uses full-page navigation so middleware sees fresh cookies. */
  redirectTo?: string
}

/**
 * Signs in with email/password via Supabase.
 * Throws on failure so React Hook Form's `handleSubmit` can surface errors,
 * also invokes toasts for user feedback.
 */
export function useLoginMutation({
  redirectTo = '/dashboard',
}: UseLoginMutationOptions = {}) {
  return useMutation({
    mutationKey: MUTATION_KEYS.auth.login,
    mutationFn: async (input: LoginInput) => {
      const supabase = createClient()
      const { data, error } = await supabase.auth.signInWithPassword({
        email:    input.email,
        password: input.password,
      })

      if (error) throw new Error('Nieprawidłowy email lub hasło')
      if (!data.session) throw new Error('Nie udało się utworzyć sesji. Spróbuj ponownie.')

      return data
    },
    onSuccess: () => {
      toast.success('Zalogowano pomyślnie!')
      // Full page navigation → middleware reads fresh auth cookies.
      if (typeof window !== 'undefined') {
        window.location.assign(redirectTo)
      }
    },
    onError: (err: Error) => {
      toast.error(err.message)
    },
  })
}
