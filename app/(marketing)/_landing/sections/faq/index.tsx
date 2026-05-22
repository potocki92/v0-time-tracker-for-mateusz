import { ChevronDown } from 'lucide-react'

import { FAQ_ITEMS } from './data'

export function FaqSection() {
  return (
    <section id="faq" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-[820px] px-6 sm:px-8">
        <div className="reveal-row mb-12 text-center">
          <div className="eyebrow mb-4">FAQ</div>
          <h2 className="display display-md ink-gradient">Questions, answered.</h2>
        </div>

        <div className="reveal-row flex flex-col gap-3">
          {FAQ_ITEMS.map((item) => (
            <details key={item.q} className="faq-item">
              <summary className="faq-q">
                <span>{item.q}</span>
                <ChevronDown className="faq-chevron h-4 w-4 shrink-0" aria-hidden="true" />
              </summary>
              <p className="faq-a">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}
