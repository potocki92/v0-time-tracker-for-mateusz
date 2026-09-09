import { useTranslations } from 'next-intl'

/**
 * „Cala reszta" — jedna lista zamiast szesciu kart bento.
 *
 * Kazda pozycja odpowiada modulowi, ktory naprawde istnieje w repo
 * (`features/*`). Zadnych zapowiedzi i zadnych integracji, ktorych nie ma.
 * Tresc idzie z `messages/<locale>/marketing.json`; tutaj zostaje sama
 * kolejnosc pozycji.
 */
const ITEM_KEYS = [
  'dayEntries',
  'clientRates',
  'projectBudgets',
  'invoiceBuilder',
  'reports',
  'workAutomation',
  'weeklyEmail',
  'currencies',
  'themes',
] as const

export function EverythingElse() {
  const t = useTranslations('marketing.everything')

  return (
    <section aria-labelledby="everything-heading" className="mx-auto max-w-[1400px] px-5 py-24 sm:px-8 sm:py-32">
      <span className="lp-eyebrow">{t('eyebrow')}</span>
      <h2 id="everything-heading" className="lp-display lp-d2 mt-3 max-w-[16ch]">
        {t('heading')}
      </h2>

      <ul className="mt-12 grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
        {ITEM_KEYS.map((key) => (
          <li key={key} className="border-t border-[var(--lp-hair)] pt-4">
            <h3 className="text-sm font-medium text-white">{t(`items.${key}.title`)}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-[var(--lp-ink-2)]">
              {t(`items.${key}.body`)}
            </p>
          </li>
        ))}
      </ul>
    </section>
  )
}
