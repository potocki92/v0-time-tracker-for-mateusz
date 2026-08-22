import { APP_LOCALE, NO_DATA, numberFormatter } from './intl'

/**
 * Formatowanie liczb bezwymiarowych: godzin, procentów i liczebników.
 *
 * `null` to BRAK danych (NO_DATA), `0` to dana o wartości zero ("0 h", "0%").
 */

/**
 * Godziny. Całkowite bez części dziesiętnej ("240 h"), niecałkowite z jedną
 * ("9,6 h"), separator dziesiętny to przecinek. Koniec z "240.0h" stojącym
 * obok "18 200,00 zł".
 */
export function formatHours(
  hours: number | null | undefined,
  opts: { decimals?: 0 | 1 } = {},
): string {
  if (hours === null || hours === undefined || !Number.isFinite(hours)) return NO_DATA
  const decimals = opts.decimals ?? (Number.isInteger(hours) ? 0 : 1)
  const value = numberFormatter({
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
    useGrouping: 'always',
  }).format(hours)
  return `${value} h`
}

/**
 * Procent postępu. Poniżej celu zaokrąglamy W DÓŁ: 0,996 to "99%", nie "100%".
 * Pasek pokazujący pełne 100% przed osiągnięciem celu jest po prostu nieprawdą.
 * Powyżej celu zaokrąglamy normalnie — 1,14 to "114%".
 *
 * `max` przycina wynik tam, gdzie UI nie ma czym pokazać nadwyżki (pasek postępu).
 */
export function formatPercent(
  ratio: number | null | undefined,
  opts: { max?: number } = {},
): string {
  if (ratio === null || ratio === undefined || !Number.isFinite(ratio)) return NO_DATA
  const raw = ratio < 1 ? Math.floor(ratio * 100) : Math.round(ratio * 100)
  const percent = opts.max === undefined ? raw : Math.min(raw, opts.max)
  return `${numberFormatter({ maximumFractionDigits: 0, useGrouping: 'always' }).format(percent)}%`
}

/** Zwykła liczba w polskiej notacji: ilości akordowe, sztuki, mnożniki. */
export function formatNumber(
  value: number | null | undefined,
  opts: { decimals?: number } = {},
): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return NO_DATA
  const decimals = opts.decimals ?? 0
  return numberFormatter({
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
    useGrouping: 'always',
  }).format(value)
}

const pluralRules = new Intl.PluralRules(APP_LOCALE)

/** pl ma trzy formy mnogie; `two`/`zero`/`other` nie występują dla liczb całkowitych. */
const PLURAL_FORM: Record<Intl.LDMLPluralRule, 0 | 1 | 2> = {
  one: 0,
  few: 1,
  many: 2,
  two: 1,
  zero: 2,
  other: 2,
}

/** Polska odmiana liczebnika: "1 dzień" / "2 dni" / "5 dni" / "22 dni". */
export function formatCount(count: number, forms: [string, string, string]): string {
  const value = numberFormatter({ maximumFractionDigits: 0, useGrouping: 'always' }).format(
    count,
  )
  return `${value} ${forms[PLURAL_FORM[pluralRules.select(count)]]}`
}
