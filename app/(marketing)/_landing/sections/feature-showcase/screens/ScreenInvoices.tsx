import { FileEdit } from 'lucide-react'

import { StatusChip } from '../../../components/StatusChip'
import { INVOICES } from '../data'

export function ScreenInvoices() {
  return (
    <div className="flex h-full flex-col gap-3 p-4">
      <div className="flex items-center justify-between">
        <div className="text-[13px] font-semibold" style={{ color: 'var(--ink-1)' }}>
          Invoices · April
        </div>
        <span className="chip-emerald text-[11px]">2 paid</span>
      </div>

      <div className="flex flex-col gap-0">
        {INVOICES.map((inv, i) => (
          <div
            key={inv.id}
            className="flex items-center justify-between py-2.5"
            style={i < INVOICES.length - 1 ? { borderBottom: '1px solid var(--hair)' } : undefined}
          >
            <div className="flex items-center gap-2.5">
              <FileEdit size={13} style={{ color: 'var(--ink-3)' }} />
              <div>
                <div className="mono text-[11px] font-medium" style={{ color: 'var(--ink-1)' }}>
                  {inv.id}
                </div>
                <div className="mt-0.5">
                  <StatusChip status={inv.status} />
                </div>
              </div>
            </div>
            <span className="num text-[13px]" style={{ color: 'var(--ink-1)' }}>
              {inv.amount}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-auto">
        <a href="/auth/sign-up" className="cta-primary w-full justify-center text-center text-[12px]">
          Send 1 draft →
        </a>
      </div>
    </div>
  )
}
