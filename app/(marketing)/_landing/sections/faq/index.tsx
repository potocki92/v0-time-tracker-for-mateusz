import { Accordion } from '@/components/ui/accordion'
import { SectionIntro } from '@/app/(marketing)/_landing/ui/SectionIntro'

import { FAQ_ITEMS } from './data'
import { FaqItem } from './FaqItem'

export function FaqSection() {
  return (
    <section id="faq" className="border-b border-border">
      <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <SectionIntro eyebrow="FAQ" title="Najczęściej zadawane pytania" />

        <Accordion type="single" collapsible className="mt-10 w-full">
          {FAQ_ITEMS.map((item, index) => (
            <FaqItem key={item.q} index={index} question={item.q} answer={item.a} />
          ))}
        </Accordion>
      </div>
    </section>
  )
}
