import { z } from 'zod'

import { isValidTimeZone } from '@/lib/date/timezone'
import { WEEKDAY_KEYS } from './workAutomation.constants'

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Nieprawidłowa data')

/**
 * Wlaczony dzien musi miec dodatnia liczbe godzin — inaczej automat zapisalby
 * dzien pracy z zerem godzin. Gorna granica to doba.
 */
const weekdayPlanSchema = z
  .object({
    enabled: z.boolean(),
    // `coerce`, bo <Input type="number"> oddaje string — walidacja ma byc ta
    // sama po stronie formularza i po stronie Server Action.
    hours: z.coerce
      .number({ invalid_type_error: 'Podaj liczbę godzin' })
      .min(0, 'Godziny nie mogą być ujemne')
      .max(24, 'Maks. 24 godziny'),
  })
  .refine((plan) => !plan.enabled || plan.hours > 0, {
    message: 'Włączony dzień musi mieć dodatnią liczbę godzin',
    path: ['hours'],
  })

const weekScheduleSchema = z.object(
  Object.fromEntries(WEEKDAY_KEYS.map((key) => [key, weekdayPlanSchema])) as Record<
    (typeof WEEKDAY_KEYS)[number],
    typeof weekdayPlanSchema
  >,
)

export const workAutomationSettingsSchema = z
  .object({
    enabled: z.boolean(),
    startDate: isoDate,
    runTime: z.string().regex(/^([01][0-9]|2[0-3]):[0-5][0-9]$/, 'Podaj godzinę w formacie HH:mm'),
    // Strefy sprawdzamy baza IANA, nie lista w kodzie — inaczej select
    // ograniczalby to, co i tak jest poprawne.
    timeZone: z.string().trim().refine(isValidTimeZone, 'Nieznana strefa czasowa'),
    weekSchedule: weekScheduleSchema,
    clientId: z.string().uuid('Nieprawidłowy klient').or(z.literal('')),
    projectId: z.string().uuid('Nieprawidłowy projekt').or(z.literal('')),
  })
  // Automat wlacza sie wylacznie ze swiadomie zapisana, kompletna konfiguracja.
  .refine((values) => !values.enabled || values.clientId !== '', {
    message: 'Wybierz klienta, do którego trafią wpisy',
    path: ['clientId'],
  })
  .refine(
    (values) =>
      !values.enabled ||
      WEEKDAY_KEYS.some((key) => values.weekSchedule[key].enabled && values.weekSchedule[key].hours > 0),
    { message: 'Włącz przynajmniej jeden dzień tygodnia', path: ['weekSchedule'] },
  )

export type WorkAutomationSettingsInput = z.infer<typeof workAutomationSettingsSchema>

export const resumeWorkSchema = z.object({
  resumeDate: isoDate,
})
