'use client'

import { useMutation } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

import { createClient } from '@/lib/supabase/client'
import { MUTATION_KEYS } from '@/lib/query/mutationKeys'
import type { SignUpInput } from '@/lib/schemas/auth.schema'

interface UseSignUpMutationOptions {
  /** Path users are routed to after the sign-up request succeeds. */
  successPath?: string
}

/**
 * Creates a new Supabase account with `full_name` metadata and routes the
 * user to the email confirmation notice on success.
 */
export function useSignUpMutation({
  successPath = '/auth/sign-up-success',
}: UseSignUpMutationOptions = {}) {
  const router = useRouter()

  return useMutation({
    mutationKey: MUTATION_KEYS.auth.signUp,
    mutationFn: async (input: SignUpInput) => {
      const supabase = createClient()

      const emailRedirectTo =
        process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ||
        (typeof window !== 'undefined'
          ? `${window.location.origin}/dashboard`
          : undefined)

      const { data, error } = await supabase.auth.signUp({
        email:    input.email,
        password: input.password,
        options: {
          emailRedirectTo,
          data: { full_name: input.fullName },
        },
      })

      if (error) throw new Error(error.message)
      return data
    },
    onSuccess: () => {
      toast.success('Sprawdź email, aby potwierdzić konto!')
      router.push(successPath)
    },
    onError: (err: Error) => {
      toast.error(err.message)
    },
  })
}
