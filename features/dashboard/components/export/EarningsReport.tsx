/**
 * Plik: features/dashboard/components/export/EarningsReport.tsx
 *
 * Szablon PDF generowany przez @react-pdf/renderer.
 * Renderuje się po stronie klienta (Web Worker) — brak Puppeteer / serwera.
 *
 * Importuj tylko przez dynamic import w useExportData.ts:
 *   const { EarningsReport } = await import('./EarningsReport')
 */

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from '@react-pdf/renderer'
import type { ExportRow } from '@/hooks/useExportData'

// ── Fonty ─────────────────────────────────────────────────────────────────────
// Inter wspiera polskie znaki. Hostuj lokalnie w /public/fonts.

Font.register({
  family: 'Inter',
  fonts: [
    { src: '/fonts/Inter-Regular.ttf', fontWeight: 400 },
    { src: '/fonts/Inter-SemiBold.ttf', fontWeight: 600 },
    { src: '/fonts/Inter-Bold.ttf', fontWeight: 700 },
  ],
})

// ── Style ─────────────────────────────────────────────────────────────────────

const COLORS = {
  primary:    '#18181b', // zinc-900
  secondary:  '#71717a', // zinc-500
  border:     '#e4e4e7', // zinc-200
  accent:     '#10b981', // emerald-500
  rowAlt:     '#f9fafb', // gray-50
}

const styles = StyleSheet.create({
  page: {
    fontFamily:  'Inter',
    fontSize:    9,
    color:       COLORS.primary,
    paddingTop:  40,
    paddingBottom: 50,
    paddingHorizontal: 40,
  },
  header: {
    marginBottom: 24,
    borderBottom: `1pt solid ${COLORS.border}`,
    paddingBottom: 12,
  },
  title: {
    fontSize:   20,
    fontWeight: 700,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 10,
    color:    COLORS.secondary,
  },
  // Karty z sumami
  totalsRow: {
    flexDirection: 'row',
    gap:           12,
    marginBottom:  20,
  },
  totalCard: {
    flex:            1,
    borderRadius:    6,
    backgroundColor: COLORS.rowAlt,
    padding:         10,
    border:          `1pt solid ${COLORS.border}`,
  },
  totalLabel: {
    fontSize: 8,
    color:    COLORS.secondary,
    marginBottom: 3,
  },
  totalValue: {
    fontSize:   14,
    fontWeight: 700,
  },
  // Tabela
  table: {
    width: '100%',
  },
  tableHeader: {
    flexDirection:   'row',
    backgroundColor: COLORS.primary,
    color:           '#fff',
    borderRadius:    4,
    paddingVertical: 6,
    paddingHorizontal: 8,
    marginBottom:    2,
    fontWeight:      600,
  },
  tableRow: {
    flexDirection:   'row',
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderBottom:    `0.5pt solid ${COLORS.border}`,
  },
  tableRowAlt: {
    backgroundColor: COLORS.rowAlt,
  },
  // Kolumny
  colDate:    { width: '13%' },
  colClient:  { width: '22%' },
  colProject: { width: '22%' },
  colHours:   { width: '10%', textAlign: 'right' },
  colPLN:     { width: '16%', textAlign: 'right' },
  colEUR:     { width: '16%', textAlign: 'right' },
  // Footer
  footer: {
    position:  'absolute',
    bottom:    20,
    left:      40,
    right:     40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    color:     COLORS.secondary,
    fontSize:  8,
    borderTop: `0.5pt solid ${COLORS.border}`,
    paddingTop: 6,
  },
})

// ── Typy ──────────────────────────────────────────────────────────────────────

interface EarningsReportProps {
  rows:        ExportRow[]
  periodLabel: string
  totals: {
    totalPLN:   number
    totalEUR:   number
    totalHours: number
  }
}

// ── Komponent ─────────────────────────────────────────────────────────────────

export function EarningsReport({ rows, totals, periodLabel }: EarningsReportProps) {
  const now = new Date().toLocaleDateString('pl-PL', {
    day: '2-digit', month: 'long', year: 'numeric',
  })

  return (
    <Document
      title={`Raport zarobków — ${periodLabel}`}
      author="Dashboard"
      creator="Dashboard App"
    >
      <Page size="A4" style={styles.page}>

        {/* Nagłówek */}
        <View style={styles.header}>
          <Text style={styles.title}>Raport zarobków</Text>
          <Text style={styles.subtitle}>{periodLabel} · Wygenerowano {now}</Text>
        </View>

        {/* Sumy */}
        <View style={styles.totalsRow}>
          <View style={styles.totalCard}>
            <Text style={styles.totalLabel}>Łącznie PLN</Text>
            <Text style={styles.totalValue}>
              {totals.totalPLN.toLocaleString('pl-PL', { minimumFractionDigits: 2 })} zł
            </Text>
          </View>
          <View style={styles.totalCard}>
            <Text style={styles.totalLabel}>Łącznie EUR</Text>
            <Text style={styles.totalValue}>
              {totals.totalEUR.toLocaleString('pl-PL', { minimumFractionDigits: 2 })} €
            </Text>
          </View>
          <View style={styles.totalCard}>
            <Text style={styles.totalLabel}>Godziny</Text>
            <Text style={styles.totalValue}>{totals.totalHours.toFixed(1)} h</Text>
          </View>
        </View>

        {/* Tabela */}
        <View style={styles.table}>
          {/* Header */}
          <View style={styles.tableHeader}>
            <Text style={styles.colDate}>Data</Text>
            <Text style={styles.colClient}>Klient</Text>
            <Text style={styles.colProject}>Projekt</Text>
            <Text style={styles.colHours}>Godz.</Text>
            <Text style={styles.colPLN}>Zarobki PLN</Text>
            <Text style={styles.colEUR}>Zarobki EUR</Text>
          </View>

          {/* Wiersze */}
          {rows.map((row, i) => (
            <View
              key={row.date + row.client + i}
              style={[styles.tableRow, i % 2 === 1 ? styles.tableRowAlt : {}]}
              wrap={false}
            >
              <Text style={styles.colDate}>{row.date}</Text>
              <Text style={styles.colClient}>{row.client}</Text>
              <Text style={styles.colProject}>{row.project}</Text>
              <Text style={styles.colHours}>{row.hours.toFixed(1)}</Text>
              <Text style={styles.colPLN}>
                {row.earningsPLN.toLocaleString('pl-PL', { minimumFractionDigits: 2 })}
              </Text>
              <Text style={styles.colEUR}>
                {row.earningsEUR > 0
                  ? row.earningsEUR.toLocaleString('pl-PL', { minimumFractionDigits: 2 })
                  : '—'}
              </Text>
            </View>
          ))}
        </View>

        {/* Footer z numerem strony */}
        <View style={styles.footer} fixed>
          <Text>Dashboard · Raport zarobków</Text>
          <Text render={({ pageNumber, totalPages }) =>
            `Strona ${pageNumber} / ${totalPages}`
          } />
        </View>

      </Page>
    </Document>
  )
}