import { Client, WorkEntry } from '@/lib/types'
import { eurToPln } from './currency'

export type EarningsResult = {
  amountInPLN: number
  amountInEUR: number
}

export function calculateEarnings(
  entry: WorkEntry,
  client: Client,
  eurRate: number
): EarningsResult {
  if (!entry || !client) {
    return {
      amountInPLN: 0,
      amountInEUR: 0,
    }
  }

  let amount = 0

  switch (client.work_type) {
    case 'hourly': {
      const hours = entry.hours ?? 0
      amount = hours * client.rate
      break
    }

    case 'piecework': {
      // 🔥 kluczowa logika
      const quantity =
        entry.quantity ??
        (entry.quantity_from && entry.quantity_to
          ? entry.quantity_to - entry.quantity_from
          : 0)

      amount = quantity * client.rate
      break
    }

    default:
      amount = 0
  }

  const isEUR = client.currency === 'EUR'

  return {
    amountInEUR: isEUR ? amount : 0,
    amountInPLN: isEUR ? eurToPln(amount, eurRate) : amount,
  }
}