import { describe, expect, it } from 'vitest'
import { buildStatementModel } from '@/features/accounting/domain'
import {
  builderValuesToFormValues,
  invoiceToBuilderValues,
} from '@/features/invoices/components/builder/form/invoice-builder.adapters'
import type {
  AccountingDataset,
  StatementInvoiceRow,
} from '@/features/accounting/domain'
import { invoiceBuilderSchema } from '@/lib/schemas/invoice-builder.schema'
import type { InvoiceBuilderValues } from '@/lib/schemas/invoice-builder.schema'
import type { InvoiceSettings } from '@/features/invoices/domain'
import type { Invoice } from '@/lib/types'

/**
 * Regresja: faktura tygodniowa gubila okres uslugi.
 *
 * `QuickWeeklyInvoiceDialog` wyliczal granice wybranych tygodni, ale zapisywal
 * je WYLACZNIE w tekscie `billing_period` ("TYGODNIE 2026-08-24 - 2026-08-30").
 * Kolumny `period_start`/`period_end` zostawaly puste, bo wypelniala je tylko
 * sciezka autofakturowania.
 *
 * Wykaz dla ksiegowej czyta te kolumny i nic wiecej, wiec faktura z komplet-
 * nym projektem, adresem i wpisami pracy pokazywala „Brak okresu na fakturze",
 * „Brak zarejestrowanej pracy w tym okresie" i 0 h.
 *
 * Test domyka petle w obie strony: z okresem miejsce pracy sie pojawia, bez
 * okresu odtwarza sie zgloszony blad.
 *
 * Druga odslona tego samego bledu: kreator faktur — glowna sciezka wystawiania
 * — w ogole NIE MIAL pola okresu uslugi, wiec kazda faktura z niego ladowala
 * z pustymi kolumnami. Backfill nie mial czego odzyskac, bo etykieta niosla
 * tylko kwartal ("Q2 2026") policzony z daty wystawienia. Dlatego ten plik
 * pilnuje takze kreatora: pola, walidacji zakresu i round-tripu przy edycji.
 */

const TODAY = '2026-09-12'
const RANGE = { start: '2026-01-01', end: '2026-12-31' }

/** Faktura tak, jak zapisuje ja naprawiona sciezka „z przepracowanych tygodni". */
const weeklyInvoice = (over: Partial<StatementInvoiceRow> = {}): StatementInvoiceRow => ({
  id: 'fr-6-08-2026',
  client_id: 'spaw-mont',
  invoice_number: 'FR 6/08/2026',
  recipient: 'SPAW-MONT Czernicki Łukasz',
  description: null,
  issue_date: null,
  invoice_date: '2026-08-28',
  due_date: null,
  period_start: '2026-08-24',
  period_end: '2026-08-30',
  amount: 4800,
  net_amount: 4800,
  vat_amount: 0,
  gross_amount: 4800,
  currency: 'PLN',
  is_paid: true,
  paid_date: '2026-09-05',
  status: 'PAID',
  ...over,
})

const dataset = (invoice: StatementInvoiceRow): AccountingDataset => ({
  range: RANGE,
  workWindow: RANGE,
  invoices: [invoice],
  entries: [
    { id: 'w1', client_id: 'spaw-mont', project_id: 'podgorzyn', date: '2026-08-24', status: 'worked', entry_kind: 'real', hours: 8 },
    { id: 'w2', client_id: 'spaw-mont', project_id: 'podgorzyn', date: '2026-08-25', status: 'worked', entry_kind: 'real', hours: 8 },
    { id: 'w3', client_id: 'spaw-mont', project_id: 'podgorzyn', date: '2026-08-28', status: 'worked', entry_kind: 'real', hours: 6 },
    // Poza okresem faktury — nie moze podniesc godzin ani rozciagnac pobytu.
    { id: 'w4', client_id: 'spaw-mont', project_id: 'podgorzyn', date: '2026-09-01', status: 'worked', entry_kind: 'real', hours: 8 },
  ],
  clients: [
    {
      id: 'spaw-mont',
      name: 'SPAW-MONT Czernicki Łukasz',
      nip: '6112794834',
      address: 'Dolina Czerwienia 1',
      city: 'Podgórzyn',
      postal_code: '58-562',
      country_code: 'PL',
    },
  ],
  projects: [
    {
      id: 'podgorzyn',
      name: 'Hala Podgórzyn',
      client_id: 'spaw-mont',
      address: 'Dolina Czerwienia 1, 58-562 Podgórzyn',
    },
  ],
})

