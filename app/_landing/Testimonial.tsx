import { Quote } from 'lucide-react'

export function Testimonial() {
  return (
    <section className="border-b border-border bg-muted/30">
      <div className="mx-auto max-w-4xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <figure className="relative rounded-2xl border border-border bg-card p-8 sm:p-12">
          <Quote
            className="absolute -top-5 left-8 size-10 rounded-full border border-border bg-background p-2 text-primary"
            aria-hidden="true"
          />
          <blockquote className="text-pretty text-lg font-medium leading-relaxed sm:text-xl">
            „Przed WorkFlow Pro spędzałam godziny miesięcznie na zliczaniu
            przepracowanego czasu i robieniu faktur w Wordzie. Teraz — jedno
            kliknięcie i gotowe. Dosłownie oszczędzam pół dnia roboczego
            w miesiącu.”
          </blockquote>
          <figcaption className="mt-6 flex items-center gap-4">
            <div className="flex size-11 items-center justify-center rounded-full bg-primary/15 font-semibold text-primary">
              KW
            </div>
            <div>
              <p className="font-semibold">Katarzyna Wójcik</p>
              <p className="text-sm text-muted-foreground">
                Freelance UX Designer · Warszawa
              </p>
            </div>
          </figcaption>
        </figure>
      </div>
    </section>
  )
}
