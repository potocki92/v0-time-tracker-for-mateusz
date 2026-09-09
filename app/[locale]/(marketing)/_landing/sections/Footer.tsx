import { useTranslations } from 'next-intl'

import { LocaleSwitcher } from '@/components/i18n/locale-switcher'
import { Link } from '@/i18n/navigation'

export function Footer() {
  const t = useTranslations('marketing.footer')

  return (
    <footer className="border-t border-[var(--lp-hair)]">
      <div className="mx-auto flex max-w-[1400px] flex-col gap-6 px-5 py-10 sm:flex-row sm:items-center sm:px-8">
        <div className="flex items-center gap-2">
          <span aria-hidden className="size-4 rounded-[5px] bg-[var(--lp-accent)]" />
          <span className="lp-t13 font-semibold tracking-tight">TimeTracker</span>
        </div>

        <p className="max-w-[42ch] lp-t13 text-[var(--lp-ink-2)]">{t('tagline')}</p>

        <nav aria-label={t('aria')} className="flex flex-wrap items-center gap-5 sm:ml-auto">
          <Link href="/auth/login" className="lp-t13 text-[var(--lp-ink-2)] hover:text-[var(--lp-ink-1)]">
            {t('signIn')}
          </Link>
          <Link href="/dashboard" className="lp-t13 text-[var(--lp-ink-2)] hover:text-[var(--lp-ink-1)]">
            {t('openApp')}
          </Link>
          <a
            href="https://github.com/potocki92/v0-time-tracker-for-mateusz"
            className="lp-t13 text-[var(--lp-ink-2)] hover:text-[var(--lp-ink-1)]"
          >
            {t('github')}
          </a>
          {/* Na telefonie navbar chowa przelacznik — stopka jest wtedy jedynym
              miejscem, w ktorym da sie zmienic jezyk. */}
          <LocaleSwitcher className="sm:hidden" />
        </nav>
      </div>
    </footer>
  )
}
