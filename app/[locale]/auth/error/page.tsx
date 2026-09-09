import { AlertCircle, ArrowLeft } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { Button } from '@/components/ui/button'
import { Link } from '@/i18n/navigation'

export default function AuthErrorPage() {
  const t = useTranslations('auth.error')

  return (
    <section
      role="alert"
      aria-live="assertive"
      className="flex flex-col items-center gap-6 text-center"
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10 ring-1 ring-destructive/20">
        <AlertCircle className="h-8 w-8 text-destructive/80" aria-hidden="true" />
      </div>

      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-h1">{t('title')}</h1>
        <p className="text-sm leading-relaxed text-muted-foreground">{t('description')}</p>
      </div>

      <Button asChild className="h-12 w-full rounded-xl">
        <Link href="/auth/login">
          <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
          {t('backToLogin')}
        </Link>
      </Button>
    </section>
  )
}
