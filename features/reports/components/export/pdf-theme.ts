import { Font, StyleSheet } from '@react-pdf/renderer'

/**
 * Wspolna oprawa dokumentow PDF raportu.
 *
 * Szablony sa ladowane osobno (kazdy pozycja menu ma wlasny `await import`),
 * ale maja wygladac jak jeden zestaw dokumentow — font i paleta zyja wiec
 * w jednym miejscu, zamiast rozjezdzac sie po kopiach.
 *
 * Rejestracja fontu jest efektem importu: dokument, ktory siega po te style,
 * ma font gotowy, zanim `@react-pdf/renderer` zacznie rysowac.
 */
Font.register({
  family: 'Inter',
  fonts: [
    { src: '/fonts/Inter-Regular.ttf', fontWeight: 400 },
    { src: '/fonts/Inter-SemiBold.ttf', fontWeight: 600 },
    { src: '/fonts/Inter-Bold.ttf', fontWeight: 700 },
  ],
})

export const PDF_COLORS = {
  ink: '#18181b',
  muted: '#71717a',
  border: '#e4e4e7',
  surface: '#f9fafb',
}

/** Uklad strony i naglowka — identyczny w kazdym PDF-ie raportu. */
export const pdfBaseStyles = StyleSheet.create({
  page: {
    fontFamily: 'Inter',
    fontSize: 9,
    color: PDF_COLORS.ink,
    paddingTop: 40,
    paddingBottom: 48,
    paddingHorizontal: 40,
  },
  header: { marginBottom: 20, borderBottom: `1pt solid ${PDF_COLORS.border}`, paddingBottom: 12 },
  title: { fontSize: 18, fontWeight: 700, marginBottom: 4 },
  subtitle: { fontSize: 10, color: PDF_COLORS.muted },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  meta: { fontSize: 8, color: PDF_COLORS.muted },
  sectionTitle: {
    fontSize: 8,
    fontWeight: 700,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: PDF_COLORS.muted,
    marginBottom: 8,
    marginTop: 16,
  },
  footnote: { marginTop: 18, fontSize: 7, color: PDF_COLORS.muted },
})
