import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

const FAQ = [
  {
    q: 'Czy WorkFlow Pro jest naprawdę darmowy?',
    a: 'Tak — plan startowy jest darmowy bez limitu czasowego. Płatne plany odblokowują zaawansowane raporty, eksport do księgowości i integracje.',
  },
  {
    q: 'Czy moje dane są bezpieczne?',
    a: 'Dane przechowujemy w infrastrukturze zgodnej z RODO, w europejskich centrach danych. Stosujemy szyfrowanie w tranzycie (TLS) oraz w spoczynku. Logi dostępu są audytowane.',
  },
  {
    q: 'Czy aplikacja działa na telefonie?',
    a: 'Tak. WorkFlow Pro to progresywna aplikacja webowa (PWA) — uruchomisz ją na iOS, Android i dowolnej przeglądarce. Działa także offline.',
  },
  {
    q: 'Czy mogę wystawiać faktury VAT?',
    a: 'Tak — wspieramy faktury VAT, zwolnienia, różne stawki (0%, 5%, 8%, 23%), numerację roczną/miesięczną i eksport do PDF.',
  },
  {
    q: 'Czy mogę zaimportować dane z innego narzędzia?',
    a: 'Tak, wspieramy import klientów i projektów z CSV. Import wpisów czasu pracy dostępny na życzenie.',
  },
  {
    q: 'Jak wygląda anulowanie subskrypcji?',
    a: 'W każdej chwili możesz przejść na plan darmowy lub całkowicie usunąć konto — bez ukrytych zobowiązań.',
  },
] as const

export function Faq() {
  return (
    <section id="faq" className="border-b border-border">
      <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">
            FAQ
          </p>
          <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            Najczęściej zadawane pytania
          </h2>
        </div>

        <Accordion type="single" collapsible className="mt-10 w-full">
          {FAQ.map((item, i) => (
            <AccordionItem key={i} value={`item-${i}`}>
              <AccordionTrigger className="text-left text-base font-medium">
                {item.q}
              </AccordionTrigger>
              <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                {item.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  )
}
