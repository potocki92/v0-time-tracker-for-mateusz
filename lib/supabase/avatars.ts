import { createClient } from '@/lib/supabase/client'

export const AVATARS_BUCKET = 'avatars'

const SIGNED_URL_TTL_SECONDS = 60 * 60

export function toPublicAvatarUrl(path: string | null | undefined): string | null {
  if (!path) return null

  const supabase = createClient()
  const { data } = supabase.storage.from(AVATARS_BUCKET).getPublicUrl(path)

  return data.publicUrl ?? null
}

export async function createSignedAvatarUrl(
  path: string | null | undefined,
  expiresIn: number = SIGNED_URL_TTL_SECONDS,
): Promise<string | null> {
  if (!path) return null

  const supabase = createClient()
  const { data, error } = await supabase.storage
    .from(AVATARS_BUCKET)
    .createSignedUrl(path, expiresIn)

  if (error || !data?.signedUrl) return null

  return data.signedUrl
}

/**
 * Returns the most reliable avatar URL available.
 * Tries public URL first (works for public buckets with zero roundtrip),
 * then falls back to a signed URL if the public URL is inaccessible.
 *
 * Because we cannot synchronously probe remote 403s, we always issue a signed
 * URL when `preferSigned` is true — use it when the bucket may be private.
 */
export async function resolveAvatarUrl(
  path: string | null | undefined,
  options: { preferSigned?: boolean } = {},
): Promise<string | null> {
  if (!path) return null
  if (options.preferSigned) return createSignedAvatarUrl(path)

  const publicUrl = toPublicAvatarUrl(path)
  if (publicUrl) return publicUrl

  return createSignedAvatarUrl(path)
}
