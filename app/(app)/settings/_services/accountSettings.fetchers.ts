import { createClient } from '@/lib/supabase/client'
import { AVATARS_BUCKET, resolveAvatarUrl } from '@/lib/supabase/avatars'
import type { AccountProfile, AccountSettingsFormValues, InvoiceSettings } from '../_domain'

type UserMetadata = {
  first_name?: string
  last_name?: string
  username?: string
  avatar_path?: string
  invoice_settings?: Partial<InvoiceSettings>
}

const DEFAULT_INVOICE_SETTINGS: InvoiceSettings = {
  numberingPattern: 'FV/{SERIA}/{YYYY}/{MM}/{SEQ}',
  series: 'A',
  branch: 'HQ',
  resetSequence: 'monthly',
  defaultTemplate: 'classic',
  templateAccentColor: '#1d4ed8',
  templateFooter: 'Dziękujemy za współpracę.',
  autoIssueEnabled: false,
  autoIssueDay: 6,
  dueDays: 7,
}

async function getCurrentUser() {
  const supabase = createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error) {
    throw new Error(`Błąd pobierania sesji: ${error.message}`)
  }

  if (!user) {
    throw new Error('Brak aktywnej sesji użytkownika')
  }

  return { supabase, user }
}

export async function fetchAccountProfile(): Promise<AccountProfile> {
  const { user } = await getCurrentUser()

  const metadata = (user.user_metadata ?? {}) as UserMetadata
  const avatarPath = metadata.avatar_path ?? null
  const avatarUrl = await resolveAvatarUrl(avatarPath, { preferSigned: true })

  return {
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
  }
}

export async function updateAccountProfile(values: AccountSettingsFormValues) {
  const { supabase, user } = await getCurrentUser()

  const existingMetadata = (user.user_metadata ?? {}) as UserMetadata

  const { error } = await supabase.auth.updateUser({
    data: {
      ...existingMetadata,
      first_name: values.firstName,
      last_name: values.lastName,
      username: values.username,
    },
  })

  if (error) {
    throw new Error(`Nie udało się zapisać profilu: ${error.message}`)
  }
}

export async function updateInvoiceAutomationSettings(values: InvoiceSettings) {
  const { supabase, user } = await getCurrentUser()
  const existingMetadata = (user.user_metadata ?? {}) as UserMetadata

  const { error } = await supabase.auth.updateUser({
    data: {
      ...existingMetadata,
      invoice_settings: values,
    },
  })

  if (error) {
    throw new Error(`Nie udało się zapisać ustawień faktur: ${error.message}`)
  }
}

export async function uploadAvatar(file: File): Promise<{ avatarPath: string; avatarUrl: string }> {
  const { supabase, user } = await getCurrentUser()

  const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const avatarPath = `${user.id}/${crypto.randomUUID()}.${extension}`

  const { error: uploadError } = await supabase.storage
    .from(AVATARS_BUCKET)
    .upload(avatarPath, file, { upsert: true, cacheControl: '3600', contentType: file.type })

  if (uploadError) {
    throw new Error(`Nie udało się wgrać pliku: ${uploadError.message}`)
  }

  const existingMetadata = (user.user_metadata ?? {}) as UserMetadata

  const { error: updateError } = await supabase.auth.updateUser({
    data: {
      ...existingMetadata,
      avatar_path: avatarPath,
    },
  })

  if (updateError) {
    throw new Error(`Nie udało się zapisać avatara: ${updateError.message}`)
  }

  const avatarUrl = await resolveAvatarUrl(avatarPath, { preferSigned: true })

  if (!avatarUrl) {
    throw new Error('Nie udało się wygenerować adresu avatara')
  }

  return { avatarPath, avatarUrl }
}
