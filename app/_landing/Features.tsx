import {
  Clock,
  FolderKanban,
  Users,
  FileText,
  CalendarDays,
  BarChart3,
} from 'lucide-react'

const FEATURES = [
  {
    icon: Clock,
    title: 'Precyzyjne śledzenie czasu',
    description:
      'Uruchom timer jednym kliknięciem lub dopisz wpis ręcznie. Aplikacja działa online i offline — nic nie zginie.',
  },
  {
    icon: FolderKanban,
    title: 'Zarządzanie projektami',
    description:
      'Grupuj zadania w projekty, przydzielaj stawki godzinowe i pilnuj budżetu w czasie rzeczywistym.',
  },
  {
    icon: Users,
    title: 'Baza klientów (CRM)',
    description:
      'Trzymaj dane klientów, adresy do faktur i historię współpracy w jednym, przejrzystym miejscu.',
  },
  {
    icon: FileText,
    title: 'Faktury PDF',
    description:
      'Generuj profesjonalne faktury z wpisów czasu pracy. Wysyłka e-mailem, eksport do PDF, gotowe do księgowości.',
  },
  {
    icon: CalendarDays,
    title: 'Kalendarz i planowanie',
    description:
      'Widok kalendarza pokazuje kiedy, nad czym i jak długo pracujesz. Planuj tydzień z wyprzedzeniem.',
  },
  {
    icon: BarChart3,
    title: 'Raporty i analityka',
    description:
      'Dashboardy, wykresy produktywności, podsumowania miesięczne — dane, które wspierają decyzje biznesowe.',
  },
] as const

export function Features() {
  return (
    <section id="funkcje" className="border-b border-border">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">
            Funkcje
          </p>
          <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            Wszystko czego potrzebujesz — w jednym panelu
          </h2>
          <p className="mt-4 text-pretty text-base text-muted-foreground sm:text-lg">
            Zamiast żonglować pięcioma aplikacjami, WorkFlow Pro łączy czas pracy,
            klientów, projekty i fakturowanie w spójny workflow.
          </p>
        </div>

        <ul className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <li
              key={title}
              className="group relative rounded-xl border border-border bg-card p-6 transition-all hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5"
            >
              <div className="inline-flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <Icon className="size-5" aria-hidden="true" />
              </div>
              <h3 className="mt-5 text-base font-semibold">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {description}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
