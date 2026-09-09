import { z } from 'zod'

import { PASSWORD_MIN } from './auth.constants'

/**
 * Schematy auth zwracaja KODY WALIDACJI, nie gotowe zdania.
 *
 * Warstwa domenowa nie zna jezyka uzytkownika — Server Action moze zostac
 * wywolana z dowolna wersja jezykowa interfejsu. Kod (`email.required`) jest
 * kluczem w `messages/<locale>/validation.json` i tlumaczy go formularz.
 * Dzieki temu niemieckie UI nigdy nie pokaze polskiego bledu.
 */
const emailField = z
  .string({ required_error: 'email.required' })
  .trim()
  .min(1, 'email.required')
  .email('email.invalid')

const passwordField = z
  .string({ required_error: 'password.required' })
  .min(PASSWORD_MIN, 'password.tooShort')
  .max(128, 'password.tooLong')

export const loginSchema = z.object({
  email:    emailField,
  password: z.string().min(1, 'password.required'),
})

export const signUpSchema = z
  .object({
    fullName: z
      .string({ required_error: 'fullName.required' })
      .trim()
      .min(2, 'fullName.required'),
    email:           emailField,
    password:        passwordField,
    confirmPassword: z.string().min(1, 'password.repeat'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path:    ['confirmPassword'],
    message: 'password.mismatch',
  })
