import type { Invoice, InvoiceLineItem } from '@/lib/types'
import { closeTag, escapeXml, openTag, tag, xmlDeclaration } from './xml'
import { computeInvoiceTotals } from '@/lib/finance/invoice-totals'

/**
 * Simplified JPK_FA(3) XML builder. Produces a structurally valid document
 * that passes basic schema validation; user-facing export still requires
 * Podmiot1 data (NIP, name, address, US code) to be filled in from the issuer
 * profile. We expose that data through the IssuerData input so the UI can
 * source it from the authenticated user's profile.
 *
 * Reference: https://www.podatki.gov.pl/jpk/
 */

export interface IssuerData {
  nip: string
  name: string
  email?: string | null
  address: {
    country_code: string
    voivodeship?: string | null
    district?: string | null
    municipality?: string | null
    street?: string | null
    building_nr: string
    flat_nr?: string | null
    city: string
    postal_code: string
    postbox?: string | null
  }
  office_code?: string | null
}

export interface JpkFaOptions {
  issuer: IssuerData
  periodFrom: string
  periodTo: string
  purpose?: 1 | 2
  /** ISO date-time the file was produced (defaults to now). */
  createdAt?: Date
  systemName?: string
}

export interface JpkFaInvoice {
  invoice: Invoice
  buyer: {
    nip?: string | null
    name?: string | null
    country_code?: string | null
  }
  lineItems: InvoiceLineItem[]
}

function formatIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function formatDecimal(value: number, digits = 2): string {
  if (!Number.isFinite(value)) return (0).toFixed(digits)
  return value.toFixed(digits)
}

function headerSection(opts: JpkFaOptions): string {
  const now = opts.createdAt ?? new Date()
  return [
    openTag('Naglowek'),
    openTag('KodFormularza', {
      kodSystemowy: 'JPK_FA (3)',
      wersjaSchemy: '1-0E',
    }) + escapeXml('JPK_FA') + closeTag('KodFormularza'),
    tag('WariantFormularza', 3),
    tag('DataWytworzeniaJPK', now.toISOString()),
    tag('DataOd', opts.periodFrom),
    tag('DataDo', opts.periodTo),
    tag('NazwaSystemu', opts.systemName ?? 'WorkFlowPro'),
    tag('CelZlozenia', opts.purpose ?? 1),
    tag('KodUrzedu', opts.issuer.office_code ?? ''),
    closeTag('Naglowek'),
  ].join('')
}

function podmiot1Section(issuer: IssuerData): string {
  const a = issuer.address
  return [
    openTag('Podmiot1'),
    openTag('IdentyfikatorPodmiotu'),
    tag('NIP', issuer.nip),
    tag('PelnaNazwa', issuer.name),
    tag('Email', issuer.email ?? ''),
    closeTag('IdentyfikatorPodmiotu'),
    openTag('AdresPodmiotu'),
    tag('KodKraju', a.country_code),
    tag('Wojewodztwo', a.voivodeship ?? ''),
    tag('Powiat', a.district ?? ''),
    tag('Gmina', a.municipality ?? ''),
    tag('Ulica', a.street ?? ''),
    tag('NrDomu', a.building_nr),
    tag('NrLokalu', a.flat_nr ?? ''),
    tag('Miejscowosc', a.city),
    tag('KodPocztowy', a.postal_code),
    tag('Poczta', a.postbox ?? a.city),
    closeTag('AdresPodmiotu'),
    closeTag('Podmiot1'),
  ].join('')
}

