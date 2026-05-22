import { Check } from 'lucide-react'

export type InvoiceStatus = 'Open' | 'Paid' | 'Draft'

export function StatusChip({ status }: { status: InvoiceStatus }) {
  if (status === 'Paid')
    return (
      <span className="chip-emerald flex items-center gap-1 text-[10px]">
        <Check size={9} />
        Paid
      </span>
    )
  if (status === 'Open') return <span className="chip-amber text-[10px]">Open</span>
  return <span className="chip-mute text-[10px]">Draft</span>
}
