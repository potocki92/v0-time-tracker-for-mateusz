const STEPS = [
  {
    number: '01',
    title: 'Załóż konto',
    description:
      'Rejestracja trwa 30 sekund — wystarczy e-mail. Nie wymagamy karty kredytowej.',
  },
  {
    number: '02',
    title: 'Dodaj klientów i projekty',
    description:
      'Skonfiguruj stawki godzinowe, przypisz projekty do klientów i gotowe.',
  },
  {
    number: '03',
    title: 'Włącz timer',
    description:
      'Jedno kliknięcie startuje śledzenie. Aplikacja pamięta wszystko — także offline.',
  },
  {
    number: '04',
    title: 'Wystaw fakturę',
    description:
      'Na koniec miesiąca WorkFlow Pro zamienia wpisy w profesjonalną fakturę PDF.',
  },
] as const

export function HowItWorks() {
  return (
    <section id="jak-dziala" className="border-b border-border">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">
            Jak to działa
          </p>
          <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            Od rejestracji do pierwszej faktury — w 4 krokach
          </h2>
        </div>

        <ol className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, i) => (
            <li
              key={step.number}
              className="relative rounded-xl border border-border bg-card p-6"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-2xl font-semibold text-primary">
                  {step.number}
                </span>
                {i < STEPS.length - 1 && (
                  <span
                    aria-hidden="true"
                    className="hidden h-px w-10 bg-border lg:block"
                  />
                )}
              </div>
              <h3 className="mt-4 text-base font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {step.description}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
