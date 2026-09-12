import { describe, expect, it } from 'vitest'
import { buildStatementModel } from '@/features/accounting/domain'
import type {
  AccountingDataset,
  StatementClientRef,
  StatementEntryRow,
  StatementInvoiceRow,
  StatementProjectRef,
} from '@/features/accounting/domain'

const TODAY = '2026-03-01'
const RANGE = { start: '2025-01-01', end: '2025-12-31' }

const client = (over: Partial<StatementClientRef> = {}): StatementClientRef => ({
  id: 'c1',
  name: 'Ignor Bau GmbH',
  nip: 'DE123456789',
  address: 'Hans-Boeckler-Str. 284',
  city: 'Koeln',
  postal_code: '50354',
  country_code: 'DE',
  ...over,
})

const project = (over: Partial<StatementProjectRef> = {}): StatementProjectRef => ({
  id: 'p1',
  name: 'Rohbau Koeln',
  client_id: 'c1',
  address: 'Im Winkel 51, 50354 Koeln',
  ...over,
})

const invoice = (over: Partial<StatementInvoiceRow> = {}): StatementInvoiceRow => ({
  id: 'i1',
  client_id: 'c1',
  invoice_number: 'FV/A/2025/03/1',
  recipient: null,
  description: 'Prace budowlane',
  issue_date: null,
  invoice_date: '2025-03-31',
  due_date: '2025-04-07',
  period_start: '2025-03-01',
  period_end: '2025-03-31',
  amount: 1230,
  net_amount: 1000,
  vat_amount: 230,
  gross_amount: 1230,
  currency: 'EUR',
  is_paid: true,
  paid_date: '2025-04-03',
  status: 'PAID',
  ...over,
})

const entry = (over: Partial<StatementEntryRow> = {}): StatementEntryRow => ({
  id: 'e1',
  client_id: 'c1',
  project_id: 'p1',
  date: '2025-03-10',
  status: 'worked',
  entry_kind: 'real',
  hours: 8,
  ...over,
})

const dataset = (over: Partial<AccountingDataset> = {}): AccountingDataset => ({
  range: RANGE,
  workWindow: RANGE,
  invoices: [invoice()],
  entries: [entry()],
  clients: [client()],
  projects: [project()],
  ...over,
})

describe('wykaz — zakres i kwalifikacja faktur', () => {
  it('bierze faktury po dacie EFEKTYWNEJ, takze z legacy `issue_date`', () => {
    const model = buildStatementModel(
      dataset({
        invoices: [
          invoice({ id: 'legacy', invoice_date: null, issue_date: '2025-06-30' }),
          invoice({ id: 'poza', invoice_date: '2026-01-05' }),
        ],
      }),
      TODAY,
    )

    expect(model.rows.map((row) => row.id)).toEqual(['legacy'])
  })

  it('pomija dokumenty bez numeru, ale je zlicza — numeracja ma sie zgadzac', () => {
    const model = buildStatementModel(
      dataset({
        invoices: [
          invoice(),
          // Bez numeru nie ma czego wpisac do rejestru — takze wtedy, gdy ktos
          // zdazyl oznaczyc szkic jako oplacony.
          invoice({ id: 'szkic', invoice_number: null, status: null }),
          invoice({ id: 'jawny-szkic', invoice_number: 'FV/X', status: 'DRAFT' }),
        ],
      }),
      TODAY,
    )

    expect(model.rows.map((row) => row.id)).toEqual(['i1'])
    expect(model.draftCount).toBe(2)
  })

  it('faktura anulowana ZOSTAJE w rejestrze — bez niej w numeracji jest dziura', () => {
    const model = buildStatementModel(
      dataset({ invoices: [invoice({ status: 'CANCELLED', is_paid: false, paid_date: null })] }),
      TODAY,
    )

    expect(model.rows).toHaveLength(1)
    expect(model.rows[0].status).toBe('CANCELLED')
  })

  it('sortuje chronologicznie po dacie wystawienia, potem po numerze', () => {
    const model = buildStatementModel(
      dataset({
        invoices: [
          invoice({ id: 'c', invoice_date: '2025-05-31', invoice_number: 'FV/2' }),
          invoice({ id: 'a', invoice_date: '2025-04-30', invoice_number: 'FV/9' }),
          invoice({ id: 'b', invoice_date: '2025-05-31', invoice_number: 'FV/1' }),
        ],
      }),
      TODAY,
    )

    expect(model.rows.map((row) => row.id)).toEqual(['a', 'b', 'c'])
  })
})

