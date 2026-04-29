import { Quote } from 'lucide-react'

import { TESTIMONIAL } from './data'

export function TestimonialSection() {
  return (
    <section className="border-b border-border bg-muted/30">
      <div className="mx-auto max-w-4xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <figure className="relative rounded-2xl border border-border bg-card p-8 sm:p-12">
          <Quote
            className="absolute -top-5 left-8 size-10 rounded-full border border-border bg-background p-2 text-primary"
            aria-hidden="true"
          />
          <blockquote className="text-pretty text-lg font-medium leading-relaxed sm:text-xl">
            {TESTIMONIAL.quote}
          </blockquote>
          <figcaption className="mt-6 flex items-center gap-4">
            <div className="flex size-11 items-center justify-center rounded-full bg-primary/15 font-semibold text-primary">
              {TESTIMONIAL.initials}
            </div>
            <div>
              <p className="font-semibold">{TESTIMONIAL.author}</p>
              <p className="text-sm text-muted-foreground">{TESTIMONIAL.role}</p>
            </div>
          </figcaption>
        </figure>
      </div>
    </section>
  )
}
