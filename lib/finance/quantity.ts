import { WorkEntry } from '@/lib/types'

export function resolveQuantity(entry: WorkEntry): number {
  if (entry.quantity != null) return entry.quantity

  if (
    entry.quantity_from != null &&
    entry.quantity_to != null
  ) {
    return entry.quantity_to - entry.quantity_from
  }

  return 0
}