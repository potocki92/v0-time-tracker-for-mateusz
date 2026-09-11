import { useTranslations } from 'next-intl'

/**
 * „Cala reszta" — trzy funkcje glowne i reszta wymieniona z nazwy.
 *
 * Po dwoch sekcjach pelnoekranowego scrollytellingu rowny grid dziewieciu
 * kafli czytal sie jak spis tresci: dziewiec pozycji tej samej wagi, wiec oko
 * nie mialo od czego zaczac i sekcja wygladala na doklejona do widowiska obok.
 *
 * Hierarchia rozwiazuje to bez ani jednej nowej animacji. Trzy rzeczy, ktore
 * decyduja o zakupie (raporty, faktury, budzety), dostaja pelna prezentacje.
 * Pozostale szesc to nadal komplet informacji, tylko podany gestym wierszem —
 * bo w tym miejscu strony uzytkownik SPRAWDZA, czy czegos nie brakuje, a nie
 * czyta po kolei.
 *
 * Kazda pozycja odpowiada modulowi, ktory naprawde istnieje w repo
 * (`features/*`). Zadnych zapowiedzi i zadnych integracji, ktorych nie ma.
 * Tresc idzie z `messages/<locale>/marketing.json`; tutaj zostaje sama
 * kolejnosc i podzial na plan pierwszy i drugi.
 */
const FEATURED_KEYS = ['reports', 'invoiceBuilder', 'projectBudgets'] as const

const REST_KEYS = [
  'workAutomation',
  'dayEntries',
  'clientRates',
  'weeklyEmail',
  'currencies',
  'themes',
] as const

export function EverythingElse() {
  const t = useTranslations('marketing.everything')

  return (
    <section
      aria-labelledby="everything-heading"
      className="mx-auto max-w-[1400px] px-5 py-28 sm:px-8 sm:py-40"
    >
      <span className="lp-eyebrow">{t('eyebrow')}</span>
      <h2 id="everything-heading" className="lp-display lp-d2 mt-4 max-w-[16ch]">
        {t('heading')}
      </h2>

      <ul className="mt-16 grid gap-x-10 gap-y-12 sm:mt-20 lg:grid-cols-3">
        {FEATURED_KEYS.map((key) => (
          <li key={key} className="border-t border-[var(--lp-hair-2)] pt-6">
            <h3 className="lp-display lp-d3">{t(`items.${key}.title`)}</h3>
            <p className="mt-4 max-w-[38ch] text-sm leading-relaxed text-[var(--lp-ink-2)] sm:text-base">
              {t(`items.${key}.body`)}
            </p>
          </li>
        ))}
      </ul>

      <p className="lp-eyebrow mt-20 sm:mt-28">{t('alsoIncluded')}</p>
      <ul className="mt-6 grid gap-x-10 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
        {REST_KEYS.map((key) => (
          <li key={key} className="text-sm leading-relaxed">
            <span className="font-medium text-white">{t(`items.${key}.title`)}</span>{' '}
            <span className="text-[var(--lp-ink-2)]">{t(`items.${key}.body`)}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}
