import type { VatMode } from '@/lib/schemas/invoice-builder.schema'

export interface VatOption {
  value: string
  label: string
  mode: VatMode
  rate: number
}

/**
 * Single source of truth for the VAT picker. Includes Polish standard rates
 * plus the three special modes. Foreign VAT rates can be added inline by the
 * caller — the schema accepts any 0–100 numeric rate when mode === 'standard'.
 */
export const VAT_OPTIONS: VatOption[] = [
  { value: 'rate:23', label: '23%', mode: 'standard', rate: 23 },
  { value: 'rate:8', label: '8%', mode: 'standard', rate: 8 },
  { value: 'rate:5', label: '5%', mode: 'standard', rate: 5 },
  { value: 'rate:0', label: '0%', mode: 'standard', rate: 0 },
  { value: 'mode:zw', label: 'zw. (zwolnione)', mode: 'zw', rate: 0 },
  { value: 'mode:np', label: 'np. (nie podlega)', mode: 'np', rate: 0 },
  { value: 'mode:rc', label: 'Reverse charge', mode: 'rc', rate: 0 },
]
