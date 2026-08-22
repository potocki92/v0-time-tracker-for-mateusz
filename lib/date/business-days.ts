/**
 * Dni robocze w zakresie — podstawa celu godzinowego na pulpicie.
 *
 * Karta Godziny brała cel z mapy `range -> liczba`, więc luty i lipiec miały
 * ten sam cel 160 h, a trwający tydzień pełne 40 h już w poniedziałek.
 * Tu cel wynika z kalendarza: liczba dni pon–pt w zakresie × norma dobowa.
 *
 * Świąt nie znamy (nie ma ich w modelu danych), więc liczą się jako robocze —
 * lepszy jest cel zawyżony o dzień niż stała oderwana od długości miesiąca.
 */

/** Norma dobowa w godzinach — 1/5 etatu 40 h. */
export const HOURS_PER_WORKDAY = 8

export function countBusinessDays(from: Date, to: Date): number {
  const cursor = new Date(from.getFullYear(), from.getMonth(), from.getDate())
  const end = new Date(to.getFullYear(), to.getMonth(), to.getDate())
  let days = 0
  while (cursor <= end) {
    const dow = cursor.getDay()
    if (dow !== 0 && dow !== 6) days += 1
    cursor.setDate(cursor.getDate() + 1)
  }
  return days
}

/**
 * Cel godzinowy zakresu. `null` w granicach (zakres „wszystko") oznacza brak
 * sensownego celu — wtedy karta chowa pasek postępu zamiast dzielić przez zero.
 */
export function targetHoursForRange(
  from: Date | null,
  to: Date | null,
): number | null {
  if (!from || !to) return null
  return countBusinessDays(from, to) * HOURS_PER_WORKDAY
}
