import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * Kontrakt endpointu `/api/cron/work-automation` — tego, ktory wola Supabase
 * Cron co minute.
 *
 * Liczy sie tu jedno: bez poprawnego sekretu nie ma przebiegu i nie ma zadnej
 * wskazowki, CO bylo nie tak. Sama logika automatu jest sprawdzana w
 * `runner.test.ts` i `scheduler.test.ts`, wiec runner jest tu zamockowany.
 */

const runWorkAutomation = vi.fn()
const createAdminClient = vi.fn(() => ({}))

vi.mock('@/features/work-automation/server', () => ({
  get runWorkAutomation() {
    return runWorkAutomation
  },
}))

vi.mock('@/lib/supabase/admin', () => ({
  get createAdminClient() {
    return createAdminClient
  },
}))

const SECRET = 'sekret-testowy-o-sensownej-dlugosci'

async function post(authorization?: string) {
  const { POST } = await import('@/app/api/cron/work-automation/route')
  const { NextRequest } = await import('next/server')

  const request = new NextRequest('https://example.test/api/cron/work-automation', {
    method: 'POST',
    headers: authorization ? { authorization } : undefined,
  })

  return POST(request)
}

describe('POST /api/cron/work-automation', () => {
  beforeEach(() => {
    vi.resetModules()
    runWorkAutomation.mockReset()
    runWorkAutomation.mockResolvedValue({
      processed: 1,
      created: 1,
      skipped: 0,
      failed: 0,
      errors: [],
    })
    process.env.CRON_SECRET = SECRET
  })

  afterEach(() => {
    delete process.env.CRON_SECRET
  })

  it('poprawny sekret uruchamia przebieg i zwraca podsumowanie', async () => {
    const response = await post(`Bearer ${SECRET}`)

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      processed: 1,
      created: 1,
      skipped: 0,
      failed: 0,
      errors: [],
    })
    expect(runWorkAutomation).toHaveBeenCalledTimes(1)
    // Raport przebiegu jest jednorazowy — nie ma prawa wpasc do cache.
    expect(response.headers.get('cache-control')).toBe('no-store')
  })

  it('bledny sekret daje 401 i nie rusza automatu', async () => {
    const response = await post('Bearer nie-ten-sekret')

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({ error: 'Unauthorized' })
    expect(runWorkAutomation).not.toHaveBeenCalled()
  })

  it('brak naglowka daje 401 nieodrozniamy od bledu sekretu', async () => {
    const withoutHeader = await post()
    const wrongSecret = await post('Bearer nie-ten-sekret')

    expect(withoutHeader.status).toBe(401)
    await expect(withoutHeader.json()).resolves.toEqual(await wrongSecret.json())
  })

  it('sekret bez prefiksu Bearer nie przechodzi', async () => {
    expect((await post(SECRET)).status).toBe(401)
  })

  it('brak CRON_SECRET po stronie aplikacji zamyka endpoint, nie otwiera go', async () => {
    delete process.env.CRON_SECRET

    expect((await post('Bearer ')).status).toBe(401)
    expect(runWorkAutomation).not.toHaveBeenCalled()
  })

  it('wyjatek runnera konczy sie kodem 500, bez szczegolow bezpieczenstwa', async () => {
    runWorkAutomation.mockRejectedValue(new Error('baza nie odpowiada'))
    const errorLog = vi.spyOn(console, 'error').mockImplementation(() => {})

    const response = await post(`Bearer ${SECRET}`)

    expect(response.status).toBe(500)
    await expect(response.json()).resolves.toEqual({ error: 'baza nie odpowiada' })

    // Log diagnostyczny nie moze zawierac sekretu.
    const logged = errorLog.mock.calls.flat().join(' ')
    expect(logged).not.toContain(SECRET)
    errorLog.mockRestore()
  })
})
