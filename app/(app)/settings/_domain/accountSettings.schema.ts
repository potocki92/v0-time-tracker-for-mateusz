import { z } from 'zod'

export const accountSettingsSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(2, 'Imię musi mieć min. 2 znaki')
    .max(40, 'Imię może mieć maks. 40 znaków'),
  lastName: z
    .string()
    .trim()
    .min(2, 'Nazwisko musi mieć min. 2 znaki')
    .max(60, 'Nazwisko może mieć maks. 60 znaków'),
  username: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, 'Nazwa użytkownika musi mieć min. 3 znaki')
    .max(30, 'Nazwa użytkownika może mieć maks. 30 znaków')
    .regex(/^[a-z0-9_.-]+$/, 'Użyj tylko małych liter, cyfr oraz znaków: _ . -'),
})

export type AccountSettingsSchema = z.infer<typeof accountSettingsSchema>

export const avatarFileSchema = z
  .instanceof(File)
  .refine((file) => file.size <= 2 * 1024 * 1024, 'Maksymalny rozmiar to 2MB')
  .refine(
    (file) => ['image/jpeg', 'image/png', 'image/webp'].includes(file.type),
    'Dozwolone formaty: JPG, PNG, WEBP',
  )
