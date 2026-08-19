import { CountUp } from './CountUp'

const stats = [
  { val: '€2.4M', label: 'Invoiced', green: true },
  { val: '14,200', label: 'Invoices sent', green: false },
  { val: '3.2d', label: 'Avg. paid in', green: false },
  { val: '99.97%', label: 'Uptime', green: false },
]

export function BigNumbersSection() {
  return (
    <section className="relative py-32 sm:py-48 overflow-hidden">
      <div className="grid-mesh absolute inset-0" />
      <div
        className="orb"
        style={{
          top: '50%',
          left: '50%',
          transform: 'translate(-50%,-50%)',
          width: 900,
          height: 900,
          background: 'radial-gradient(circle, rgba(34,224,122,.10), transparent 65%)',
        }}
      />
      <div className="relative mx-auto max-w-[1280px] px-6 sm:px-8 text-center">
        <div className="eyebrow mb-4 reveal-row">By the numbers</div>
        <CountUp value="37,840" className="colossal num reveal-row block" />
        <div
          className="mt-4 text-sm sm:text-lg max-w-[640px] mx-auto reveal-row leading-[1.55]"
          style={{ color: 'var(--ink-2)' }}
        >
          Hours tracked across freelancers, agencies, and tradespeople in Q1. Every minute
          precisely accounted for, every invoice on time.
        </div>
        <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 max-w-[920px] mx-auto reveal-row">
          {stats.map(({ val, label, green }) => (
            <div key={label}>
              <CountUp
                value={val}
                className={`num block text-4xl font-semibold ${green ? 'em-text' : ''}`}
              />
              <div
                className="text-2xs mt-1 uppercase tracking-[.12em]"
                style={{ color: 'var(--ink-3)' }}
              >
                {label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
