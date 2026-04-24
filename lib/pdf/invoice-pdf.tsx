import React from 'react'
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  pdf,
} from '@react-pdf/renderer'
import type { Client, Invoice, InvoiceLineItem, Profile } from '@/lib/types'
import { format as formatMoney, fromMajor } from '@/lib/finance/money'
import { computeInvoiceTotals } from '@/lib/finance/invoice-totals'

export type InvoiceTemplateKey = 'classic' | 'modern' | 'minimal'

export interface InvoicePdfData {
  invoice: Invoice
  lineItems: InvoiceLineItem[]
  client: Client | null
  issuer: Pick<Profile, 'full_name' | 'email'> & {
    company_name?: string | null
    nip?: string | null
    address?: string | null
  }
  accentColor?: string
  footer?: string
  templateKey?: InvoiceTemplateKey
}

const baseStyles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
    color: '#111827',
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  h1: { fontSize: 20, fontWeight: 700 },
  muted: { color: '#6b7280', fontSize: 9 },
  section: { marginBottom: 16 },
  twoCols: { flexDirection: 'row', gap: 24, marginBottom: 24 },
  col: { flex: 1 },
  blockHeader: { fontSize: 9, color: '#6b7280', marginBottom: 4, textTransform: 'uppercase' },
  table: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 4 },
  tr: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  trHead: { backgroundColor: '#f3f4f6' },
  th: { padding: 6, fontWeight: 700, fontSize: 9 },
  td: { padding: 6, fontSize: 9 },
  cellPos: { width: 24, textAlign: 'center' },
  cellDesc: { flex: 1 },
  cellQty: { width: 50, textAlign: 'right' },
  cellPrice: { width: 70, textAlign: 'right' },
  cellVat: { width: 40, textAlign: 'right' },
  cellTotal: { width: 80, textAlign: 'right' },
  totalsBox: { marginTop: 12, alignSelf: 'flex-end', minWidth: 220 },
  totalsRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2 },
  totalsLabel: { color: '#374151' },
  totalsValue: { fontWeight: 700 },
  grandRow: { borderTopWidth: 1, borderTopColor: '#111827', marginTop: 4, paddingTop: 4 },
  footer: {
    position: 'absolute',
    bottom: 24,
    left: 40,
    right: 40,
    textAlign: 'center',
    color: '#6b7280',
    fontSize: 9,
  },
})

function formatDate(iso?: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('pl-PL')
}

function accentStyle(accent?: string) {
  return { color: accent ?? '#1d4ed8' }
}

function Header({
  invoice,
  accent,
  templateKey,
}: {
  invoice: Invoice
  accent?: string
  templateKey: InvoiceTemplateKey
}) {
  return (
    <View style={baseStyles.headerRow}>
      <View>
        <Text style={templateKey !== 'minimal' ? [baseStyles.h1, accentStyle(accent)] : baseStyles.h1}>
          Faktura {invoice.invoice_number ?? ''}
        </Text>
        <Text style={baseStyles.muted}>
          Data wystawienia: {formatDate(invoice.invoice_date ?? invoice.issue_date ?? null)}
        </Text>
        {invoice.due_date ? (
          <Text style={baseStyles.muted}>Termin płatności: {formatDate(invoice.due_date)}</Text>
        ) : null}
      </View>
      <View>
        <Text style={[baseStyles.blockHeader]}>Status</Text>
        <Text>{invoice.status ?? (invoice.is_paid ? 'PAID' : 'SENT')}</Text>
      </View>
    </View>
  )
}

function PartyBlock({
  title,
  lines,
}: {
  title: string
  lines: Array<string | null | undefined>
}) {
  return (
    <View style={baseStyles.col}>
      <Text style={baseStyles.blockHeader}>{title}</Text>
      {lines.filter(Boolean).map((line, i) => (
        <Text key={i}>{line}</Text>
      ))}
    </View>
  )
}

