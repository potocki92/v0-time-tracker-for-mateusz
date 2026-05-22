import type { InvoiceStatus } from '../../components/StatusChip'

export const START_SECONDS = 2 * 3600 + 14 * 60 + 8

// 35-cell bento calendar intensities — seeded by hand (no Math.random)
export const BENTO_CAL: number[] = [
  1, 0, 2, 1, 3,
  0, 1, 2, 0, 1,
  3, 1, 0, 2, 1,
  0, 3, 3, 1, 2,
  0, 1, 3, 3, 0,
  1, 2, 0, 3, 1,
  0, 2, 1, 0, 2,
]

export const REPORT_BARS = [38, 60, 48, 80, 32, 55, 95]

export const INVOICES: { id: string; status: InvoiceStatus; amount: string }[] = [
  { id: 'FR_5_04_2026', status: 'Open', amount: '€2,240' },
  { id: 'FR_4_04_2026', status: 'Paid', amount: '€1,295' },
  { id: 'FR_3_04_2026', status: 'Draft', amount: '€1,652' },
]

export const INTEGRATIONS = ['Stripe SEPA', 'Google Cal', 'Slack', 'Linear', '+ 14 more']
