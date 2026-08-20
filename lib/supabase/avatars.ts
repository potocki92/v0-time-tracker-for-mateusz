export const AVATARS_BUCKET = 'avatars'

/**
 * Publiczny adres pliku w Storage, zbudowany ze stringa.
 *
 * Dokładnie to, co robi `supabase.storage.from(b).getPublicUrl(p)` — sklejenie
 * ścieżki i `encodeURI`. Zero round-tripu, więc nie ma powodu, żeby dla samego
 * tego wywołania wciągać `supabase-js` (61,8 kB gzip) do bundla przeglądarki.
 */
export function toPublicAvatarUrl(path: string | null | undefined): string | null {
  if (!path) return null

  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!baseUrl) return null

  return encodeURI(`${baseUrl}/storage/v1/object/public/${AVATARS_BUCKET}/${path}`)
}
