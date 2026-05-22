import { Quote } from 'lucide-react'

export function TestimonialSection() {
  return (
    <section id="customers" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-[1080px] px-6 sm:px-8 text-center">
        <Quote
          className="mx-auto mb-7 h-7 w-7 opacity-60"
          style={{ color: '#22E07A' }}
          aria-hidden="true"
        />
        <p className="display display-sm ink-gradient max-w-[920px] mx-auto !leading-[1.15]">
          &ldquo;I stopped writing invoices on Sunday nights. The clock writes them for me — and somehow
          they&apos;re cleaner than mine ever were.&rdquo;
        </p>
        <div className="mt-9 flex items-center justify-center gap-3">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-full text-[12px] font-semibold hair-strong"
            style={{ background: 'linear-gradient(135deg,#22E07A33,#0e1a12)', color: '#9CEEBE' }}
          >
            RG
          </div>
          <div className="text-left">
            <div className="text-[13px] font-medium">Rafał Gawlik</div>
            <div className="text-[11.5px]" style={{ color: 'var(--ink-3)' }}>
              Independent contractor · Düsseldorf
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
