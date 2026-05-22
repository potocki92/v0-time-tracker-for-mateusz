import type { ReactNode } from 'react'

import type { InvoiceStatus } from '../../components/StatusChip'

export const INTENSITIES = [
  0, 0,
  2, 3, 1, 0, 0,
  1, 3, 2, 2, 3, 0, 0,
  3, 2, 3, 3, 2, 0, 0,
  2, 3, 2, 3, 1, 0, 0,
  3, 2,
]

export const CALENDAR_OFFSET = 2
export const TODAY_INDEX = 21

export const CASHFLOW_BARS = [35, 50, 30, 62, 24, 96]
export const CASHFLOW_MONTHS = ['Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr']

export const INVOICES: { id: string; status: InvoiceStatus; amount: string }[] = [
  { id: 'FR_5_04_2026', status: 'Open', amount: '€2,240' },
  { id: 'FR_4_04_2026', status: 'Paid', amount: '€1,295' },
  { id: 'FR_3_04_2026', status: 'Draft', amount: '€1,652' },
]

export interface ShowcaseStep {
  num: string
  title: string
  heading: ReactNode
  body: string
}

export const STEPS: ShowcaseStep[] = [
  {
    num: '01',
    title: 'Dashboard',
    heading: 'See the week without squinting.',
    body: 'Every hour tracked lands on one surface — KPIs, cashflow chart, live entries. Refresh is instant. Decisions are faster.',
  },
  {
    num: '02',
    title: 'Calendar',
    heading: 'Every day, plotted precisely.',
    body: 'A colour-density calendar shows exactly where your time went. Tap any day to see the full breakdown. No more mental arithmetic.',
  },
  {
    num: '03',
    title: 'Invoices',
    heading: (
      <>
        Send <span className="em-text">paid.</span> Not chased.
      </>
    ),
    body: 'Group entries by project, set your rate, hit send. TimeTracker converts tracked hours into a clean invoice in seconds, not minutes.',
  },
]
