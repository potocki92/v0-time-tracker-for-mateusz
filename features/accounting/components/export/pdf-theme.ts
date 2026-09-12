import { Font, StyleSheet } from '@react-pdf/renderer'

/**
 * Oprawa dokumentu wykazu.
 *
 * Swiadoma kopia oprawy PDF raportu (`features/reports/components/export/
 * pdf-theme.ts`), a nie import: granice modulow zabraniaja siegania miedzy
 * feature'ami, a przeniesienie tych stylow do `components/` przepisywaloby
 * dzialajace szablony raportu przy okazji zupelnie innej zmiany. Gdy trzeci
 * modul bedzie potrzebowal tej samej oprawy — wtedy warto ja wyciagnac.
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
  surface: '#f4f4f5',
}

/**
 * Uklad dokumentu. Strona jest POZIOMA: rejestr niesie numer, dwie daty,
 * nabywce, miejsce wykonania i trzy kwoty — w pionie kolumna „gdzie"
 * zwezalaby sie do jednego slowa na wiersz.
 */
export const pdfBaseStyles = StyleSheet.create({
  page: {
    fontFamily: 'Inter',
    fontSize: 8,
    color: PDF_COLORS.ink,
    paddingTop: 32,
    paddingBottom: 42,
    paddingHorizontal: 28,
  },
  header: { marginBottom: 16, borderBottom: `1pt solid ${PDF_COLORS.border}`, paddingBottom: 10 },
  title: { fontSize: 16, fontWeight: 700, marginBottom: 3 },
  subtitle: { fontSize: 9, color: PDF_COLORS.muted },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  meta: { fontSize: 8, color: PDF_COLORS.muted },
  sectionTitle: {
    fontSize: 8,
    fontWeight: 700,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: PDF_COLORS.muted,
    marginBottom: 6,
    marginTop: 16,
  },
  tableHead: {
    flexDirection: 'row',
    borderBottom: `1pt solid ${PDF_COLORS.border}`,
    paddingBottom: 3,
    fontSize: 7,
    fontWeight: 700,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    color: PDF_COLORS.muted,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 4,
    borderBottom: `0.5pt solid ${PDF_COLORS.border}`,
  },
  totalRow: {
    flexDirection: 'row',
    paddingVertical: 5,
    fontWeight: 700,
    borderBottom: `1pt solid ${PDF_COLORS.ink}`,
  },
  sub: { fontSize: 6.5, color: PDF_COLORS.muted, marginTop: 1 },
  placeholder: { color: PDF_COLORS.muted },
  footnote: { marginTop: 6, fontSize: 6.5, color: PDF_COLORS.muted },
  pageNumber: {
    position: 'absolute',
    bottom: 20,
    left: 28,
    right: 28,
    textAlign: 'center',
    fontSize: 7,
    color: PDF_COLORS.muted,
  },
})