function LineItemsTable({
  items,
  currency,
}: {
  items: InvoiceLineItem[]
  currency: Invoice['currency']
}) {
  return (
    <View style={baseStyles.table}>
      <View style={[baseStyles.tr, baseStyles.trHead]}>
        <Text style={[baseStyles.th, baseStyles.cellPos]}>#</Text>
        <Text style={[baseStyles.th, baseStyles.cellDesc]}>Opis</Text>
        <Text style={[baseStyles.th, baseStyles.cellQty]}>Ilość</Text>
        <Text style={[baseStyles.th, baseStyles.cellPrice]}>Cena netto</Text>
        <Text style={[baseStyles.th, baseStyles.cellVat]}>VAT</Text>
        <Text style={[baseStyles.th, baseStyles.cellTotal]}>Wartość brutto</Text>
      </View>
      {items.map((item, i) => (
        <View style={baseStyles.tr} key={item.id ?? i}>
          <Text style={[baseStyles.td, baseStyles.cellPos]}>{item.position ?? i + 1}</Text>
          <Text style={[baseStyles.td, baseStyles.cellDesc]}>{item.description}</Text>
          <Text style={[baseStyles.td, baseStyles.cellQty]}>
            {item.quantity} {item.unit}
          </Text>
          <Text style={[baseStyles.td, baseStyles.cellPrice]}>
            {formatMoney(fromMajor(item.unit_price_net, currency))}
          </Text>
          <Text style={[baseStyles.td, baseStyles.cellVat]}>{item.vat_rate}%</Text>
          <Text style={[baseStyles.td, baseStyles.cellTotal]}>
            {formatMoney(fromMajor(item.gross_amount, currency))}
          </Text>
        </View>
      ))}
    </View>
  )
}

function TotalsBlock({
  items,
  currency,
}: {
  items: InvoiceLineItem[]
  currency: Invoice['currency']
}) {
  const totals = computeInvoiceTotals(items, currency)
  return (
    <View style={baseStyles.totalsBox}>
      <View style={baseStyles.totalsRow}>
        <Text style={baseStyles.totalsLabel}>Netto</Text>
        <Text style={baseStyles.totalsValue}>{formatMoney(totals.net)}</Text>
      </View>
      <View style={baseStyles.totalsRow}>
        <Text style={baseStyles.totalsLabel}>VAT</Text>
        <Text style={baseStyles.totalsValue}>{formatMoney(totals.vat)}</Text>
      </View>
      <View style={[baseStyles.totalsRow, baseStyles.grandRow]}>
        <Text style={baseStyles.totalsLabel}>Razem do zapłaty</Text>
        <Text style={baseStyles.totalsValue}>{formatMoney(totals.gross)}</Text>
      </View>
    </View>
  )
}

function InvoiceTemplate({
  invoice,
  lineItems,
  client,
  issuer,
  accentColor,
  footer,
  templateKey = 'classic',
}: InvoicePdfData) {
  const pageStyle =
    templateKey === 'modern'
      ? [baseStyles.page, { borderTopWidth: 6, borderTopColor: accentColor ?? '#1d4ed8' }]
      : baseStyles.page

  return (
    <Document>
      <Page size="A4" style={pageStyle}>
        <Header invoice={invoice} accent={accentColor} templateKey={templateKey} />

        <View style={baseStyles.twoCols}>
          <PartyBlock
            title="Sprzedawca"
            lines={[issuer.full_name ?? issuer.company_name, issuer.nip ? `NIP: ${issuer.nip}` : null, issuer.address, issuer.email]}
          />
          <PartyBlock
            title="Nabywca"
            lines={[
              invoice.recipient ?? client?.name,
              client?.nip ? `NIP: ${client.nip}` : null,
              client?.address,
              client?.email,
            ]}
          />
        </View>

        {invoice.billing_period ? (
          <View style={baseStyles.section}>
            <Text style={baseStyles.blockHeader}>Okres rozliczeniowy</Text>
            <Text>{invoice.billing_period}</Text>
          </View>
        ) : null}

        <LineItemsTable items={lineItems} currency={invoice.currency} />
        <TotalsBlock items={lineItems} currency={invoice.currency} />

        {invoice.notes ? (
          <View style={baseStyles.section}>
            <Text style={baseStyles.blockHeader}>Uwagi</Text>
            <Text>{invoice.notes}</Text>
          </View>
        ) : null}

        {footer ? <Text style={baseStyles.footer}>{footer}</Text> : null}
      </Page>
    </Document>
  )
}

/** Render an invoice to a PDF Blob. Returns Uint8Array (browser + Node). */
export async function renderInvoicePdfBlob(data: InvoicePdfData): Promise<Blob> {
  const doc = <InvoiceTemplate {...data} />
  return pdf(doc).toBlob()
}

export { InvoiceTemplate }
