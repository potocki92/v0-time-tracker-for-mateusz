import { ArrowRight, Check, Sparkles } from 'lucide-react'

import { PRICING_PLANS } from './data'

export function PricingSection() {
  return (
    <section id="pricing" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-[1280px] px-6 sm:px-8">
        <div className="text-center mb-14 reveal-row">
          <div className="eyebrow mb-4">Pricing</div>
          <h2 className="display display-md ink-gradient">Honest, like the hours.</h2>
          <p
            className="mt-4 text-sm sm:text-lg max-w-[560px] mx-auto"
            style={{ color: 'var(--ink-2)' }}
          >
            No per‑seat surprises. No &ldquo;talk to sales&rdquo; wall. Pay for the work, not the
            software.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5 max-w-[1100px] mx-auto">
          {PRICING_PLANS.map((plan, i) => (
            <div
              key={plan.name}
              className={`price-card p-7 reveal-row relative ${plan.hot ? 'hot' : ''}`}
              style={{ transitionDelay: `${i * 90}ms` }}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="pill chip-emerald !py-1 !px-2.5 !text-2xs">
                    <Sparkles className="h-2.5 w-2.5" /> Most popular
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between mb-5">
                <div className="stat-label" style={plan.nameStyle}>{plan.name}</div>
                <span className={`pill ${plan.badge.className}`}>{plan.badge.label}</span>
              </div>

              <div className="flex items-baseline gap-1">
                <span className="display display-sm num em-text">{plan.price}</span>
                <span className="text-xs" style={{ color: 'var(--ink-3)' }}>
                  {plan.period}
                </span>
              </div>

              <p className="text-xs mt-3 leading-relaxed" style={{ color: 'var(--ink-3)' }}>
                {plan.desc}
              </p>

              <a
                href={plan.cta.href}
                className={`${plan.cta.className} w-full justify-center mt-7`}
              >
                {plan.cta.label}
                {plan.cta.icon && <ArrowRight className="h-3.5 w-3.5" />}
              </a>

              <div className="divider my-6" />

              <ul className="space-y-2.5 text-xs" style={{ color: 'var(--ink-2)' }}>
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className="h-3.5 w-3.5 mt-0.5 shrink-0" style={{ color: '#22E07A' }} />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
