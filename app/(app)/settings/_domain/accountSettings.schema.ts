import { z } from 'zod'

export const accountSettingsSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, 'Imię i nazwisko musi mieć min. 2 znaki')
    .max(80, 'Imię i nazwisko może mieć maks. 80 znaków'),
  username: z
    .string()
    .trim()
    .min(3, 'Nazwa użytkownika musi mieć min. 3 znaki')
    .max(30, 'Nazwa użytkownika może mieć maks. 30 znaków')
    .regex(
      /^[a-zA-Z0-9_.-]+$/,
      'Użyj tylko liter, cyfr oraz znaków: _ . -',
    ),
})

export type AccountSettingsSchema = z.infer<typeof accountSettingsSchema>

export const avatarFileSchema = z
  .instanceof(File)
  .refine((file) => file.size <= 2 * 1024 * 1024, 'Maksymalny rozmiar to 2MB')
  .refine(
    (file) => ['image/jpeg', 'image/png', 'image/webp'].includes(file.type),
    'Dozwolone formaty: JPG, PNG, WEBP',
  )
