import { CalendarCard } from './cards/CalendarCard'
import { IntegrationsCard } from './cards/IntegrationsCard'
import { InvoicesCard } from './cards/InvoicesCard'
import { LiveTrackerCard } from './cards/LiveTrackerCard'
import { ReportsCard } from './cards/ReportsCard'

export function FeaturesSection() {
  return (
    <section className="relative pb-24 pt-32">
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
        <div className="eyebrow mb-3">Capabilities</div>
        <h2 className="display display-md ink-gradient max-w-[600px]">
          Every tool, where you reach for it.
        </h2>

        <div className="mt-12 grid grid-cols-12 gap-4">
          <LiveTrackerCard />
          <CalendarCard />
          <InvoicesCard />
          <ReportsCard />
          <IntegrationsCard />
        </div>
      </div>
    </section>
  )
}
