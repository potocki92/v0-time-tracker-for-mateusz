import { NextResponse } from 'next/server'
import {
  getAccountingDatasetServer,
  parseAccountingSearchParams,
} from '@/features/accounting/server'

/**
 * Sciezka odczytu wykazu dla ksiegowej — patrz `app/api/reports/route.ts`.
 *
 * Zakres i klient przychodza w query stringu, wiec zawezenie dzieje sie
 * w SQL, a nie w przegladarce. Scoping po uzytkowniku robi RLS;
 * `no-store`, bo dane sa per-sesja.
 */
export async function GET(request: Request) {
  const params = parseAccountingSearchParams(new URL(request.url).searchParams)
  if (!params) {
    return NextResponse.json({ error: 'INVALID_STATEMENT_RANGE' }, { status: 400 })
  }

  try {
    const data = await getAccountingDatasetServer(params)
    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'private, no-store' },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    const status = message.includes('not authenticated') ? 401 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
