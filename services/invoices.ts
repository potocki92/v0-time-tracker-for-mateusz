import type { SupabaseClient } from '@supabase/supabase-js'

interface UploadInvoicePdfParams {
  supabase: SupabaseClient
  userId: string
  file: File
  bucket?: string
}

export async function uploadInvoicePdf({ supabase, userId, file, bucket = 'invoices' }: UploadInvoicePdfParams) {
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
  return publicData.publicUrl
}
