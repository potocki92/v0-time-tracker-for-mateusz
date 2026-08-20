/**
 * Klient dla route handlerow odczytu. Rzuca z zachowanym statusem, zeby
 * `retry` w Providers (`error.status >= 400 && < 500 → nie ponawiaj`) dzialal.
 */
export async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { credentials: 'same-origin' })
  if (!res.ok) {
    const error = new Error(`${url} → ${res.status}`) as Error & { status: number }
    error.status = res.status
    throw error
  }
  return res.json() as Promise<T>
}
