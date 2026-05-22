import { Plug } from 'lucide-react'

import { BentoCard } from '../BentoCard'
import { INTEGRATIONS } from '../data'

export function IntegrationsCard() {
  return (
    <BentoCard className="col-span-12 sm:col-span-6 lg:col-span-4" delay={0.18}>
      <div className="mb-1 flex items-center gap-2">
        <Plug size={14} style={{ color: '#22E07A' }} />
        <span className="stat-label">Integrations</span>
      </div>
      <h3 className="mb-2 text-[18px] font-semibold leading-snug" style={{ color: 'var(--ink-1)' }}>
        Plugs into your stack.
      </h3>
      <p className="mb-4 text-[14px] leading-relaxed" style={{ color: 'var(--ink-2)' }}>
        Connect the tools you already use. Sync calendars, trigger invoices via Stripe, pipe updates
        to Slack.
      </p>
      <div className="flex flex-wrap gap-2">
        {INTEGRATIONS.map((chip) => (
          <span key={chip} className="pill text-[12px]">
            {chip}
          </span>
        ))}
      </div>
    </BentoCard>
  )
}
