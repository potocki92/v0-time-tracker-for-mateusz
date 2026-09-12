import 'server-only'
import { createClient } from '@/lib/supabase/server'
import { PERFORMED_WORK_STATUS } from '../domain/dataset'
import type {
  StatementClientRef,
  StatementEntryRow,
  StatementInvoiceRow,
  StatementProjectRef,
  StatementRange,
} from '../domain/types'
import {
  STATEMENT_CLIENT_COLUMNS,
  STATEMENT_INVOICE_COLUMNS,
  STATEMENT_MAX_CLIENTS,
  STATEMENT_MAX_INVOICES,
  STATEMENT_MAX_PROJECTS,
  STATEMENT_MAX_WORK_ENTRIES,
  STATEMENT_PROJECT_COLUMNS,
  STATEMENT_WORK_ENTRY_COLUMNS,
} from './accounting.columns'

/**
 * Fetchery wykazu. Uzywane WYLACZNIE po stronie serwera (route handler,
 * Server Component) — import w komponencie klienckim wywroci build na
 * `server-only`.
 *
 * Nie filtruja po `user_id`: izolacje robi RLS (`auth.uid() = user_id`).
 */

async function getSupabase() {
  return createClient()
}

/**
 * Faktury wystawione w zakresie wykazu.
 *
 * Data wystawienia mieszka w dwoch kolumnach: `invoice_date` (aktualna) oraz
 * `issue_date` (legacy, wypelniona w starszych wierszach). Zapytanie zaweza po
 * OBU, wiec moze przepuscic wiersz, ktorego data efektywna lezy tuz poza
 * zakresem — dokladna granice stawia domena (`buildStatementModel`), zeby
 * jedno rozstrzygniecie nie rozjechalo sie miedzy SQL a modelem.
 */
export async function fetchStatementInvoicesServer(
  range: StatementRange,
  clientId: string | null,
): Promise<StatementInvoiceRow[]> {
  const supabase = await getSupabase()

  let query = supabase
    .from('invoices')
    .select(STATEMENT_INVOICE_COLUMNS)
    .or(
      `and(invoice_date.gte.${range.start},invoice_date.lte.${range.end}),` +
        `and(issue_date.gte.${range.start},issue_date.lte.${range.end})`,
    )

  if (clientId) query = query.eq('client_id', clientId)

  const { data, error } = await query
    .order('invoice_date', { ascending: true })
    .limit(STATEMENT_MAX_INVOICES)

  if (error) throw new Error(`fetchStatementInvoicesServer: ${error.message}`)
  return (data ?? []) as unknown as StatementInvoiceRow[]
}

/**
 * Wpisy pracy dla okna miejsc pracy.
 *
 * Okno jest szersze niz zakres wykazu o okresy uslug fakturowanych w tym
 * zakresie (`workWindowOf`) — faktura ze stycznia za grudniowa prace musi
 * miec z czego wziac adres.
 */
export async function fetchStatementEntriesServer(
  window: StatementRange,
  clientId: string | null,
): Promise<StatementEntryRow[]> {
  const supabase = await getSupabase()

  let query = supabase
    .from('work_entries')
    .select(STATEMENT_WORK_ENTRY_COLUMNS)
    .gte('date', window.start)
    .lte('date', window.end)
    .eq('status', PERFORMED_WORK_STATUS)
    .eq('entry_kind', 'real')

  if (clientId) query = query.eq('client_id', clientId)

  const { data, error } = await query
    .order('date', { ascending: true })
    .limit(STATEMENT_MAX_WORK_ENTRIES)

  if (error) throw new Error(`fetchStatementEntriesServer: ${error.message}`)
  return (data ?? []) as unknown as StatementEntryRow[]
}

export async function fetchStatementClientsServer(): Promise<StatementClientRef[]> {
  const supabase = await getSupabase()
  const { data, error } = await supabase
    .from('clients')
    .select(STATEMENT_CLIENT_COLUMNS)
    .limit(STATEMENT_MAX_CLIENTS)

  if (error) throw new Error(`fetchStatementClientsServer: ${error.message}`)
  return (data ?? []) as unknown as StatementClientRef[]
}

export async function fetchStatementProjectsServer(): Promise<StatementProjectRef[]> {
  const supabase = await getSupabase()
  const { data, error } = await supabase
    .from('projects')
    .select(STATEMENT_PROJECT_COLUMNS)
    .limit(STATEMENT_MAX_PROJECTS)

  if (error) throw new Error(`fetchStatementProjectsServer: ${error.message}`)
  return (data ?? []) as unknown as StatementProjectRef[]
}
