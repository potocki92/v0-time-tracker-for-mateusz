import { NextResponse } from 'next/server'
import { getDashboardDataServer } from '@/features/dashboard/server'

/**
 * Sciezka odczytu dashboardu dla React Query.
 *
 * Wczesniej `queryFn` wskazywal na Server Action. Server Actions sa w Next
 * serializowane (jedna na raz) i kazda odpowiedz niesie przerenderowany
 * payload RSC calej biezacej trasy — czyli za "podaj mi dane" placilismy
 * pelnym re-renderem serwerowym. GET route handler robi dokladnie to,
 * o co chodzi, i nic ponadto.
 *
 * Scoping po uzytkowniku robi RLS; `no-store` bo dane sa per-sesja.
 */
export async function GET() {
  try {
    const data = await getDashboardDataServer()
    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'private, no-store' },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    const status = message.includes('not authenticated') ? 401 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