describe('wykaz — kwoty', () => {
  it('netto + VAT zawsze skladaja sie na brutto', () => {
    const model = buildStatementModel(dataset(), TODAY)
    const [row] = model.rows

    expect(row.netMinor).toBe(100_000)
    expect(row.vatMinor).toBe(23_000)
    expect(row.grossMinor).toBe(123_000)
    expect(row.netMinor + row.vatMinor).toBe(row.grossMinor)
  })

  it('faktura sprzed rozbicia VAT bierze brutto z `amount`, a VAT wychodzi zerowy', () => {
    const model = buildStatementModel(
      dataset({
        invoices: [
          invoice({ net_amount: null, vat_amount: null, gross_amount: null, amount: 950 }),
        ],
      }),
      TODAY,
    )
    const [row] = model.rows

    expect(row.grossMinor).toBe(95_000)
    expect(row.netMinor).toBe(95_000)
    expect(row.vatMinor).toBe(0)
  })

  it('waluty sumuja sie OSOBNO — kwota po przeliczeniu nie istnieje w zadnej ksiedze', () => {
    const model = buildStatementModel(
      dataset({
        invoices: [
          invoice({ id: 'eur', currency: 'EUR' }),
          invoice({
            id: 'pln',
            currency: 'PLN',
            invoice_number: 'FV/A/2025/04/1',
            invoice_date: '2025-04-30',
            net_amount: 500,
            vat_amount: 115,
            gross_amount: 615,
            amount: 615,
          }),
        ],
      }),
      TODAY,
    )

    expect(model.totals.map((total) => total.currency)).toEqual(['EUR', 'PLN'])
    expect(model.totals.find((total) => total.currency === 'PLN')?.grossMinor).toBe(61_500)
  })

  it('dzieli brutto na zaplacone i niezaplacone, pomijajac anulowane', () => {
    const model = buildStatementModel(
      dataset({
        invoices: [
          invoice({ id: 'paid' }),
          invoice({
            id: 'open',
            invoice_number: 'FV/2',
            status: 'SENT',
            is_paid: false,
            paid_date: null,
            due_date: '2026-12-31',
          }),
          invoice({
            id: 'void',
            invoice_number: 'FV/3',
            status: 'CANCELLED',
            is_paid: false,
            paid_date: null,
          }),
        ],
      }),
      TODAY,
    )

    const [total] = model.totals
    expect(total.paidGrossMinor).toBe(123_000)
    expect(total.unpaidGrossMinor).toBe(123_000)
    expect(total.invoiceCount).toBe(3)
  })

  it('sumy kwartalne ida za data wystawienia i waluta', () => {
    const model = buildStatementModel(
      dataset({
        invoices: [
          invoice({ id: 'q1', invoice_date: '2025-03-31' }),
          invoice({ id: 'q2', invoice_date: '2025-04-30', invoice_number: 'FV/2' }),
        ],
      }),
      TODAY,
    )

    expect(model.quarters.map((quarter) => quarter.key)).toEqual(['2025-Q1', '2025-Q2'])
  })
})

