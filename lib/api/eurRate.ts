export async function fetchCurrentEurRate(): Promise<number | null> {
  try {
    const res = await fetch(
      'https://api.nbp.pl/api/exchangerates/rates/A/EUR/?format=json',
      { cache: 'no-store' }
    )

    if (!res.ok) return null

    const data = await res.json()

    return data?.rates?.[0]?.mid ?? null
  } catch (err) {
    console.error('EUR rate fetch error:', err)
    return null
  }
}