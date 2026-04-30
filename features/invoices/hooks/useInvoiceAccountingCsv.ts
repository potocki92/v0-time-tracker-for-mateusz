'use client'

import { useCallback, useMemo } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { Client, Invoice } from '@/lib/types'
import { importInvoicesFromCsv } from '../services'
import { INVOICES_MANAGER_QUERY_KEY, type ImportInvoiceCsvRow } from '../domain'

const CSV_HEADERS = [
  'nazwa_faktury',
  'numer_faktury',
  'odbiorca',
  'klient',
  'okres_rozliczeniowy',
  'data_faktury',
  'kwota',
  'waluta',
  'oplacona',
  'notatki',
] as const

const ACCEPTED_CURRENCIES = new Set(['PLN', 'EUR'])

function escapeCsvValue(value: string | number | boolean | null | undefined): string {
  const normalized = value == null ? '' : String(value)
  if (normalized.includes(',') || normalized.includes('"') || normalized.includes('\n')) {
    return `"${normalized.replace(/"/g, '""')}"`
  }

  return normalized
}

function normalizeBoolean(value: string): boolean {
  const normalized = value.trim().toLowerCase()
  return normalized === '1' || normalized === 'tak' || normalized === 'true' || normalized === 'yes'
}

function splitCsvLine(line: string): string[] {
  const out: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]

    if (char === '"') {
      const next = line[i + 1]
      if (inQuotes && next === '"') {
        current += '"'
        i += 1
        continue
      }
      inQuotes = !inQuotes
      continue
    }

    if (char === ',' && !inQuotes) {
      out.push(current)
      current = ''
      continue
    }

    current += char
  }

  out.push(current)
  return out.map((value) => value.trim())
}

function rowsToCsv(invoices: Invoice[], clients: Client[]): string {
  const clientsById = new Map(clients.map((client) => [client.id, client.name]))

  const rows = invoices.map((invoice) => [
    invoice.name,
    invoice.invoice_number ?? '',
    invoice.recipient ?? '',
    invoice.client_id ? (clientsById.get(invoice.client_id) ?? '') : '',
    invoice.billing_period ?? '',
    invoice.issue_date ?? invoice.invoice_date ?? '',
    Number(invoice.amount).toFixed(2),
    invoice.currency,
    invoice.is_paid ? 'tak' : 'nie',
    invoice.notes ?? invoice.note ?? '',
  ])

  const dataRows = rows.map((row) => row.map(escapeCsvValue).join(','))

  return `\uFEFF${CSV_HEADERS.join(',')}\n${dataRows.join('\n')}`
}

function parseInvoicesCsv(content: string): ImportInvoiceCsvRow[] {
  const lines = content
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  if (lines.length < 2) {
    throw new Error('Plik CSV nie zawiera danych do importu.')
  }

  const header = splitCsvLine(lines[0]).map((v) => v.toLowerCase())
  const expected = [...CSV_HEADERS]

  if (header.length !== expected.length || !expected.every((value, i) => header[i] === value)) {
    throw new Error(`Nieprawidłowy nagłówek CSV. Oczekiwane kolumny: ${expected.join(', ')}`)
  }

  return lines.slice(1).map((line, index) => {
    const [
      name,
      invoice_number,
      recipient,
      client_name,
      billing_period,
      invoice_date,
      amount,
      currencyRaw,
      is_paid,
      notes,
    ] = splitCsvLine(line)

    if (!name?.trim()) {
      throw new Error(`Wiersz ${index + 2}: kolumna "nazwa_faktury" jest wymagana.`)
    }

    if (!invoice_date?.trim()) {
      throw new Error(`Wiersz ${index + 2}: kolumna "data_faktury" jest wymagana.`)
    }

    const parsedAmount = Number(amount)
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      throw new Error(`Wiersz ${index + 2}: kolumna "kwota" musi być liczbą większą od 0.`)
    }

    const currency = currencyRaw?.trim().toUpperCase()
    if (!currency || !ACCEPTED_CURRENCIES.has(currency)) {
      throw new Error(`Wiersz ${index + 2}: kolumna "waluta" musi mieć wartość PLN lub EUR.`)
    }

    return {
      name: name.trim(),
      invoice_number: invoice_number?.trim() ?? '',
      recipient: recipient?.trim() ?? '',
      client_name: client_name?.trim() ?? '',
      billing_period: billing_period?.trim() ?? '',
      invoice_date: invoice_date.trim(),
      amount: Number(parsedAmount.toFixed(2)),
      currency: currency as 'PLN' | 'EUR',
      is_paid: normalizeBoolean(is_paid ?? ''),
      notes: notes?.trim() ?? '',
    }
  })
}

function downloadBlob(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

interface UseInvoiceAccountingCsvOptions {
  invoices: Invoice[]
  clients: Client[]
}

export function useInvoiceAccountingCsv({
  invoices,
  clients,
}: UseInvoiceAccountingCsvOptions) {
  const queryClient = useQueryClient()

  const exportFilename = useMemo(
    () => `faktury_ksiegowosc_${new Date().toISOString().slice(0, 10)}.csv`,
    []
  )

  const exportAccountingCsv = useCallback(() => {
    const csv = rowsToCsv(invoices, clients)
    downloadBlob(csv, exportFilename)
    toast.success('Wyeksportowano plik księgowy CSV')
  }, [clients, exportFilename, invoices])

  const importAccountingCsv = useCallback(async (file: File) => {
    const raw = await file.text()
    const rows = parseInvoicesCsv(raw)

    await importInvoicesFromCsv(rows)
    await queryClient.invalidateQueries({ queryKey: INVOICES_MANAGER_QUERY_KEY })

    toast.success(`Zaimportowano ${rows.length} faktur`)
  }, [queryClient])

  return {
    exportAccountingCsv,
    importAccountingCsv,
  }
}
