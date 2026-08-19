import { FileEdit, FileText } from 'lucide-react'

import { StatusChip } from '../../../components/StatusChip'
import { BentoCard } from '../BentoCard'
import { INVOICES } from '../data'

export function InvoicesCard() {
  return (
    <BentoCard className="col-span-12 sm:col-span-6 lg:col-span-4" delay={0.1}>
      <div className="mb-1 flex items-center gap-2">
        <FileText size={14} style={{ color: '#22E07A' }} />
        <span className="stat-label">Invoices</span>
      </div>
      <h3 className="mb-3 text-lg font-semibold leading-snug" style={{ color: 'var(--ink-1)' }}>
        From timesheet to paid.
      </h3>
      <div className="flex flex-col gap-0">
        {INVOICES.map((inv, i) => (
          <div
            key={inv.id}
            className="flex items-center justify-between py-2.5"
            style={i < INVOICES.length - 1 ? { borderBottom: '1px solid var(--hair)' } : undefined}
          >
            <div className="flex items-center gap-2">
              <FileEdit size={12} style={{ color: 'var(--ink-3)' }} />
              <div>
                <div className="mono text-2xs" style={{ color: 'var(--ink-1)' }}>
                  {inv.id}
                </div>
                <div className="mt-0.5">
                  <StatusChip status={inv.status} />
                </div>
              </div>
            </div>
            <span className="num text-xs">{inv.amount}</span>
          </div>
        ))}
      </div>
    </BentoCard>
  )
}
