import { useTranslations } from 'next-intl'

import { Link } from '@/i18n/navigation'

export function FinalCta() {
  const t = useTranslations('marketing.finalCta')

  return (
    <section aria-labelledby="cta-heading" className="mx-auto max-w-[1400px] px-5 py-28 text-center sm:px-8 sm:py-40">
      <h2 id="cta-heading" className="lp-display lp-d2 mx-auto max-w-[18ch]">
        {t('heading')}
      </h2>
      <div className="mt-10 flex flex-wrap justify-center gap-3">
        <Link href="/dashboard" className="lp-cta">
          {t('primary')}
        </Link>
        <Link href="/auth/sign-up" className="lp-cta-ghost">
          {t('secondary')}
        </Link>
      </div>
    </section>
  )
}
