import { NextResponse, type NextRequest } from 'next/server'

import { runWorkAutomation } from '@/features/work-automation/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Automatyczne zapisywanie przepracowanych dni.
 *
 * Wola to GitHub Actions (`.github/workflows/work-automation.yml`) co godzine,
 * z naglowkiem `Authorization: Bearer $CRON_SECRET`. Bez sesji uzytkownika,
 * wiec pracujemy klientem service-role — kazde zapytanie filtruje po `user_id`.
 *
 * Zadanie nie musi trafic w konkretna minute: samo wybiera daty, dla ktorych
 * godzina zapisu zostala osiagnieta, a decyzji jeszcze nie ma. Zapis nigdy nie
 * nastepuje przed ustawiona godzina, wiec opoznienie przebiegu przesuwa go
 * pozniej, a nie na zly dzien.
 */

export const runtime = 'nodejs'

/** Raport przebiegu jest jednorazowy — nic z tego nie moze wpasc do cache. */
function json(body: Record<string, unknown>, status = 200) {
  return NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } })
}

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET?.trim()
  if (!secret) return false
  return request.headers.get('authorization') === `Bearer ${secret}`
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return json({ error: 'Unauthorized' }, 401)
  }

  try {
    const summary = await runWorkAutomation(createAdminClient())
    return json({ ...summary })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('[work-automation] przebieg przerwany', message)
    return json({ error: message }, 500)
  }
}
