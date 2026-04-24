import type { Client, Invoice } from '@/lib/types'
import { deriveInvoiceStatus } from '@/lib/finance/invoice-status'

export const ACCOUNTING_FORMATS = ['fakturownia', 'ifirma', 'wfirma', 'generic'] as const
export type AccountingFormat = (typeof ACCOUNTING_FORMATS)[number]

export interface AccountingExportInput {
  invoices: Invoice[]
  clients: Client[]
  format: AccountingFormat
  /** CSV field separator. Polish accounting software often expects ';'. */
  separator?: ',' | ';'
  /** Prefix the CSV with a UTF-8 BOM for Excel on Windows. */
  withBom?: boolean
}

function escape(value: string | number | null | undefined, separator: string): string {
  if (value === null || value === undefined) return ''
  const str = String(value)
  const needsQuoting = str.includes(separator) || str.includes('"') || /[\n\r]/.test(str)
  if (!needsQuoting) return str
  return `"${str.replace(/"/g, '""')}"`
}

interface FormatDefinition {
  headers: string[]
  mapRow(invoice: Invoice, client: Client | undefined): Array<string | number | null | undefined>
}

function polishDate(iso: string | null | undefined): string {
  if (!iso) return ''
  return iso.slice(0, 10)
}

const fakturowniaFormat: FormatDefinition = {
  headers: [
    'Numer',
    'Data wystawienia',
    'Termin płatności',
    'Data sprzedaży',
    'Nabywca',
    'Nabywca NIP',
    'Wartość netto',
    'VAT',
    'Wartość brutto',
    'Waluta',
    'Status',
    'Zapłacono',
  ],
  mapRow(invoice, client) {
    const status = deriveInvoiceStatus(invoice)
    return [
      invoice.invoice_number ?? invoice.id,
      polishDate(invoice.invoice_date ?? invoice.issue_date),
      polishDate(invoice.due_date),
      polishDate(invoice.invoice_date ?? invoice.issue_date),
      invoice.recipient ?? client?.name ?? '',
      client?.nip ?? '',
      invoice.net_amount ?? '',
      invoice.vat_amount ?? '',
      invoice.gross_amount ?? invoice.amount,
      invoice.currency,
      status,
      invoice.is_paid ? polishDate(invoice.paid_date ?? null) : '',
    ]
  },
}

const ifirmaFormat: FormatDefinition = {
  headers: [
    'NumerFaktury',
    'DataWystawienia',
    'DataSprzedazy',
    'NazwaKontrahenta',
    'NIP',
    'Netto',
    'VAT',
    'Brutto',
    'Waluta',
  ],
  mapRow(invoice, client) {
    return [
      invoice.invoice_number ?? invoice.id,
      polishDate(invoice.invoice_date ?? invoice.issue_date),
      polishDate(invoice.invoice_date ?? invoice.issue_date),
      invoice.recipient ?? client?.name ?? '',
      client?.nip ?? '',
      invoice.net_amount ?? '',
      invoice.vat_amount ?? '',
      invoice.gross_amount ?? invoice.amount,
      invoice.currency,
    ]
  },
}

const wfirmaFormat: FormatDefinition = {
  headers: [
    'Numer dokumentu',
    'Data wystawienia',
    'Data sprzedaży',
    'Termin płatności',
    'Kontrahent',
    'NIP',
    'Netto',
    'VAT',
    'Brutto',
    'Waluta',
    'Opłacona',
  ],
  mapRow(invoice, client) {
    return [
      invoice.invoice_number ?? invoice.id,
      polishDate(invoice.invoice_date ?? invoice.issue_date),
      polishDate(invoice.invoice_date ?? invoice.issue_date),
      polishDate(invoice.due_date),
      invoice.recipient ?? client?.name ?? '',
      client?.nip ?? '',
      invoice.net_amount ?? '',
      invoice.vat_amount ?? '',
      invoice.gross_amount ?? invoice.amount,
      invoice.currency,
      invoice.is_paid ? 'tak' : 'nie',
    ]
  },
}

const genericFormat: FormatDefinition = {
  headers: [
    'invoice_number',
    'invoice_date',
    'due_date',
    'client_name',
    'client_nip',
    'net_amount',
    'vat_amount',
    'gross_amount',
    'currency',
    'status',
    'is_paid',
    'paid_date',
  ],
  mapRow(invoice, client) {
    return [
      invoice.invoice_number ?? invoice.id,
      polishDate(invoice.invoice_date ?? invoice.issue_date),
      polishDate(invoice.due_date),
      invoice.recipient ?? client?.name ?? '',
      client?.nip ?? '',
      invoice.net_amount ?? '',
      invoice.vat_amount ?? '',
      invoice.gross_amount ?? invoice.amount,
      invoice.currency,
      deriveInvoiceStatus(invoice),
      invoice.is_paid ? 'true' : 'false',
      polishDate(invoice.paid_date ?? null),
    ]
  },
}

const FORMAT_REGISTRY: Record<AccountingFormat, FormatDefinition> = {
  fakturownia: fakturowniaFormat,
  ifirma: ifirmaFormat,
  wfirma: wfirmaFormat,
  generic: genericFormat,
}

export function buildAccountingCsv({
  invoices,
  clients,
  format,
  separator = ';',
  withBom = true,
}: AccountingExportInput): string {
  const definition = FORMAT_REGISTRY[format]
  const clientMap = new Map(clients.map((c) => [c.id, c]))

  const headerLine = definition.headers.map((h) => escape(h, separator)).join(separator)
  const lines = invoices.map((invoice) => {
    const client = invoice.client_id ? clientMap.get(invoice.client_id) : undefined
    const row = definition.mapRow(invoice, client)
    return row.map((cell) => escape(cell, separator)).join(separator)
  })

  const body = [headerLine, ...lines].join('\r\n')
  return withBom ? `﻿${body}` : body
}
