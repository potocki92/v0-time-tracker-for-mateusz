import { ArrowRight } from 'lucide-react'

interface FinalCtaSectionProps {
  isAuthenticated: boolean
}

export function FinalCtaSection({ isAuthenticated }: FinalCtaSectionProps) {
  return (
    <section id="cta" className="relative py-32 sm:py-44 overflow-hidden">
      <div
        className="orb"
        style={{
          top: '50%',
          left: '50%',
          transform: 'translate(-50%,-50%)',
          width: 900,
          height: 900,
          background: 'radial-gradient(circle, rgba(34,224,122,.20), transparent 65%)',
        }}
      />
      <div className="grid-mesh absolute inset-0" />
      <div className="relative mx-auto max-w-[1080px] px-6 sm:px-8 text-center">
        <h2 className="display display-lg reveal-row">
          <span className="ink-gradient">Start the </span>
          <span className="em-text">clock.</span>
        </h2>
        <p
          className="mt-7 max-w-[560px] mx-auto text-[16px] sm:text-[18px] leading-[1.55] reveal-row"
          style={{ color: 'var(--ink-2)' }}
        >
          Track your first hour in the next sixty seconds. Send your first invoice this week.
        </p>
        <div className="mt-10 flex items-center justify-center gap-3 flex-wrap reveal-row">
          {isAuthenticated ? (
            <a href="/dashboard" className="cta-primary !py-3.5 !px-6 !text-[14px]">
              Open app <ArrowRight className="h-4 w-4" />
            </a>
          ) : (
            <a href="/auth/sign-up" className="cta-primary !py-3.5 !px-6 !text-[14px]">
              Start tracking — it&apos;s free <ArrowRight className="h-4 w-4" />
            </a>
          )}
          <a href="#pricing" className="cta-ghost !py-3.5 !px-5 !text-[14px]">
            See pricing
          </a>
        </div>
        <div className="mt-5 text-[11.5px] reveal-row" style={{ color: 'var(--ink-3)' }}>
          No credit card · 14‑day Pro trial · Cancel anytime
        </div>
      </div>
    </section>
  )
}
