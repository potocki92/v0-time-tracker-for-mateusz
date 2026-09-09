/**
 * Kontrakt bledow miedzy Server Action a interfejsem.
 *
 * Warstwa serwerowa NIE zna jezyka uzytkownika i nie ma prawa produkowac
 * zdan — zwraca STABILNY KOD (`WEEKLY_SUMMARY_NO_RECIPIENT`), a interfejs
 * zamienia go na tekst przez `messages/<locale>/errors.json`. Dzieki temu
 * niemieckie UI nigdy nie pokaze polskiego komunikatu.
 *
 * Wynik jest ZWRACANY, a nie rzucany: Next.js w produkcji zaciera tresc
 * wyjatku z Server Action (slusznie — moglaby wyciec sciezka albo zapytanie
 * SQL), wiec kod bledu przeniesiony w `Error.message` nie dotarlby do
 * przegladarki. Zwykla wartosc zwrotna przechodzi zawsze.
 */

export interface ActionError {
  /** Klucz w `messages/<locale>/errors.json`. */
  code: string
  /** Parametry komunikatu ICU, jesli klucz ich uzywa. */
  values?: Record<string, string | number>
}

export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: ActionError }

export function ok<T>(data: T): ActionResult<T> {
  return { ok: true, data }
}

export function fail(code: string, values?: ActionError['values']): ActionResult<never> {
  return { ok: false, error: { code, values } }
}

/**
 * Rzuca bledem, ktorego `message` jest KODEM — do uzycia w warstwie
 * klienckiej (React Query), zeby `onError` mial jedno zrodlo prawdy.
 */
export class ActionFailure extends Error {
  constructor(readonly error: ActionError) {
    super(error.code)
    this.name = 'ActionFailure'
  }
}

/** Rozpakowuje `ActionResult` w mutacji React Query. */
export function unwrap<T>(result: ActionResult<T>): T {
  if (!result.ok) throw new ActionFailure(result.error)
  return result.data
}

/** Kod bledu do przetlumaczenia; nieznany blad ma jeden, bezpieczny kod. */
export function errorCodeOf(error: unknown): ActionError {
  if (error instanceof ActionFailure) return error.error
  return { code: 'UNKNOWN' }
}
