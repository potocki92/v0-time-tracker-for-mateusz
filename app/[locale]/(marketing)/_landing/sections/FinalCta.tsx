import { useTranslations } from 'next-intl'

import { Link } from '@/i18n/navigation'

/**
 * Final CTA — final historii, a nie kolejna sekcja.
 *
 * Po hero, pieciu scenach produktu, pieciu kolosalnych liczbach i wypelniajacym
 * sie kalendarzu strona ma oddac uzytkownikowi SPOKOJ. Dlatego to jedyna duza
 * scena landingu bez ani jednej animacji: nic tu nie wjezdza, nic nie skaluje
 * sie na scrollu, nic nie prosi o uwage. Cisza po widowisku czyta sie jako
 * pewnosc siebie; jeszcze jeden parallax czytalby sie jako niepewnosc.
 *
 * Tlem jest gigantyczny licznik czasu — ten sam, ktory tyka w naglowku repliki
 * aplikacji. Stoi na `opacity` ponizej progu czytelnosci i jest `aria-hidden`:
 * ma dac scenie skale i nic poza tym. To cyfry, nie tresc, wiec nie przechodzi
 * przez warstwe tlumaczen.
 */
export function FinalCta() {
  const t = useTranslations('marketing.finalCta')

  return (
    <section
      aria-labelledby="cta-heading"
      className="relative flex min-h-[78svh] items-center justify-center overflow-hidden px-5 py-28 text-center sm:px-8"
    >
      <span
        aria-hidden
        className="lp-mono pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 select-none whitespace-nowrap text-[clamp(120px,30vw,460px)] font-medium leading-none tracking-tighter text-white opacity-[0.035]"
      >
        02:14:08
      </span>

      <div className="relative">
        <h2 id="cta-heading" className="lp-display lp-d1 mx-auto max-w-[15ch]">
          {t('heading')}
        </h2>
        <div className="mt-12 flex flex-wrap justify-center gap-3">
          <Link href="/dashboard" className="lp-cta">
            {t('primary')}
          </Link>
          <Link href="/auth/sign-up" className="lp-cta-ghost">
            {t('secondary')}
          </Link>
        </div>
      </div>
    </section>
  )
}
