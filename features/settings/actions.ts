'use server'

import { revalidatePath } from 'next/cache'

import { requireServerUser } from '@/lib/auth/server-user'
import { createClient } from '@/lib/supabase/server'
import { AVATARS_BUCKET } from '@/lib/supabase/avatars'
import { resolveAvatarUrl } from '@/lib/supabase/avatars.server'
import { invoiceSettingsSchema } from '@/lib/schemas/invoice-settings.schema'
import {
  accountSettingsSchema,
  avatarFileSchema,
  type AccountProfile,
  type AccountSettingsFormValues,
  type InvoiceSettings,
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

/** Pierwszy komunikat walidacji — laduje w tym samym toascie, co bledy Supabase. */
function firstIssue(error: { issues: { message: string }[] }, fallback: string): string {
  return error.issues[0]?.message ?? fallback
}

export async function fetchAccountProfileAction(): Promise<AccountProfile> {
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
    throw new Error(`Nie udało się pobrać klientów dla auto-fakturowania: ${clientsError.message}`)
  }

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
    invoiceAutomationClients: (clientsData ?? []).map((client: { id: string; name: string }) => ({
      id: client.id,
      name: client.name,
    })),
  }
}

export async function updateAccountProfileAction(
  values: AccountSettingsFormValues,
): Promise<void> {
  const parsed = accountSettingsSchema.safeParse(values)
  if (!parsed.success) {
    throw new Error(firstIssue(parsed.error, 'Nieprawidłowe dane profilu'))
  }

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
    throw new Error(`Nie udało się zapisać profilu: ${error.message}`)
  }

  // Imie w AppShellu renderuje sie serwerowo w layoucie panelu, poza React
  // Query — to jedyna czesc, ktorej invalidateQueries nie odswiezy.
  revalidatePath('/(app)', 'layout')
}

export async function updateInvoiceAutomationSettingsAction(
  values: InvoiceSettings,
): Promise<void> {
  const parsed = invoiceSettingsSchema.safeParse(values)
  if (!parsed.success) {
    throw new Error(firstIssue(parsed.error, 'Nieprawidłowe ustawienia faktur'))
  }

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
    throw new Error(`Nie udało się zapisać ustawień faktur: ${error.message}`)
  }

}

export async function uploadAvatarAction(
  file: File,
): Promise<{ avatarPath: string; avatarUrl: string }> {
  const parsed = avatarFileSchema.safeParse(file)
  if (!parsed.success) {
    throw new Error(firstIssue(parsed.error, 'Nieprawidłowy plik'))
  }

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

  // Avatar w AppShellu przychodzi z serwerowego layoutu, nie z React Query.
  revalidatePath('/(app)', 'layout')

  return { avatarPath, avatarUrl }
}
