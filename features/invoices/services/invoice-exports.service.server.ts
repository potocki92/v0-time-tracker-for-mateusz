'use server'

import { createClient } from '@/lib/supabase/server'
import type { Client, Invoice, InvoiceLineItem } from '@/lib/types'
import {
  ACCOUNTING_FORMATS,
  buildAccountingCsv,
  type AccountingFormat,
} from '@/lib/export/accounting-csv'
import {
  buildJpkFaXml,
  defaultPeriodFromInvoices,
  type IssuerData,
  type JpkFaInvoice,
} from '@/lib/export/jpk-fa'

async function currentUser() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user) throw new Error('Brak autoryzacji użytkownika')
  return { user, supabase }
}

export interface ExportRequest {
  /** Inclusive ISO date (invoice_date >= from). */
  from?: string
  /** Inclusive ISO date (invoice_date <= to). */
  to?: string
}

export async function exportInvoicesCsvAction(
  format: AccountingFormat,
  request: ExportRequest = {},
): Promise<{ filename: string; content: string; contentType: string }> {
  if (!ACCOUNTING_FORMATS.includes(format)) {
    throw new Error(`Nieznany format eksportu: ${format}`)
  }
  const { user, supabase } = await currentUser()

  let query = supabase
    .from('invoices')
    .select('*')
    .eq('user_id', user.id)
    .order('invoice_date', { ascending: true })
  if (request.from) query = query.gte('invoice_date', request.from)
  if (request.to) query = query.lte('invoice_date', request.to)

  const [{ data: invoices, error }, { data: clients, error: clientsError }] = await Promise.all([
    query,
    supabase.from('clients').select('*').eq('user_id', user.id),
  ])

  if (error) throw new Error(error.message)
  if (clientsError) throw new Error(clientsError.message)

  const content = buildAccountingCsv({
    invoices: (invoices ?? []) as Invoice[],
    clients: (clients ?? []) as Client[],
    format,
  })

  const range = request.from && request.to ? `_${request.from}_${request.to}` : ''
  return {
    filename: `faktury_${format}${range}.csv`,
    content,
    contentType: 'text/csv; charset=utf-8',
  }
}

export async function exportInvoicesJpkFaAction(
  request: ExportRequest = {},
): Promise<{ filename: string; content: string; contentType: string }> {
  const { user, supabase } = await currentUser()

  let invoiceQuery = supabase
    .from('invoices')
    .select('*')
    .eq('user_id', user.id)
    .order('invoice_date', { ascending: true })
  if (request.from) invoiceQuery = invoiceQuery.gte('invoice_date', request.from)
  if (request.to) invoiceQuery = invoiceQuery.lte('invoice_date', request.to)

  const [{ data: invoicesData, error: invoicesError }, { data: clientsData, error: clientsError }, { data: profile, error: profileError }] =
    await Promise.all([
      invoiceQuery,
      supabase.from('clients').select('*').eq('user_id', user.id),
      supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
    ])

  if (invoicesError) throw new Error(invoicesError.message)
  if (clientsError) throw new Error(clientsError.message)
  if (profileError) throw new Error(profileError.message)

  const invoices = (invoicesData ?? []) as Invoice[]
  const clients = (clientsData ?? []) as Client[]

  const invoiceIds = invoices.map((i) => i.id)
  let lineItems: InvoiceLineItem[] = []
  if (invoiceIds.length > 0) {
    const { data: lineData, error: lineError } = await supabase
      .from('invoice_line_items')
      .select('*')
      .in('invoice_id', invoiceIds)
      .order('position', { ascending: true })
    if (lineError) throw new Error(lineError.message)
    lineItems = (lineData ?? []) as InvoiceLineItem[]
  }

  const linesByInvoice = new Map<string, InvoiceLineItem[]>()
  for (const line of lineItems) {
    const bucket = linesByInvoice.get(line.invoice_id) ?? []
    bucket.push(line)
    linesByInvoice.set(line.invoice_id, bucket)
  }

  const clientMap = new Map(clients.map((c) => [c.id, c]))

  // Issuer data comes from the user profile; fall back to sensible placeholders
  // so the XML is still structurally valid even before the user fills the form.
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>
  const issuerMetadata = typeof meta.issuer === 'object' && meta.issuer !== null ? (meta.issuer as Record<string, unknown>) : {}
  const issuer: IssuerData = {
    nip: String(issuerMetadata.nip ?? profile?.email ?? 'NIP_NIEWYPELNIONY'),
    name: String(issuerMetadata.name ?? profile?.full_name ?? user.email ?? 'Podmiot nieuzupełniony'),
    email: (profile?.email ?? user.email) ?? null,
    address: {
      country_code: String(issuerMetadata.country_code ?? 'PL'),
      voivodeship: (issuerMetadata.voivodeship as string | null) ?? null,
      district: (issuerMetadata.district as string | null) ?? null,
      municipality: (issuerMetadata.municipality as string | null) ?? null,
      street: (issuerMetadata.street as string | null) ?? null,
      building_nr: String(issuerMetadata.building_nr ?? '1'),
      flat_nr: (issuerMetadata.flat_nr as string | null) ?? null,
      city: String(issuerMetadata.city ?? 'Warszawa'),
      postal_code: String(issuerMetadata.postal_code ?? '00-000'),
      postbox: (issuerMetadata.postbox as string | null) ?? null,
    },
    office_code: (issuerMetadata.office_code as string | null) ?? null,
  }

  const jpkInvoices: JpkFaInvoice[] = invoices.map((invoice) => {
    const client = invoice.client_id ? clientMap.get(invoice.client_id) : undefined
    return {
      invoice,
      buyer: {
        nip: client?.nip ?? null,
        name: invoice.recipient ?? client?.name ?? null,
        country_code: 'PL',
      },
      lineItems: linesByInvoice.get(invoice.id) ?? [],
    }
  })

  const { periodFrom, periodTo } = defaultPeriodFromInvoices(invoices)
  const xml = buildJpkFaXml(
    {
      issuer,
      periodFrom: request.from ?? periodFrom,
      periodTo: request.to ?? periodTo,
    },
    jpkInvoices,
  )

  const range = request.from && request.to ? `_${request.from}_${request.to}` : ''
  return {
    filename: `JPK_FA${range}.xml`,
    content: xml,
    contentType: 'application/xml; charset=utf-8',
  }
}
