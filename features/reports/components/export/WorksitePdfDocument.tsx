import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer'
import type { AppFormat } from '@/lib/format'
import { buildWorksitePeriods, type ReportModel } from '../../domain'
import { PDF_COLORS, pdfBaseStyles } from './pdf-theme'

/**
 * Zestawienie miejsc pracy — dokument dla ksiegowej.
 *
 * Odpowiada na pytania z wniosku o przedluzenie A1: w jakim projekcie,
 * pod jakim adresem, od kiedy do kiedy i ile godzin. Dlatego, w odroznieniu
 * od `ReportPdfDocument`, NIE jest to podsumowanie top-5: wchodzi KAZDY
 * projekt z zakresu i nie ma tu kwot.
 *
 * Ladowany wylacznie dynamicznym importem z `useReportsExport`.
 */

const styles = StyleSheet.create({
  ...pdfBaseStyles,
  tableHead: {
    flexDirection: 'row',
    borderBottom: `1pt solid ${PDF_COLORS.border}`,
    paddingBottom: 4,
    fontSize: 7,
    fontWeight: 700,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: PDF_COLORS.muted,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 5,
    borderBottom: `0.5pt solid ${PDF_COLORS.border}`,
  },
  totalRow: {
    flexDirection: 'row',
    paddingVertical: 6,
    fontWeight: 700,
    borderBottom: `1pt solid ${PDF_COLORS.ink}`,
  },
  project: { width: '26%', paddingRight: 6 },
  location: { width: '30%', paddingRight: 6 },
  date: { width: '13%' },
  days: { width: '8%', textAlign: 'right' },
  hours: { width: '10%', textAlign: 'right' },
  client: { fontSize: 7, color: PDF_COLORS.muted, marginTop: 1 },
  placeholder: { color: PDF_COLORS.muted },
})

export type WorksitePdfLabels = {
  title: string
  range: string
  generatedAt: string
  filters: string
  noFilters: string
  project: string
  location: string
  from: string
  to: string
  workedDays: string
  hours: string
  total: string
  note: string
  unassigned: string
  noLocation: string
}

type Props = {
  model: ReportModel
  labels: WorksitePdfLabels
  /** Opis aktywnych filtrow zlozony po stronie UI (zna nazwy klientow i tlumaczenia). */
  filtersSummary: string
  generatedAt: string
  fmt: AppFormat
}

export function WorksitePdfDocument({ model, labels, filtersSummary, generatedAt, fmt }: Props) {
  const periods = buildWorksitePeriods(model.records)

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>{labels.title}</Text>
          <Text style={styles.subtitle}>
            {labels.range}: {fmt.dateRange(model.range.start, model.range.end)}
          </Text>
          <View style={styles.metaRow}>
            <Text style={styles.meta}>
              {labels.filters}: {filtersSummary || labels.noFilters}
            </Text>
            <Text style={styles.meta}>
              {labels.generatedAt}: {generatedAt}
            </Text>
          </View>
        </View>

        <View style={styles.tableHead} fixed>
          <Text style={styles.project}>{labels.project}</Text>
          <Text style={styles.location}>{labels.location}</Text>
          <Text style={styles.date}>{labels.from}</Text>
          <Text style={styles.date}>{labels.to}</Text>
          <Text style={styles.days}>{labels.workedDays}</Text>
          <Text style={styles.hours}>{labels.hours}</Text>
        </View>

        {periods.map((period) => (
          <View key={period.projectId ?? 'unassigned'} style={styles.row} wrap={false}>
            <View style={styles.project}>
              <Text>{period.projectName ?? labels.unassigned}</Text>
              {period.clientName && <Text style={styles.client}>{period.clientName}</Text>}
            </View>
            <Text style={[styles.location, period.location ? {} : styles.placeholder]}>
              {period.location ?? labels.noLocation}
            </Text>
            <Text style={styles.date}>{fmt.date(period.from, 'short')}</Text>
            <Text style={styles.date}>{fmt.date(period.to, 'short')}</Text>
            <Text style={styles.days}>{fmt.number(period.workedDays)}</Text>
            <Text style={styles.hours}>{fmt.hours(period.hours)}</Text>
          </View>
        ))}

        {/* Suma dni bierze sie z KPI, a nie z dodania kolumny: dzien
            przepracowany w dwoch projektach jest jednym dniem pracy. */}
        <View style={styles.totalRow}>
          <Text style={styles.project}>{labels.total}</Text>
          <Text style={styles.location} />
          <Text style={styles.date}>{fmt.date(model.range.start, 'short')}</Text>
          <Text style={styles.date}>{fmt.date(model.range.end, 'short')}</Text>
          <Text style={styles.days}>{fmt.number(model.kpis.activeDays)}</Text>
          <Text style={styles.hours}>{fmt.hours(model.kpis.totalHours)}</Text>
        </View>

        <Text style={styles.footnote}>{labels.note}</Text>
      </Page>
    </Document>
  )
}
