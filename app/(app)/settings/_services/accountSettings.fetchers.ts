import { createClient } from '@/lib/supabase/client'
import type { AccountProfile, AccountSettingsFormValues } from '../_domain'

type ProfileRow = {
  id: string
  first_name: string | null
  last_name: string | null
  username: string | null
  email: string | null
  avatar_path: string | null
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

function toPublicAvatarUrl(path: string | null) {
  if (!path) return null

  const supabase = createClient()
  const { data } = supabase.storage.from('avatars').getPublicUrl(path)
  return data.publicUrl
}

function mapProfile(row: ProfileRow, fallbackEmail: string | null): AccountProfile {
  const firstName = row.first_name?.trim() ?? ''
  const lastName = row.last_name?.trim() ?? ''

  return {
    id: row.id,
    firstName,
    lastName,
    username: row.username?.trim() ?? '',
    email: row.email?.trim() ?? fallbackEmail ?? '',
    avatarPath: row.avatar_path,
    avatarUrl: toPublicAvatarUrl(row.avatar_path),
  }
}

async function upsertMissingProfile(userId: string, email: string | null) {
  const supabase = createClient()

  const { error } = await supabase.from('profiles').upsert(
    {
      id: userId,
      email,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'id' },
  )

  if (error) {
    throw new Error(`Nie udało się przygotować profilu: ${error.message}`)
  }
}

export async function fetchAccountProfile(): Promise<AccountProfile> {
  const { supabase, user } = await getCurrentUser()

  const { data, error } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, username, email, avatar_path')
    .eq('id', user.id)
    .maybeSingle<ProfileRow>()

  if (error) {
    throw new Error(`Nie udało się pobrać profilu: ${error.message}`)
  }

  if (!data) {
    await upsertMissingProfile(user.id, user.email ?? null)

    return {
      id: user.id,
      firstName: '',
      lastName: '',
      username: '',
      email: user.email ?? '',
      avatarPath: null,
      avatarUrl: null,
    }
  }

  return mapProfile(data, user.email ?? null)
}

export async function updateAccountProfile(values: AccountSettingsFormValues) {
  const { supabase, user } = await getCurrentUser()

  const { error } = await supabase
    .from('profiles')
    .update({
      first_name: values.firstName,
      last_name: values.lastName,
      username: values.username,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)

  if (error) {
    throw new Error(`Nie udało się zapisać profilu: ${error.message}`)
  }
}

export async function uploadAvatar(file: File): Promise<{ avatarPath: string; avatarUrl: string }> {
  const { supabase, user } = await getCurrentUser()

  const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const avatarPath = `${user.id}/${crypto.randomUUID()}.${extension}`

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(avatarPath, file, { upsert: true, cacheControl: '3600' })

  if (uploadError) {
    throw new Error(`Nie udało się wgrać pliku: ${uploadError.message}`)
  }

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ avatar_path: avatarPath, updated_at: new Date().toISOString() })
    .eq('id', user.id)

  if (updateError) {
    throw new Error(`Nie udało się zapisać avatara: ${updateError.message}`)
  }

  const avatarUrl = toPublicAvatarUrl(avatarPath)

  if (!avatarUrl) {
    throw new Error('Nie udało się wygenerować publicznego adresu avatara')
  }

  return { avatarPath, avatarUrl }
}
