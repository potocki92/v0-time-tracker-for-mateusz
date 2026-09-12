import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer'
import type { AppFormat } from '@/lib/format'
import {
  formatPartyAddress,
  type StatementDocumentLabels,
  type StatementModel,
  type StatementRow,
} from '../../domain'
import { PDF_COLORS, pdfBaseStyles } from './pdf-theme'

/**
 * Wykaz faktur dla ksiegowej — dokument, ktory idzie do urzedu.
 *
 * Odpowiada na cztery pytania, ktore zadaje Finanzamt przy rozliczeniu
 * rocznym: JAKA faktura, ZA JAKI okres, DLA KOGO i GDZIE praca zostala
 * wykonana. Dlatego rejestr nie jest skrotem „top 5" jak podsumowanie
 * raportu — wchodzi KAZDA wystawiona faktura z zakresu.
 *
 * Etykiety wchodza argumentem w JEZYKU DOKUMENTU (`labels`), a `fmt` jest
 * zwiazany z tym samym jezykiem — nie z jezykiem interfejsu.
 *
 * Ladowany wylacznie dynamicznym importem z `useStatementExport`.
 */

const styles = StyleSheet.create({
  ...pdfBaseStyles,
  number: { width: '10%', paddingRight: 4 },
  issued: { width: '8%', paddingRight: 4 },
  period: { width: '12%', paddingRight: 4 },
  buyer: { width: '18%', paddingRight: 4 },
  location: { width: '19%', paddingRight: 4 },
  days: { width: '5%', textAlign: 'right', paddingRight: 4 },
  hours: { width: '6%', textAlign: 'right', paddingRight: 4 },
  money: { width: '7.33%', textAlign: 'right', paddingRight: 4 },

  blockTitle: { fontSize: 8, fontWeight: 700, marginTop: 8, marginBottom: 2 },
  siteProject: { width: '30%', paddingRight: 4 },
  siteLocation: { width: '38%', paddingRight: 4 },
  siteDate: { width: '11%', paddingRight: 4 },
  siteDays: { width: '5%', textAlign: 'right', paddingRight: 4 },
  siteHours: { width: '5%', textAlign: 'right' },

  totalsLabel: { width: '24%' },
  totalsCell: { width: '19%', textAlign: 'right', paddingRight: 4 },
  quarterLabel: { width: '24%' },
  quarterCount: { width: '14%', textAlign: 'right', paddingRight: 4 },
  quarterCell: { width: '20.66%', textAlign: 'right', paddingRight: 4 },

  surface: { backgroundColor: PDF_COLORS.surface },
})

export type StatementPdfProps = {
  model: StatementModel
  labels: StatementDocumentLabels
  /** Nazwa klienta z filtra albo `null` dla wszystkich — dana uzytkownika. */
  clientName: string | null
  generatedAt: string
  /** Formatter zwiazany z JEZYKIEM DOKUMENTU. */
  fmt: AppFormat
}

/** "od – do" albo luka, gdy faktura nie ma okresu uslugi. */
function periodText(row: StatementRow, labels: StatementDocumentLabels, fmt: AppFormat): string {
  return row.period ? fmt.dateRange(row.period.start, row.period.end) : labels.placeholders.noPeriod
}

