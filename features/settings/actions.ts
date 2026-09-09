'use server'

import { revalidatePath } from 'next/cache'
import { getLocale } from 'next-intl/server'

import type { AppLocale } from '@/i18n/config'

import { requireServerUser } from '@/lib/auth/server-user'
import { createClient } from '@/lib/supabase/server'
import { AVATARS_BUCKET } from '@/lib/supabase/avatars'
import { resolveAvatarUrl } from '@/lib/supabase/avatars.server'
import { invoiceSettingsSchema } from '@/lib/schemas/invoice-settings.schema'
import { sendMail } from '@/lib/email/mailer'
import { fail, ok, type ActionResult } from '@/lib/errors/action-result'
import { renderWeeklySummaryEmail } from '@/features/dashboard/server'
import {
  accountSettingsSchema,
  avatarFileSchema,
  weeklySummaryEmailSchema,
  type AccountProfile,
  type AccountSettingsFormValues,
  type InvoiceSettings,
  type WeeklySummaryEmailSettings,
} from './domain'

/**
 * Server Actions modulu Settings.
 *
 * `createClient()` z '@/lib/supabase/server' jedzie na anon key + ciasteczkach
 * sesji, wiec RLS nadal decyduje, co wolno przeczytac i zapisac. Klucz
 * service-role nie ma tu wstepu.
 */

type UserMetadata = {
  first_name?: string
  last_name?: string
  username?: string
  avatar_path?: string
  invoice_settings?: Partial<InvoiceSettings>
}

/** Sufit listy klientow w selectcie auto-fakturowania. */
const MAX_AUTO_INVOICE_CLIENTS = 500

const DEFAULT_INVOICE_SETTINGS: InvoiceSettings = invoiceSettingsSchema.parse({})

/**
 * Server Actions ZWRACAJA kody bledow (`ActionResult`), nie zdania. Warstwa
 * domenowa nie zna jezyka uzytkownika; tlumaczy dopiero UI, przez
 * `messages/<locale>/errors.json`. Surowy komunikat Supabase nigdy nie trafia
 * do uzytkownika — jest po angielsku, niesie szczegoly implementacyjne i
 * bywa mylacy. Zostaje w logach serwera.
 */
function logCause(code: string, cause: unknown): void {
  console.error(`[settings] ${code}`, cause)
}

export async function fetchAccountProfileAction(): Promise<ActionResult<AccountProfile>> {
  const user = await requireServerUser()
  const supabase = await createClient()

  const metadata = (user.user_metadata ?? {}) as UserMetadata
  const avatarPath = metadata.avatar_path ?? null
  const avatarUrl = await resolveAvatarUrl(avatarPath, { preferSigned: true })

  const { data: clientsData, error: clientsError } = await supabase
    .from('clients')
    .select('id, name')
    .eq('user_id', user.id)
    .order('name', { ascending: true })
    // Select do auto-fakturowania — jawny sufit zamiast odczytu rosnacego
    // liniowo z liczba klientow.
    .limit(MAX_AUTO_INVOICE_CLIENTS)

  if (clientsError) {
    logCause('AUTOMATION_CLIENTS_LOAD_FAILED', clientsError)
    return fail('AUTOMATION_CLIENTS_LOAD_FAILED')
  }

  return ok({
    id: user.id,
    firstName: metadata.first_name?.trim() ?? '',
    lastName: metadata.last_name?.trim() ?? '',
    username: metadata.username?.trim() ?? '',
    email: user.email ?? '',
    avatarPath,
    avatarUrl,
    invoiceSettings: {
      ...DEFAULT_INVOICE_SETTINGS,
      ...(metadata.invoice_settings ?? {}),
    },
    invoiceAutomationClients: (clientsData ?? []).map((client: { id: string; name: string }) => ({
      id: client.id,
      name: client.name,
    })),
  })
}

export async function updateAccountProfileAction(
  values: AccountSettingsFormValues,
): Promise<ActionResult> {
  const parsed = accountSettingsSchema.safeParse(values)
  if (!parsed.success) return fail('INVALID_ACCOUNT_SETTINGS')

  const user = await requireServerUser()
  const supabase = await createClient()
  const existingMetadata = (user.user_metadata ?? {}) as UserMetadata

  const { error } = await supabase.auth.updateUser({
    data: {
      ...existingMetadata,
      first_name: parsed.data.firstName,
      last_name: parsed.data.lastName,
      username: parsed.data.username,
    },
  })

  if (error) {
    logCause('ACCOUNT_PROFILE_SAVE_FAILED', error)
    return fail('ACCOUNT_PROFILE_SAVE_FAILED')
  }

  // Imie w AppShellu renderuje sie serwerowo w layoucie panelu, poza React
  // Query — to jedyna czesc, ktorej invalidateQueries nie odswiezy.
  revalidatePath('/[locale]/(app)', 'layout')
  return ok(undefined)
}

