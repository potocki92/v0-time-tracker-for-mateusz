import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

import type { AppLocale } from '@/i18n/config'
import type { WorkspaceSegment } from '@/lib/workspace/sections'

import { buildLocalizedMetadata } from './metadata'

/**
 * Tytul strony panelu w spojnym formacie `Sekcja · TimeTracker`, w jezyku
 * uzytkownika. Cala strefa panelu jest `noindex` — to dane sesyjne — wiec
 * metadane nie niosa ani `hreflang`, ani sitemapy.
 */
export async function workspaceMetadata(
  locale: AppLocale,
  segment: WorkspaceSegment,
): Promise<Metadata> {
  const nav = await getTranslations({ locale, namespace: 'navigation' })
  const feature = await getTranslations({ locale, namespace: segmentNamespace(segment) })

  return buildLocalizedMetadata({
    locale,
    path: `/${segment}`,
    noindex: true,
    title: nav(`sections.${segment}`),
    description: feature('meta.description'),
  })
}

/** Sekcje z wlasna przestrzenia nazw; reszta opisu idzie z `navigation`. */
function segmentNamespace(segment: WorkspaceSegment): string {
  switch (segment) {
    case 'dashboard':
    case 'calendar':
    case 'projects':
    case 'clients':
    case 'invoices':
    case 'reports':
      return segment
    default:
      return 'dashboard'
  }
}