function StatementRegister({ model, labels, fmt }: Omit<StatementPdfProps, 'clientName' | 'generatedAt'>) {
  return (
    <>
      <Text style={styles.sectionTitle}>{labels.sections.register}</Text>

      <View style={styles.tableHead} fixed>
        <Text style={styles.number}>{labels.columns.invoiceNumber}</Text>
        <Text style={styles.issued}>{labels.columns.issueDate}</Text>
        <Text style={styles.period}>{labels.columns.servicePeriod}</Text>
        <Text style={styles.buyer}>{labels.columns.buyer}</Text>
        <Text style={styles.location}>{labels.columns.location}</Text>
        <Text style={styles.days}>{labels.columns.workedDays}</Text>
        <Text style={styles.hours}>{labels.columns.hours}</Text>
        <Text style={styles.money}>{labels.columns.net}</Text>
        <Text style={styles.money}>{labels.columns.vat}</Text>
        <Text style={styles.money}>{labels.columns.gross}</Text>
      </View>

      {model.rows.map((row) => (
        <View key={row.id} style={styles.row} wrap={false}>
          <View style={styles.number}>
            <Text>{row.invoiceNumber}</Text>
            <Text style={styles.sub}>
              {labels.status[row.status]}
              {row.paidDate ? ` · ${fmt.date(row.paidDate, 'short')}` : ''}
            </Text>
          </View>

          <Text style={styles.issued}>{fmt.date(row.issueDate, 'short')}</Text>

          <Text style={[styles.period, row.period ? {} : styles.placeholder]}>
            {periodText(row, labels, fmt)}
          </Text>

          <View style={styles.buyer}>
            <Text>{row.party.name ?? labels.placeholders.noValue}</Text>
            {formatPartyAddress(row) !== '' && (
              <Text style={styles.sub}>{formatPartyAddress(row)}</Text>
            )}
            {row.party.taxId && (
              <Text style={styles.sub}>
                {labels.columns.taxId}: {row.party.taxId}
              </Text>
            )}
          </View>

          {/* Adresy wykonania sciete do dwoch: pelne rozbicie stoi w sekcji
              „Miejsca wykonania pracy", a rejestr ma zostac czytelny. */}
          <View style={styles.location}>
            {row.worksites.length === 0 ? (
              <Text style={styles.placeholder}>{labels.placeholders.noLocation}</Text>
            ) : (
              row.worksites
                .slice(0, 2)
                .map((worksite) => (
                  <Text key={worksite.projectId ?? 'unassigned'}>
                    {worksite.location ?? worksite.projectName ?? labels.placeholders.noLocation}
                  </Text>
                ))
            )}
            {row.worksites.length > 2 && (
              <Text style={styles.sub}>+{row.worksites.length - 2}</Text>
            )}
          </View>

          <Text style={styles.days}>{fmt.number(row.workedDays)}</Text>
          <Text style={styles.hours}>{fmt.hours(row.hours)}</Text>
          <Text style={styles.money}>{fmt.money(row.netMinor, row.currency)}</Text>
          <Text style={styles.money}>{fmt.money(row.vatMinor, row.currency)}</Text>
          <Text style={styles.money}>{fmt.money(row.grossMinor, row.currency)}</Text>
        </View>
      ))}
    </>
  )
}

/**
 * Rozbicie „gdzie" per faktura: projekt, adres, od–do, dni i godziny.
 *
 * To jest ta czesc, ktorej urzad szuka najczesciej — jedna faktura potrafi
 * obejmowac kilka budow, a rejestr pokazuje tylko dwa pierwsze adresy.
 */
function StatementLocations({ model, labels, fmt }: Omit<StatementPdfProps, 'clientName' | 'generatedAt'>) {
  const rows = model.rows.filter((row) => row.worksites.length > 0)
  if (rows.length === 0) return null

  return (
    <>
      <Text style={styles.sectionTitle} break>
        {labels.sections.locations}
      </Text>

      {rows.map((row) => (
        <View key={row.id} wrap={false}>
          <Text style={styles.blockTitle}>
            {row.invoiceNumber} · {row.party.name ?? ''} ·{' '}
            {periodText(row, labels, fmt)}
          </Text>

          <View style={[styles.tableHead, styles.surface]}>
            <Text style={styles.siteProject}>{labels.columns.project}</Text>
            <Text style={styles.siteLocation}>{labels.columns.location}</Text>
            <Text style={styles.siteDate}>{labels.columns.from}</Text>
            <Text style={styles.siteDate}>{labels.columns.to}</Text>
            <Text style={styles.siteDays}>{labels.columns.workedDays}</Text>
            <Text style={styles.siteHours}>{labels.columns.hours}</Text>
          </View>

          {row.worksites.map((worksite) => (
            <View key={worksite.projectId ?? 'unassigned'} style={styles.row}>
              <Text style={[styles.siteProject, worksite.projectName ? {} : styles.placeholder]}>
                {worksite.projectName ?? labels.placeholders.noProject}
              </Text>
              <Text style={[styles.siteLocation, worksite.location ? {} : styles.placeholder]}>
                {worksite.location ?? labels.placeholders.noLocation}
              </Text>
              <Text style={styles.siteDate}>{fmt.date(worksite.from, 'short')}</Text>
              <Text style={styles.siteDate}>{fmt.date(worksite.to, 'short')}</Text>
              <Text style={styles.siteDays}>{fmt.number(worksite.workedDays)}</Text>
              <Text style={styles.siteHours}>{fmt.hours(worksite.hours)}</Text>
            </View>
          ))}
        </View>
      ))}
    </>
  )
}