function faktura(entry: JpkFaInvoice): { xml: string; net: number; vat: number } {
  const totals = computeInvoiceTotals(entry.lineItems, entry.invoice.currency)
  const invoice = entry.invoice

  const xml = [
    openTag('Faktura', { typ: 'G' }),
    tag('KodWaluty', invoice.currency),
    tag('P_1', invoice.invoice_date ?? invoice.issue_date ?? ''),
    tag('P_2A', invoice.invoice_number ?? invoice.id),
    tag('P_3A', entry.buyer.name ?? invoice.recipient ?? ''),
    tag('P_3B', ''), // buyer address — left blank for now
    tag('P_3C', entry.buyer.name ?? invoice.recipient ?? ''),
    tag('P_3D', ''),
    tag('P_4A', entry.buyer.country_code ?? 'PL'),
    tag('P_4B', entry.buyer.nip ?? ''),
    tag('P_5A', 'PL'),
    tag('P_5B', ''),
    tag('P_6', invoice.invoice_date ?? invoice.issue_date ?? ''),
    tag('P_13_1', formatDecimal(totals.net_amount)),
    tag('P_14_1', formatDecimal(totals.vat_amount)),
    tag('P_15', formatDecimal(totals.gross_amount)),
    tag('RodzajFaktury', 'VAT'),
    closeTag('Faktura'),
  ].join('')

  return { xml, net: totals.net_amount, vat: totals.vat_amount }
}

function wierszeFaktur(entries: JpkFaInvoice[]): string {
  let total = 0
  const lines: string[] = []
  entries.forEach((entry, invoiceIndex) => {
    entry.lineItems.forEach((item, lineIndex) => {
      total += 1
      lines.push(
        openTag('FakturaWiersz', { typ: 'G' }),
        tag('P_2B', entry.invoice.invoice_number ?? entry.invoice.id),
        tag('P_7', item.description),
        tag('P_8A', item.unit),
        tag('P_8B', formatDecimal(item.quantity, 4)),
        tag('P_9A', formatDecimal(item.unit_price_net)),
        tag('P_11', formatDecimal(item.net_amount)),
        tag('P_12', formatDecimal(item.vat_rate)),
        closeTag('FakturaWiersz'),
      )
      // invoiceIndex / lineIndex kept for potential future indexing.
      void invoiceIndex
      void lineIndex
    })
  })
  return lines.join('')
}

export function buildJpkFaXml(opts: JpkFaOptions, invoices: JpkFaInvoice[]): string {
  const faktury = invoices.map(faktura)
  const faktSum = faktury.reduce(
    (acc, f) => ({ net: acc.net + f.net, vat: acc.vat + f.vat }),
    { net: 0, vat: 0 },
  )

  return [
    xmlDeclaration('UTF-8'),
    openTag('JPK', {
      xmlns: 'http://jpk.mf.gov.pl/wzor/2019/09/27/09271/',
      'xmlns:etd': 'http://crd.gov.pl/xml/schematy/dziedzinowe/mf/2020/03/11/eD/DefinicjeTypy/',
    }),
    headerSection(opts),
    podmiot1Section(opts.issuer),
    faktury.map((f) => f.xml).join(''),
    openTag('FakturaCtrl'),
    tag('LiczbaFaktur', invoices.length),
    tag('WartoscFaktur', formatDecimal(faktSum.net + faktSum.vat)),
    closeTag('FakturaCtrl'),
    wierszeFaktur(invoices),
    openTag('FakturaWierszCtrl'),
    tag('LiczbaWierszyFaktur', invoices.reduce((n, e) => n + e.lineItems.length, 0)),
    tag('WartoscWierszyFaktur', formatDecimal(faktSum.net)),
    closeTag('FakturaWierszCtrl'),
    closeTag('JPK'),
  ].join('\n')
}

export function defaultPeriodFromInvoices(invoices: Invoice[]): { periodFrom: string; periodTo: string } {
  if (invoices.length === 0) {
    const today = formatIsoDate(new Date())
    return { periodFrom: today, periodTo: today }
  }
  const dates = invoices
    .map((i) => i.invoice_date ?? i.issue_date ?? i.created_at)
    .filter((d): d is string => typeof d === 'string' && /^\d{4}-\d{2}-\d{2}/.test(d))
    .map((d) => d.slice(0, 10))
    .sort()
  return {
    periodFrom: dates[0] ?? formatIsoDate(new Date()),
    periodTo: dates[dates.length - 1] ?? formatIsoDate(new Date()),
  }
}