describe('wykaz — faktura tygodniowa niesie okres uslugi', () => {
  it('z zapisanym okresem pokazuje adres projektu i godziny zamiast luki', () => {
    const model = buildStatementModel(dataset(weeklyInvoice()), TODAY)
    const [row] = model.rows

    expect(row.period).toEqual({ start: '2026-08-24', end: '2026-08-30' })
    expect(row.worksites).toHaveLength(1)
    expect(row.worksites[0]).toMatchObject({
      projectName: 'Hala Podgórzyn',
      location: 'Dolina Czerwienia 1, 58-562 Podgórzyn',
      from: '2026-08-24',
      to: '2026-08-28',
      workedDays: 3,
      hours: 22,
    })
    expect(row.workedDays).toBe(3)
    expect(row.hours).toBe(22)
    expect(model.missingPeriodCount).toBe(0)
    expect(model.missingLocationCount).toBe(0)
  })

  it('bez zapisanego okresu odtwarza zgloszony blad — te same dane, pusty wykaz', () => {
    const model = buildStatementModel(
      dataset(weeklyInvoice({ period_start: null, period_end: null })),
      TODAY,
    )
    const [row] = model.rows

    expect(row.period).toBeNull()
    expect(row.worksites).toEqual([])
    expect(row.hours).toBe(0)
    expect(model.missingPeriodCount).toBe(1)
    expect(model.missingLocationCount).toBe(1)
  })
})

describe('kreator faktur — niesie okres uslugi we wlasnym polu', () => {
  const settings = { defaultTemplate: 'classic' } as InvoiceSettings

  const builderValues = (
    over: Partial<InvoiceBuilderValues> = {},
  ): InvoiceBuilderValues =>
    ({
      invoice_number: 'FR 7/09/2026',
      issue_date: '2026-09-12',
      period_start: '',
      period_end: '',
      currency: 'PLN',
      buyer: { name: 'SPAW-MONT Czernicki Łukasz' },
      items: [],
      notes: '',
      ...over,
    }) as unknown as InvoiceBuilderValues

  it('przepisuje wypelniony okres do kolumn zapisu', () => {
    const values = builderValuesToFormValues(
      builderValues({ period_start: '2026-08-24', period_end: '2026-08-30' }),
      { settings },
    )

    expect(values.period_start).toBe('2026-08-24')
    expect(values.period_end).toBe('2026-08-30')
    // Etykieta kwartalu to nadal tylko opis na dokumencie.
    expect(values.billing_period).toBe('Q3 2026')
  })

  it('pusty okres zostaje `null` — data wystawienia nim nie jest', () => {
    const values = builderValuesToFormValues(builderValues(), { settings })

    expect(values.period_start).toBeNull()
    expect(values.period_end).toBeNull()
  })

  it('edycja faktury nie gubi okresu zapisanego w kolumnach', () => {
    const hydrated = invoiceToBuilderValues({
      id: 'fr-6-08-2026',
      invoice_number: 'FR 6/08/2026',
      invoice_date: '2026-08-28',
      period_start: '2026-08-24',
      period_end: '2026-08-30',
      currency: 'EUR',
      amount: 4800,
      net_amount: 4800,
      is_paid: true,
      billing_period: 'TYGODNIE 2026-08-24 - 2026-08-30',
      file_url: null,
      notes: null,
      created_at: '2026-08-28T00:00:00.000Z',
    } as unknown as Invoice)

    expect(hydrated.period_start).toBe('2026-08-24')
    expect(hydrated.period_end).toBe('2026-08-30')

    const values = builderValuesToFormValues(hydrated, { settings })
    expect(values.period_start).toBe('2026-08-24')
    expect(values.period_end).toBe('2026-08-30')
  })
})

describe('kreator faktur — walidacja okresu uslugi', () => {
  const parse = (over: Record<string, unknown>) =>
    invoiceBuilderSchema.safeParse({
      invoice_number: 'FR 7/09/2026',
      issue_date: '2026-09-12',
      sale_date: '2026-09-12',
      due_date: '2026-09-26',
      currency: 'PLN',
      buyer: { name: 'SPAW-MONT Czernicki Łukasz', country_code: 'PL' },
      items: [
        {
          id: 'li-1',
          description: 'Praca',
          unit: 'h',
          quantity: 1,
          unit_price_net: 100,
          vat_mode: 'standard',
          vat_rate: 23,
        },
      ],
      payment: { method: 'bank_transfer' },
      notes: '',
      ...over,
    })

  it('przepuszcza komplet granic', () => {
    expect(parse({ period_start: '2026-08-24', period_end: '2026-08-30' }).success).toBe(true)
  })

  it('przepuszcza brak okresu — nie kazda faktura jest za okres', () => {
    expect(parse({}).success).toBe(true)
  })

  it('odrzuca jedna granice — zakres bez konca nic nie znaczy', () => {
    expect(parse({ period_start: '2026-08-24' }).success).toBe(false)
    expect(parse({ period_end: '2026-08-30' }).success).toBe(false)
  })

  it('odrzuca odwrocona kolejnosc', () => {
    expect(parse({ period_start: '2026-08-30', period_end: '2026-08-24' }).success).toBe(false)
  })
})
