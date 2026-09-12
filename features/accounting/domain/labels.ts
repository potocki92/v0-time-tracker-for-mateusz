import type { InvoiceStatus } from '@/lib/finance/invoice-status'

/**
 * Etykiety DOKUMENTU — nie interfejsu.
 *
 * Wykaz jedzie do niemieckiej ksiegowej, a panel obsluguje sie po polsku, wiec
 * jezyk dokumentu jest osobna osia konfiguracji (patrz `docs/i18n.md`, sekcja
 * „Czego NIE wiazac z jezykiem UI"). Tresci mieszkaja w `messages/<locale>/
 * accounting.json` pod kluczem `document`; ten typ jest kontraktem miedzy tym
 * plikiem JSON a szablonami CSV/PDF.
 *
 * Zaden komunikat tutaj nie ma parametru ICU: dokument sklada zdania
 * z gotowych etykiet i sformatowanych liczb, wiec podstawianie nie jest
 * potrzebne, a plaski slownik da sie wczytac bez silnika tlumaczen.
 */
export type StatementDocumentLabels = {
  title: string
  subtitle: string
  range: string
  generatedAt: string
  client: string
  allClients: string
  /** Naglowki trzech sekcji dokumentu. */
  sections: {
    register: string
    locations: string
    totals: string
    quarters: string
  }
  columns: {
    invoiceNumber: string
    issueDate: string
    servicePeriod: string
    from: string
    to: string
    buyer: string
    buyerAddress: string
    taxId: string
    description: string
    location: string
    project: string
    workedDays: string
    hours: string
    net: string
    vat: string
    gross: string
    currency: string
    status: string
    paidDate: string
    invoiceCount: string
    quarter: string
  }
  status: Record<InvoiceStatus, string>
  /** Podstawiane tam, gdzie danych po prostu nie ma. Nigdy nie udaja wartosci. */
  placeholders: {
    noPeriod: string
    noLocation: string
    noProject: string
    noValue: string
  }
  totals: {
    row: string
    paid: string
    unpaid: string
  }
  /** Stopka metodologiczna — ksiegowa musi wiedziec, co dokladnie dostala. */
  notes: {
    method: string
    locations: string
    currencies: string
    missingPeriod: string
    missingLocation: string
    drafts: string
  }
  /** Baza nazwy pliku, bez rozszerzenia i bez dat. */
  fileName: string
}
