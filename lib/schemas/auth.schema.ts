import { z } from 'zod'

import { PASSWORD_MIN } from './auth.constants'

const emailField = z
  .string({ required_error: 'Email jest wymagany' })
  .trim()
  .min(1, 'Email jest wymagany')
  .email('Niepoprawny adres email')

const passwordField = z
  .string({ required_error: 'Hasło jest wymagane' })
  .min(PASSWORD_MIN, `Hasło musi mieć min. ${PASSWORD_MIN} znaków`)
  .max(128, 'Hasło jest zbyt długie')

export const loginSchema = z.object({
  email:    emailField,
  password: z.string().min(1, 'Hasło jest wymagane'),
})
export const signUpSchema = z
  .object({
    fullName: z
      .string({ required_error: 'Imię i nazwisko jest wymagane' })
      .trim()
      .min(2, 'Imię i nazwisko jest wymagane'),
    email:           emailField,
    password:        passwordField,
    confirmPassword: z.string().min(1, 'Powtórz hasło'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path:    ['confirmPassword'],
    message: 'Hasła muszą być identyczne',
  })
