import { describe, it, expect } from 'vitest'
import { extractInvoicePdfPath } from '@/services/invoices'

describe('extractInvoicePdfPath', () => {
  it('extracts the path from a standard Supabase public URL', () => {
    const url = 'https://xyz.supabase.co/storage/v1/object/public/invoices/user123/1700000000_fv.pdf'
    expect(extractInvoicePdfPath(url)).toBe('user123/1700000000_fv.pdf')
  })

  it('decodes URL-encoded characters in the path', () => {
    const url =
      'https://xyz.supabase.co/storage/v1/object/public/invoices/user/1700000000_FV%20z%20ACME.pdf'
    expect(extractInvoicePdfPath(url)).toBe('user/1700000000_FV z ACME.pdf')
  })

  it('returns null when the URL does not belong to the invoices bucket', () => {
    const url = 'https://xyz.supabase.co/storage/v1/object/public/avatars/u/avatar.png'
    expect(extractInvoicePdfPath(url)).toBeNull()
  })

  it('supports a custom bucket name', () => {
    const url = 'https://xyz.supabase.co/storage/v1/object/public/pdfs/u/file.pdf'
    expect(extractInvoicePdfPath(url, 'pdfs')).toBe('u/file.pdf')
  })

  it('handles null / undefined / empty gracefully', () => {
    expect(extractInvoicePdfPath(null)).toBeNull()
    expect(extractInvoicePdfPath(undefined)).toBeNull()
    expect(extractInvoicePdfPath('')).toBeNull()
  })
})