function StatementTotals({ model, labels, fmt }: Omit<StatementPdfProps, 'clientName' | 'generatedAt'>) {
  return (
    <>
      <Text style={styles.sectionTitle}>{labels.sections.totals}</Text>

      <View style={styles.tableHead}>
        <Text style={styles.totalsLabel}>{labels.columns.currency}</Text>
        <Text style={styles.totalsCell}>{labels.columns.invoiceCount}</Text>
        <Text style={styles.totalsCell}>{labels.columns.net}</Text>
        <Text style={styles.totalsCell}>{labels.columns.vat}</Text>
        <Text style={styles.totalsCell}>{labels.columns.gross}</Text>
      </View>

      {model.totals.map((total) => (
        <View key={total.currency} wrap={false}>
          <View style={styles.totalRow}>
            <Text style={styles.totalsLabel}>
              {labels.totals.row} · {total.currency}
            </Text>
            <Text style={styles.totalsCell}>{fmt.number(total.invoiceCount)}</Text>
            <Text style={styles.totalsCell}>{fmt.money(total.netMinor, total.currency)}</Text>
            <Text style={styles.totalsCell}>{fmt.money(total.vatMinor, total.currency)}</Text>
            <Text style={styles.totalsCell}>{fmt.money(total.grossMinor, total.currency)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.totalsLabel}>
              {labels.totals.paid} / {labels.totals.unpaid}
            </Text>
            <Text style={styles.totalsCell} />
            <Text style={styles.totalsCell} />
            <Text style={styles.totalsCell}>{fmt.money(total.paidGrossMinor, total.currency)}</Text>
            <Text style={styles.totalsCell}>
              {fmt.money(total.unpaidGrossMinor, total.currency)}
            </Text>
          </View>
        </View>
      ))}

      {model.quarters.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>{labels.sections.quarters}</Text>
          <View style={styles.tableHead}>
            <Text style={styles.quarterLabel}>{labels.columns.quarter}</Text>
            <Text style={styles.quarterCount}>{labels.columns.invoiceCount}</Text>
            <Text style={styles.quarterCell}>{labels.columns.net}</Text>
            <Text style={styles.quarterCell}>{labels.columns.vat}</Text>
            <Text style={styles.quarterCell}>{labels.columns.gross}</Text>
          </View>
          {model.quarters.map((quarter) => (
            <View key={`${quarter.key}-${quarter.currency}`} style={styles.row} wrap={false}>
              <Text style={styles.quarterLabel}>
                {quarter.key} · {quarter.currency}
              </Text>
              <Text style={styles.quarterCount}>{fmt.number(quarter.invoiceCount)}</Text>
              <Text style={styles.quarterCell}>{fmt.money(quarter.netMinor, quarter.currency)}</Text>
              <Text style={styles.quarterCell}>{fmt.money(quarter.vatMinor, quarter.currency)}</Text>
              <Text style={styles.quarterCell}>
                {fmt.money(quarter.grossMinor, quarter.currency)}
              </Text>
            </View>
          ))}
        </>
      )}
    </>
  )
}

export function StatementPdfDocument({
  model,
  labels,
  clientName,
  generatedAt,
  fmt,
}: StatementPdfProps) {
  const sections = { model, labels, fmt }

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>{labels.title}</Text>
          <Text style={styles.subtitle}>{labels.subtitle}</Text>
          <View style={styles.metaRow}>
            <Text style={styles.meta}>
              {labels.range}: {fmt.dateRange(model.range.start, model.range.end)}
              {'   ·   '}
              {labels.client}: {clientName ?? labels.allClients}
            </Text>
            <Text style={styles.meta}>
              {labels.generatedAt}: {generatedAt}
            </Text>
          </View>
        </View>

        <StatementRegister {...sections} />
        <StatementLocations {...sections} />
        <StatementTotals {...sections} />

        <Text style={styles.footnote}>{labels.notes.method}</Text>
        <Text style={styles.footnote}>{labels.notes.locations}</Text>
        <Text style={styles.footnote}>{labels.notes.currencies}</Text>

        {/* Luki w danych stoja W DOKUMENCIE, a nie tylko na ekranie: ksiegowa
            ma wiedziec, ze wykaz jest niekompletny, zanim wyslie go dalej. */}
        {model.missingPeriodCount > 0 && (
          <Text style={styles.footnote}>
            {labels.notes.missingPeriod}: {fmt.number(model.missingPeriodCount)}
          </Text>
        )}
        {model.missingLocationCount > 0 && (
          <Text style={styles.footnote}>
            {labels.notes.missingLocation}: {fmt.number(model.missingLocationCount)}
          </Text>
        )}
        {model.draftCount > 0 && (
          <Text style={styles.footnote}>
            {labels.notes.drafts}: {fmt.number(model.draftCount)}
          </Text>
        )}

        <Text
          style={styles.pageNumber}
          render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
          fixed
        />
      </Page>
    </Document>
  )
}
