import { createClient } from '@/lib/supabase/client'
import type { AccountProfile, AccountSettingsFormValues } from '../_domain'

type ProfileRow = {
  id: string
  full_name: string | null
  username: string | null
  avatar_url: string | null
  email: string | null
}

export async function fetchAccountProfile(): Promise<AccountProfile> {
  const supabase = createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError) throw authError
  if (!user) throw new Error('Brak aktywnej sesji użytkownika')

  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, username, avatar_url, email')
    .eq('id', user.id)
    .maybeSingle<ProfileRow>()

  if (error) throw error
  if (!data) {
    return {
      id: user.id,
      full_name: (user.user_metadata.full_name as string | undefined) ?? null,
      username: null,
      avatar_url: (user.user_metadata.avatar_url as string | undefined) ?? null,
      email: user.email ?? null,
    }
  }

  return {
    id: data.id,
    full_name: data.full_name,
    username: data.username,
    avatar_url: data.avatar_url,
    email: data.email ?? user.email ?? null,
  }
}

export async function updateAccountProfile(values: AccountSettingsFormValues) {
  const supabase = createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError) throw authError
  if (!user) throw new Error('Brak aktywnej sesji użytkownika')

  const payload = {
    id: user.id,
    full_name: values.fullName,
    username: values.username,
    email: user.email ?? null,
    updated_at: new Date().toISOString(),
  }

  const { error } = await supabase.from('profiles').upsert(payload, { onConflict: 'id' })
  if (error) throw error
}

export async function uploadAvatar(file: File): Promise<string> {
  const supabase = createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError) throw authError
  if (!user) throw new Error('Brak aktywnej sesji użytkownika')

  const ext = file.name.split('.').pop() ?? 'jpg'
  const path = `${user.id}/${crypto.randomUUID()}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(path, file, { upsert: true, cacheControl: '3600' })

  if (uploadError) throw uploadError

  const { data } = supabase.storage.from('avatars').getPublicUrl(path)
  const publicUrl = data.publicUrl

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ avatar_url: publicUrl, updated_at: new Date().toISOString() })
    .eq('id', user.id)

  if (updateError) throw updateError

  return publicUrl
}
