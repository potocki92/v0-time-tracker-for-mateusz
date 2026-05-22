import { Calendar } from 'lucide-react'

import { BentoCalCell } from '../BentoCalCell'
import { BentoCard } from '../BentoCard'
import { BENTO_CAL } from '../data'

export function CalendarCard() {
  return (
    <BentoCard className="col-span-12 sm:col-span-6 lg:col-span-5" delay={0.07}>
      <div className="mb-1 flex items-center gap-2">
        <Calendar size={14} style={{ color: '#22E07A' }} />
        <span className="stat-label">Calendar</span>
      </div>
      <h3 className="mb-2 text-[18px] font-semibold leading-snug" style={{ color: 'var(--ink-1)' }}>
        A month painted in hours.
      </h3>
      <p className="mb-4 text-[14px] leading-relaxed" style={{ color: 'var(--ink-2)' }}>
        Colour intensity shows effort at a glance. Drill into any day in one tap.
      </p>

      <div className="grid grid-cols-7 gap-1">
        {BENTO_CAL.map((lvl, i) => (
          <BentoCalCell key={i} lvl={lvl} />
        ))}
      </div>
    </BentoCard>
  )
}
