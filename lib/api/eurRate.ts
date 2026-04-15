const NBP_URL = 'https://api.nbp.pl/api/exchangerates/rates/A/EUR/?format=json'
const FALLBACK_RATE = 4.3 // last-resort

interface NbpResponse {
  rates: Array<{ mid: number; effectiveDate: string }>
}

/**
 * Pobiera aktualny kurs EUR→PLN z NBP.
 * Cachowane na poziomie Next (ISR) — jedno wywołanie na godzinę per region.
 * W razie awarii API zwraca null (nie throwuje) — caller decyduje o fallbacku.
 */
export async function fetchCurrentEurRate(): Promise<number | null> {
  try {
    const res = await fetch(NBP_URL, {
      next: { revalidate: 3600, tags: ['eur-rate'] },
    })
    if (!res.ok) return null
    const data = (await res.json()) as NbpResponse
    return data.rates?.[0]?.mid ?? null
  } catch (err) {
    console.error('[eurRate] fetch failed:', err)
    return null
  }
}

export const EUR_RATE_FALLBACK = FALLBACK_RATE
