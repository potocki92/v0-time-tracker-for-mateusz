import { createClient } from '@/lib/supabase/client'

export const AVATARS_BUCKET = 'avatars'

export function toPublicAvatarUrl(path: string | null | undefined): string | null {
  if (!path) return null

  const supabase = createClient()
  const { data } = supabase.storage.from(AVATARS_BUCKET).getPublicUrl(path)

  return data.publicUrl
}