describe('wykaz — „gdzie" i „dla kogo"', () => {
  it('miejsce wykonania bierze sie z adresu projektu wpisow w OKRESIE USLUGI', () => {
    const model = buildStatementModel(
      dataset({
        entries: [
          entry({ id: 'in', date: '2025-03-10' }),
          entry({ id: 'in2', date: '2025-03-11' }),
          // Poza okresem uslugi tej faktury — nie moze do niej wejsc.
          entry({ id: 'out', date: '2025-04-02' }),
        ],
      }),
      TODAY,
    )
    const [row] = model.rows

    expect(row.worksites).toHaveLength(1)
    expect(row.worksites[0]).toMatchObject({
      location: 'Im Winkel 51, 50354 Koeln',
      from: '2025-03-10',
      to: '2025-03-11',
      workedDays: 2,
      hours: 16,
    })
  })

  it('dni pracy faktury licza ROZNE dni — ten sam dzien w dwoch projektach to jeden dzien', () => {
    const model = buildStatementModel(
      dataset({
        projects: [project(), project({ id: 'p2', name: 'Zweite Baustelle', address: 'Gustavsburger 25' })],
        entries: [
          entry({ id: 'a', project_id: 'p1', date: '2025-03-10', hours: 4 }),
          entry({ id: 'b', project_id: 'p2', date: '2025-03-10', hours: 4 }),
        ],
      }),
      TODAY,
    )
    const [row] = model.rows

    expect(row.worksites).toHaveLength(2)
    expect(row.worksites.reduce((sum, site) => sum + site.workedDays, 0)).toBe(2)
    expect(row.workedDays).toBe(1)
    expect(row.hours).toBe(8)
  })

  it('plan i nieobecnosci nie wskazuja miejsca pracy', () => {
    const model = buildStatementModel(
      dataset({
        entries: [
          entry({ id: 'plan', entry_kind: 'predicted' }),
          entry({ id: 'urlop', status: 'vacation', date: '2025-03-12' }),
        ],
      }),
      TODAY,
    )

    expect(model.rows[0].worksites).toEqual([])
    expect(model.missingLocationCount).toBe(1)
  })

  it('praca innego klienta nie trafia na te fakture', () => {
    const model = buildStatementModel(
      dataset({ entries: [entry({ client_id: 'inny-klient' })] }),
      TODAY,
    )

    expect(model.rows[0].worksites).toEqual([])
  })

  it('projekt bez adresu nie gubi godzin — zostaje z `location: null`', () => {
    const model = buildStatementModel(
      dataset({ projects: [project({ address: null })] }),
      TODAY,
    )
    const [worksite] = model.rows[0].worksites

    expect(worksite.location).toBeNull()
    expect(worksite.projectName).toBe('Rohbau Koeln')
    expect(worksite.hours).toBe(8)
  })

  it('faktura bez okresu uslugi pokazuje luke zamiast podstawiac date wystawienia', () => {
    const model = buildStatementModel(
      dataset({ invoices: [invoice({ period_start: null, period_end: null })] }),
      TODAY,
    )

    expect(model.rows[0].period).toBeNull()
    expect(model.rows[0].worksites).toEqual([])
    expect(model.missingPeriodCount).toBe(1)
  })

  it('nabywca laczy nazwe z faktury z blokiem adresowym klienta', () => {
    const model = buildStatementModel(
      dataset({ invoices: [invoice({ recipient: 'Ignor Bau GmbH & Co. KG' })] }),
      TODAY,
    )

    expect(model.rows[0].party).toEqual({
      name: 'Ignor Bau GmbH & Co. KG',
      address: 'Hans-Boeckler-Str. 284',
      postalCode: '50354',
      city: 'Koeln',
      countryCode: 'DE',
      taxId: 'DE123456789',
    })
  })
})

describe('wykaz — statusy zaleza od „dzis"', () => {
  it('faktura wystawiona po terminie platnosci staje sie zalegla', () => {
    const overdue = invoice({
      status: 'SENT',
      is_paid: false,
      paid_date: null,
      due_date: '2025-04-07',
    })

    expect(buildStatementModel(dataset({ invoices: [overdue] }), '2025-04-01').rows[0].status).toBe(
      'SENT',
    )
    expect(buildStatementModel(dataset({ invoices: [overdue] }), '2025-04-08').rows[0].status).toBe(
      'OVERDUE',
    )
  })
})
