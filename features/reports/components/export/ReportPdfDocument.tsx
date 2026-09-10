import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer'
import type { AppFormat } from '@/lib/format'
import type { BreakdownItem, ReportModel } from '../../domain'
import { PDF_COLORS, pdfBaseStyles } from './pdf-theme'

/**
 * Szablon PDF raportu.
 *
 * Ladowany WYLACZNIE dynamicznym importem z `useReportsExport` — razem
 * z `@react-pdf/renderer`, ktory jest najciezsza zaleznoscia w repo i nie ma
 * czego szukac w bundlu trasy.
 *
 * PDF jest PODSUMOWANIEM, nie zrzutem ekranu: zakres, aktywne filtry, KPI
 * i dwa najwazniejsze przekroje. Pelne dane wpisow ida do CSV/JSON, ktore
 * arkusz i tak przetworzy lepiej niz oko na wydruku.
 */

const styles = StyleSheet.create({
  ...pdfBaseStyles,
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  kpiCard: {
    width: '31.5%',
    borderRadius: 6,
    backgroundColor: PDF_COLORS.surface,
    border: `1pt solid ${PDF_COLORS.border}`,
    padding: 8,
  },
  kpiLabel: { fontSize: 7, color: PDF_COLORS.muted, marginBottom: 3 },
  kpiValue: { fontSize: 12, fontWeight: 700 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderBottom: `0.5pt solid ${PDF_COLORS.border}`,
  },
  rowLabel: { width: '50%' },
  rowCell: { width: '16%', textAlign: 'right' },
})

export type ReportPdfLabels = {
  title: string
  range: string
  generatedAt: string
  filters: string
  noFilters: string
  kpis: string
  clients: string
  projects: string
  share: string
  note: string
  kpiLabels: {
    totalHours: string
    workValue: string
    activeDays: string
    avgPerActiveDay: string
    effectiveRate: string
    billable: string
  }
  unassigned: string
}

type Props = {
  model: ReportModel
  labels: ReportPdfLabels
  /** Opis aktywnych filtrow zlozony po stronie UI (zna nazwy klientow i tlumaczenia). */
  filtersSummary: string
  generatedAt: string
  fmt: AppFormat
}

/** Najwyzsze pozycje przekroju — na jedna strone i tak wiecej sie nie zmiesci. */
const TOP_ROWS = 5

export function ReportPdfDocument({ model, labels, filtersSummary, generatedAt, fmt }: Props) {
  const kpi = model.kpis

  const breakdownRows = (items: BreakdownItem[]) =>
    items.slice(0, TOP_ROWS).map((item) => (
      <View key={item.key || 'unassigned'} style={styles.row}>
        <Text style={styles.rowLabel}>{item.label ?? labels.unassigned}</Text>
        <Text style={styles.rowCell}>{fmt.hours(item.hours)}</Text>
        <Text style={styles.rowCell}>{fmt.percent(item.share)}</Text>
        <Text style={styles.rowCell}>{fmt.money(item.valueBaseMinor, model.currency)}</Text>
      </View>
    ))

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

        <Text style={styles.sectionTitle}>{labels.kpis}</Text>
        <View style={styles.kpiGrid}>
          <Kpi label={labels.kpiLabels.totalHours} value={fmt.hours(kpi.totalHours)} />
          <Kpi
            label={labels.kpiLabels.workValue}
            value={fmt.money(kpi.workValueMinor, model.currency)}
          />
          <Kpi label={labels.kpiLabels.activeDays} value={fmt.number(kpi.activeDays)} />
          <Kpi
            label={labels.kpiLabels.avgPerActiveDay}
            value={fmt.hours(kpi.avgHoursPerActiveDay, { decimals: 1 })}
          />
          <Kpi
            label={labels.kpiLabels.effectiveRate}
            value={fmt.rate(kpi.effectiveHourlyRateMinor, model.currency)}
          />
          <Kpi label={labels.kpiLabels.billable} value={fmt.percent(kpi.billableRatio)} />
        </View>

        <Text style={styles.sectionTitle}>{labels.clients}</Text>
        {breakdownRows(model.breakdowns.client)}

        <Text style={styles.sectionTitle}>{labels.projects}</Text>
        {breakdownRows(model.breakdowns.project)}

        <Text style={styles.footnote}>{labels.note}</Text>
      </Page>
    </Document>
  )
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.kpiCard}>
      <Text style={styles.kpiLabel}>{label}</Text>
      <Text style={styles.kpiValue}>{value}</Text>
    </View>
  )
}
