import type { Client, CURRENCY, WorkEntry } from '@/lib/types'
import { resolveQuantity } from './quantity'
import { eurToPln } from './currency'

export type EarningsResult = {
  /** Surowa kwota w walucie klienta */
  amount: number
  /** Waluta klienta (PLN | EUR) */
  currency: CURRENCY
  /** Kwota przeliczona na PLN (lub oryginał jeśli klient PLN) */
  amountInPLN: number
  /** Kwota w EUR (0 gdy klient PLN) */
  amountInEUR: number
}

const ZERO_EARNINGS: EarningsResult = {
  amount: 0,
  currency: 'PLN',
  amountInPLN: 0,
  amountInEUR: 0,
}

export function calculateEarnings(
  entry: WorkEntry,
  client: Client | undefined,
  eurRate: number,
): EarningsResult {
  if (!client || entry.status !== 'worked') {
    return ZERO_EARNINGS
  }

  let amount = 0

  switch (client.work_type) {
    case 'hourly': {
      amount = (entry.hours ?? 0) * client.rate
      break
    }

    case 'piecework': {
      amount = resolveQuantity(entry) * client.rate
      break
    }

    default:
      amount = 0
  }

  const isEUR = client.currency === 'EUR'

  return {
    amount,
    currency: client.currency,
    amountInEUR: isEUR ? amount : 0,
    amountInPLN: isEUR ? eurToPln(amount, eurRate) : amount,
  }
}