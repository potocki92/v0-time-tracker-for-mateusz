const steps = [
  {
    num: '/ 01',
    word: 'Track.',
    desc: 'Start the timer with one keystroke. Tag the project. Forget about it. Stop when you\'re done — TimeTracker remembers everything.',
  },
  {
    num: '/ 02',
    word: 'Bill.',
    desc: 'At the end of the cycle, your invoices already exist. Lines, totals, VAT — auto‑built from the timesheet. Review, send.',
  },
  {
    num: '/ 03',
    word: 'Paid.',
    desc: 'Clients pay through Stripe or SEPA. The dashboard turns green. Nothing else to chase.',
  },
]

export function HowItWorksSection() {
  return (
    <section id="flow" className="relative py-24 sm:py-32 overflow-hidden">
      <div
        className="orb"
        style={{
          top: '30%',
          left: -200,
          width: 540,
          height: 540,
          background: 'radial-gradient(circle, rgba(34,224,122,.10), transparent 70%)',
        }}
      />
      <div className="mx-auto max-w-[1280px] px-6 sm:px-8">
        <div className="max-w-[760px] mb-14 reveal-row">
          <div className="eyebrow mb-4">How it works</div>
          <h2 className="display display-md ink-gradient">
            Three motions.<br />That&apos;s the whole loop.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {steps.map(({ num, word, desc }) => (
            <div key={num} className="reveal-row">
              <div className="step-num mb-4">{num}</div>
              <div className="display display-sm em-text mb-4">{word}</div>
              <p className="text-[15px] leading-[1.6]" style={{ color: 'var(--ink-2)' }}>{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