export async function updateInvoiceAutomationSettingsAction(
  values: InvoiceSettings,
): Promise<ActionResult> {
  const parsed = invoiceSettingsSchema.safeParse(values)
  if (!parsed.success) return fail('INVALID_INVOICE_SETTINGS')

  const user = await requireServerUser()
  const supabase = await createClient()
  const existingMetadata = (user.user_metadata ?? {}) as UserMetadata

  const { error } = await supabase.auth.updateUser({
    data: {
      ...existingMetadata,
      invoice_settings: parsed.data,
    },
  })

  if (error) {
    logCause('INVOICE_SETTINGS_SAVE_FAILED', error)
    return fail('INVOICE_SETTINGS_SAVE_FAILED')
  }

  return ok(undefined)
}

const WEEKLY_SUMMARY_TABLE = 'weekly_summary_email_settings'

export async function fetchWeeklySummaryEmailAction(): Promise<ActionResult<WeeklySummaryEmailSettings>> {
  const user = await requireServerUser()
  const supabase = await createClient()

  const { data, error } = await supabase
    .from(WEEKLY_SUMMARY_TABLE)
    .select('enabled, recipient_email')
    .eq('user_id', user.id)
    .maybeSingle()

  if (error) {
    logCause('WEEKLY_SUMMARY_LOAD_FAILED', error)
    return fail('WEEKLY_SUMMARY_LOAD_FAILED')
  }

  return ok({
    enabled: data?.enabled ?? false,
    recipientEmail: data?.recipient_email ?? '',
  })
}

export async function updateWeeklySummaryEmailAction(
  values: WeeklySummaryEmailSettings,
): Promise<ActionResult> {
  const parsed = weeklySummaryEmailSchema.safeParse(values)
  if (!parsed.success) return fail('INVALID_WEEKLY_SUMMARY_SETTINGS')

  const user = await requireServerUser()
  const supabase = await createClient()

  const { error } = await supabase.from(WEEKLY_SUMMARY_TABLE).upsert(
    {
      user_id: user.id,
      enabled: parsed.data.enabled,
      recipient_email: parsed.data.recipientEmail || null,
    },
    { onConflict: 'user_id' },
  )

  if (error) {
    logCause('WEEKLY_SUMMARY_SAVE_FAILED', error)
    return fail('WEEKLY_SUMMARY_SAVE_FAILED')
  }

  return ok(undefined)
}

/**
 * Wysylka na zadanie — ten sam tekst, ktory automat sle w sobote.
 *
 * Nie dotyka `last_sent_*`: proba z ustawien ma nie zabrac ksiegowej
 * cotygodniowego maila.
 */
export async function sendWeeklySummaryEmailNowAction(): Promise<
  ActionResult<{ recipient: string }>
> {
  const settingsResult = await fetchWeeklySummaryEmailAction()
  if (!settingsResult.ok) return settingsResult
  const settings = settingsResult.data

  if (!settings.recipientEmail) return fail('WEEKLY_SUMMARY_NO_RECIPIENT')

  const user = await requireServerUser()
  const supabase = await createClient()
  // Uzytkownik klikajacy „Wyslij teraz" JEST wlascicielem konta, wiec jezyk
  // jego interfejsu jest wlasciwym jezykiem maila.
  const locale = (await getLocale()) as AppLocale
  const email = await renderWeeklySummaryEmail(supabase, user.id, locale)

  if (email.isEmpty) return fail('WEEKLY_SUMMARY_EMPTY')

  await sendMail({ to: settings.recipientEmail, subject: email.subject, text: email.text })

  return ok({ recipient: settings.recipientEmail })
}

export async function uploadAvatarAction(
  file: File,
): Promise<ActionResult<{ avatarPath: string; avatarUrl: string }>> {
  const parsed = avatarFileSchema.safeParse(file)
  if (!parsed.success) return fail('INVALID_AVATAR_FILE')

  const user = await requireServerUser()
  const supabase = await createClient()

  const extension = parsed.data.name.split('.').pop()?.toLowerCase() || 'jpg'
  const avatarPath = `${user.id}/${crypto.randomUUID()}.${extension}`

  const { error: uploadError } = await supabase.storage
    .from(AVATARS_BUCKET)
    .upload(avatarPath, parsed.data, {
      upsert: true,
      cacheControl: '3600',
      contentType: parsed.data.type,
    })

  if (uploadError) {
    logCause('AVATAR_UPLOAD_FAILED', uploadError)
    return fail('AVATAR_UPLOAD_FAILED')
  }

  const existingMetadata = (user.user_metadata ?? {}) as UserMetadata

  const { error: updateError } = await supabase.auth.updateUser({
    data: {
      ...existingMetadata,
      avatar_path: avatarPath,
    },
  })

  if (updateError) {
    logCause('AVATAR_SAVE_FAILED', updateError)
    return fail('AVATAR_SAVE_FAILED')
  }

  const avatarUrl = await resolveAvatarUrl(avatarPath, { preferSigned: true })

  if (!avatarUrl) return fail('AVATAR_URL_FAILED')

  // Avatar w AppShellu przychodzi z serwerowego layoutu, nie z React Query.
  revalidatePath('/[locale]/(app)', 'layout')

  return ok({ avatarPath, avatarUrl })
}
