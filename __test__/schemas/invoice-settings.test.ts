import { describe, it, expect, vi } from 'vitest'
import {
  invoiceSettingsSchema,
  resolveInvoiceSettings,
} from '@/lib/schemas/invoice-settings.schema'

describe('invoiceSettingsSchema', () => {
  it('fills defaults when input is empty', () => {
    const parsed = invoiceSettingsSchema.parse({})
    expect(parsed.userPrefix).toBe('FV')
    expect(parsed.defaultTemplate).toBe('classic')
    expect(parsed.dueDays).toBe(7)
    expect(parsed.autoIssueEnabled).toBe(false)
  })

  it('rejects invalid template key', () => {
    const result = invoiceSettingsSchema.safeParse({ defaultTemplate: 'fancy' })
    expect(result.success).toBe(false)
  })

  it('rejects invalid accent color', () => {
    const result = invoiceSettingsSchema.safeParse({ templateAccentColor: 'red' })
    expect(result.success).toBe(false)
  })

  it('accepts valid overrides', () => {
    const parsed = invoiceSettingsSchema.parse({
      userPrefix: 'INV',
      defaultTemplate: 'modern',
      templateAccentColor: '#ff00aa',
      autoIssueEnabled: true,
      dueDays: 14,
    })
    expect(parsed.userPrefix).toBe('INV')
    expect(parsed.defaultTemplate).toBe('modern')
    expect(parsed.dueDays).toBe(14)
  })

  it('coerces dueDays string to number', () => {
    expect(invoiceSettingsSchema.parse({ dueDays: '21' }).dueDays).toBe(21)
  })
})

describe('resolveInvoiceSettings (never-throws)', () => {
  it('returns defaults for null/undefined metadata', () => {
    const fromNull = resolveInvoiceSettings(null)
    const fromUndefined = resolveInvoiceSettings(undefined)
    expect(fromNull).toEqual(fromUndefined)
    expect(fromNull.defaultTemplate).toBe('classic')
  })

  it('merges partial invoice_settings with defaults', () => {
    const settings = resolveInvoiceSettings({ invoice_settings: { userPrefix: 'FV2025' } })
    expect(settings.userPrefix).toBe('FV2025')
    expect(settings.templateFooter).toBe('Dziękujemy za współpracę.')
  })

  it('falls back to defaults when invoice_settings is malformed, and reports via onWarn', () => {
    const onWarn = vi.fn()
    const settings = resolveInvoiceSettings(
      { invoice_settings: { defaultTemplate: 'not-real', dueDays: 'oops' } },
      onWarn,
    )
    expect(settings.defaultTemplate).toBe('classic')
    expect(onWarn).toHaveBeenCalledTimes(1)
  })

  it('ignores unrelated metadata keys without complaining', () => {
    const settings = resolveInvoiceSettings({ some_other_flag: true, invoice_settings: {} })
    expect(settings.defaultTemplate).toBe('classic')
  })

  it('does not throw on completely non-object metadata', () => {
    expect(() => resolveInvoiceSettings('garbage')).not.toThrow()
    expect(() => resolveInvoiceSettings(42)).not.toThrow()
  })
})
