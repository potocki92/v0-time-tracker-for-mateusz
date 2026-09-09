/**
 * „Everything else" — jedna lista zamiast szesciu kart bento.
 *
 * Kazda pozycja odpowiada modulowi, ktory naprawde istnieje w repo
 * (`features/*`). Zadnych zapowiedzi i zadnych integracji, ktorych nie ma.
 */
const ITEMS = [
  { title: 'Day entries', body: 'Hours or piecework quantity, status, notes, tags — one dialog per day.' },
  { title: 'Client rates', body: 'Rate history with effective dates; past hours keep the rate they were earned on.' },
  { title: 'Project budgets', body: 'Budget, utilisation, deadline and status on every project.' },
  { title: 'Invoice builder', body: 'Line items, buyer details, VAT, numbering series and three templates.' },
  { title: 'Reports & export', body: 'Range filters, comparison to the previous period, CSV and PDF export.' },
  { title: 'Work automation', body: 'A weekly schedule plus trips — the calendar writes the days you worked.' },
  { title: 'Weekly summary e-mail', body: 'The week that closed, sent to your inbox.' },
  { title: 'PLN and EUR', body: 'Rates in either currency, converted where the numbers have to meet.' },
  { title: 'Themes', body: 'Five colour palettes, light and dark.' },
] as const

export function EverythingElse() {
  return (
    <section aria-labelledby="everything-heading" className="mx-auto max-w-[1400px] px-5 py-24 sm:px-8 sm:py-32">
      <span className="lp-eyebrow">Everything else</span>
      <h2 id="everything-heading" className="lp-display lp-d2 mt-3 max-w-[16ch]">
        Built for independent work.
      </h2>

      <ul className="mt-12 grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
        {ITEMS.map((item) => (
          <li key={item.title} className="border-t border-[var(--lp-hair)] pt-4">
            <h3 className="text-sm font-medium text-white">{item.title}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-[var(--lp-ink-2)]">{item.body}</p>
          </li>
        ))}
      </ul>
    </section>
  )
}
