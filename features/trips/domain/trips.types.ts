/**
 * Mateusz pracuje w cyklach wyjazdowych (np. 3 tygodnie w Niemczech, ~2
 * tygodnie w Polsce). Ten moduł modeluje pojedynczy wyjazd i wyliczone na
 * jego podstawie odliczanie: ile dni zostało do powrotu, albo — jeśli jest
 * w domu — ile dni do następnego wyjazdu.
 */

export interface Trip {
  id: string
  /** Pierwszy dzień wyjazdu w formacie YYYY-MM-DD (włącznie). */
  startDate: string
  /** Ostatni dzień wyjazdu w formacie YYYY-MM-DD (włącznie). */
  endDate: string
  /** Opcjonalna etykieta, np. "Niemcy — projekt Berlin". */
  destination?: string
}

export type TripCountdownMode = 'away' | 'home' | 'no_trips'

export interface TripCountdownState {
  /** Tryb licznika — czy aktualnie jesteśmy w trasie, czy w domu. */
  mode: TripCountdownMode
  /** Ile dni do osiągnięcia celu (zaokrąglone do pełnych dób). */
  days: number
  /** Data celu w formacie YYYY-MM-DD (powrót do domu lub kolejny wyjazd). */
  targetDate: string | null
  /** Wyjazd, którego dotyczy odliczanie (current dla `away`, next dla `home`). */
  trip: Trip | null
}
