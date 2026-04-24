import type { SupabaseClient } from '@supabase/supabase-js'

const DEFAULT_BUCKET = 'invoices'

interface UploadInvoicePdfParams {
  supabase: SupabaseClient
  userId: string
  file: File
  bucket?: string
}

export interface UploadedInvoicePdf {
  /** Storage-relative path (e.g. "{userId}/{ts}_name.pdf"). Required for deletion. */
  filePath: string
  /** Public URL that can be persisted on the invoice row. */
  publicUrl: string
  /** Bucket used for the upload. */
  bucket: string
}

/** Extract the storage path from a public URL produced by uploadInvoicePdf. */
export function extractInvoicePdfPath(
  publicUrl: string | null | undefined,
  bucket: string = DEFAULT_BUCKET,
): string | null {
  if (!publicUrl) return null
  const marker = `/object/public/${bucket}/`
  const idx = publicUrl.indexOf(marker)
  if (idx === -1) return null
  const path = publicUrl.slice(idx + marker.length)
  try {
    return decodeURIComponent(path)
  } catch {
    return path
  }
}

/**
 * Upload a PDF to Supabase Storage. Returns both the public URL (to persist on
 * the invoice row) and the filePath (needed for compensating cleanup if the
 * owning transaction fails later).
 */
export async function uploadInvoicePdfWithMeta({
  supabase,
  userId,
  file,
  bucket = DEFAULT_BUCKET,
}: UploadInvoicePdfParams): Promise<UploadedInvoicePdf> {
  const safeName = file.name.replace(/[^a-zA-Z0-9_.-]/g, '_')
  const filePath = `${userId}/${Date.now()}_${safeName}`

  const { error: uploadError } = await supabase.storage.from(bucket).upload(filePath, file, {
    contentType: 'application/pdf',
    upsert: false,
  })

  if (uploadError) {
    throw uploadError
  }

  const { data: publicData } = supabase.storage.from(bucket).getPublicUrl(filePath)
  return { filePath, publicUrl: publicData.publicUrl, bucket }
}

/**
 * @deprecated Prefer uploadInvoicePdfWithMeta — keeps the file path for cleanup.
 * Retained so older callers keep compiling until migrated.
 */
export async function uploadInvoicePdf(params: UploadInvoicePdfParams): Promise<string> {
  const { publicUrl } = await uploadInvoicePdfWithMeta(params)
  return publicUrl
}

/** Best-effort removal of an uploaded PDF. Never throws. Returns true on success. */
export async function removeInvoicePdf(
  supabase: SupabaseClient,
  filePath: string,
  bucket: string = DEFAULT_BUCKET,
): Promise<boolean> {
  if (!filePath) return false
  try {
    const { error } = await supabase.storage.from(bucket).remove([filePath])
    if (error) {
      if (process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.warn('[invoice-storage] failed to remove PDF', filePath, error.message)
      }
      return false
    }
    return true
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.warn('[invoice-storage] removeInvoicePdf threw', err)
    }
    return false
  }
}
