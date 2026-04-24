import type { Client, CURRENCY, WorkEntry } from '@/lib/types'
import { calculateEntryMoney, fallbackFromClient } from './entry-calculations'
import { convert, toMajor } from './money'

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

export function calculateEarnings(
  entry: WorkEntry,
  client: Client | undefined,
  eurRate: number,
): EarningsResult {
  const fallback = client
    ? fallbackFromClient(client)
    : { rate: 0, currency: 'PLN' as CURRENCY, workType: 'hourly' as const }

  const money = calculateEntryMoney(entry, fallback)
  const isEUR = money.currency === 'EUR'

  return {
    amount: toMajor(money),
    currency: money.currency,
    amountInEUR: isEUR ? toMajor(money) : 0,
    amountInPLN: isEUR ? toMajor(convert(money, 'PLN', eurRate)) : toMajor(money),
  }
}
