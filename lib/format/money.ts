import { NO_DATA, numberFormatter } from './intl'

/**
 * Formatowanie kwot.
 *
 * Wejściem są ZAWSZE grosze/centy (int). Funkcja przyjmująca float nie istnieje
 * celowo: 580000 * 3 to dokładnie 1740000, a 5800.00 * 3 to 17399.999999999998.
 * Konwersja na jednostkę główną dzieje się dopiero tutaj, tuż przed Intl.
 *
 * `null` to BRAK danych (NO_DATA), `0` to dana o wartości zero ("0,00 zł").
 */

/**
 * Waluty aplikacji to PLN i EUR; builder faktur dopuszcza dodatkowo USD i GBP,
 * więc kontrakt formatowania musi je unieść — inaczej wróciłby tam własny Intl.
 */
export type Currency = 'PLN' | 'EUR' | 'USD' | 'GBP'

/**
 * PLN pokazujemy symbolem ("zł"), pozostałe waluty kodem ("EUR"). Symbol € przy wąskich
 * kolumnach zlewa się z liczbą, a księgowa czyta faktury po kodzie waluty.
 *
 * `useGrouping: 'always'`, bo pl-PL domyślnie NIE grupuje czterocyfrowych
 * kwot — "4229,31 EUR" obok "18 200,00 zł" wyglądało jak dwie różne aplikacje.
 */
function currencyOptions(currency: Currency): Intl.NumberFormatOptions {
  return {
    style: 'currency',
    currency,
    currencyDisplay: currency === 'PLN' ? 'symbol' : 'code',
    useGrouping: 'always',
  }
}

const TWO_DECIMALS = { minimumFractionDigits: 2, maximumFractionDigits: 2 } as const

const toMajor = (minor: number) => minor / 100

/**
 * Most dla pipeline'ów, które wciąż liczą w jednostkach głównych (float) —
 * `lib/finance/totals`, `calculateEarnings`, faktury. NIE jest formatterem:
 * zwraca liczbę, żeby `formatMoney` dostał grosze i żeby konwersja siedziała
 * w JEDNYM miejscu, a nie w dwudziestu komponentach. Docelowo znika razem
 * z przejściem tych pipeline'ów na grosze.
 */
export function toMinor(amountMajor: number | null | undefined): number | null {
  if (amountMajor === null || amountMajor === undefined || !Number.isFinite(amountMajor)) {
    return null
  }
  return Math.round(amountMajor * 100)
}

function isMissing(minor: number | null | undefined): minor is null | undefined {
  return minor === null || minor === undefined || !Number.isFinite(minor)
}

export function formatMoney(minor: number | null | undefined, currency: Currency): string {
  if (isMissing(minor)) return NO_DATA
  return numberFormatter({ ...currencyOptions(currency), ...TWO_DECIMALS }).format(
    toMajor(minor),
  )
}

/** Skrót do wykresów i wąskich kart: "18,2 tys. zł". */
export function formatMoneyCompact(
  minor: number | null | undefined,
  currency: Currency,
): string {
  if (isMissing(minor)) return NO_DATA
  return numberFormatter({
    ...currencyOptions(currency),
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(toMajor(minor))
}

/** Stawka godzinowa. Brak stawki to NO_DATA — nigdy "0,00 EUR/h". */
export function formatRate(
  minorPerHour: number | null | undefined,
  currency: Currency,
): string {
  const amount = formatMoney(minorPerHour, currency)
  return amount === NO_DATA ? NO_DATA : `${amount}/h`
}

/** Zmiana kwoty ze znakiem. Minus to U+2212 — dywiz jest za krótki obok cyfr. */
export function formatMoneyDelta(
  minor: number | null | undefined,
  currency: Currency,
): string {
  if (isMissing(minor)) return NO_DATA
  return numberFormatter({
    ...currencyOptions(currency),
    ...TWO_DECIMALS,
    signDisplay: 'exceptZero',
  })
    .format(toMajor(minor))
    .replace('-', '−')
}
