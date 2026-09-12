import { DEFAULT_LOCALE, type AppLocale } from '@/i18n/config'
import type { StatementDocumentLabels } from '../domain/labels'

/**
 * Etykiety dokumentu w JEZYKU WYBRANYM DLA PLIKU — nie w jezyku interfejsu.
 *
 * `useTranslations` zna wylacznie aktywny jezyk panelu, a wykaz ma inna
 * publicznosc niz panel: Polak klika po polsku i wysyla niemieckiej ksiegowej
 * PDF po niemiecku. Dlatego slownik dokumentu wczytuje sie osobno, wprost
 * z pliku wiadomosci.
 *
 * Mapa jest STATYCZNA z tego samego powodu co w `i18n/messages.ts`: literal
 * `import(\`…/${locale}/…\`)` wciagnalby wszystkie jezyki do jednego chunka.
 * Tak kazdy jest osobnym, leniwym modulem — pobiera sie dopiero przy eksporcie.
 */
const LOADERS: Record<AppLocale, () => Promise<{ default: unknown }>> = {
  pl: () => import('@/messages/pl/accounting.json'),
  de: () => import('@/messages/de/accounting.json'),
  en: () => import('@/messages/en/accounting.json'),
}

type AccountingMessages = { document: StatementDocumentLabels }

export async function loadStatementLabels(
  locale: AppLocale,
): Promise<StatementDocumentLabels> {
  const loader = LOADERS[locale] ?? LOADERS[DEFAULT_LOCALE]
  return ((await loader()).default as AccountingMessages).document
}
