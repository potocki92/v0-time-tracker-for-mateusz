import { createHash, timingSafeEqual } from 'node:crypto'
import { NextResponse, type NextRequest } from 'next/server'

import { runWorkAutomation } from '@/features/work-automation/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Automatyczne zapisywanie przepracowanych dni.
 *
 * Wola to Supabase Cron (job `work-automation-minute-tick`, migracja
 * `20260912140000_work_automation_supabase_cron.sql`) CO MINUTE, z naglowkiem
 * `Authorization: Bearer $CRON_SECRET`. GitHub Actions
 * (`.github/workflows/work-automation.yml`) zostalo wylacznie jako RECZNY
 * fallback diagnostyczny — nie ma juz harmonogramu.
 *
 * Bez sesji uzytkownika, wiec pracujemy klientem service-role — kazde zapytanie
 * filtruje po `user_id`.
 *
 * Wywolanie co minute NIE znaczy „zapis co minute": to logika w
 * `features/work-automation/` wybiera daty, dla ktorych godzina zapisu zostala
 * osiagnieta, a decyzji jeszcze nie ma. Zapis nigdy nie nastepuje przed
 * ustawiona godzina, a dzien raz rozstrzygniety nie wraca do rozpatrzenia.
 * Wiekszosc przebiegow nie robi wiec nic — i tak ma byc.
 */

export const runtime = 'nodejs'

/** Raport przebiegu jest jednorazowy — nic z tego nie moze wpasc do cache. */
function json(body: Record<string, unknown>, status = 200) {
  return NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } })
}

/**
 * Porownanie odporne na pomiar czasu. Zwykle `===` konczy sie na pierwszym
 * roznym znaku, co przy 1440 probach na dobe daje atakujacemu kanal do
 * zgadywania sekretu znak po znaku. Dlugosc wyrownujemy haszem, bo
 * `timingSafeEqual` rzuca na buforach roznej dlugosci — a sama dlugosc sekretu
 * tez nie ma wyciekac.
 */
function secretMatches(provided: string, expected: string): boolean {
  const digest = (value: string) => createHash('sha256').update(value, 'utf8').digest()
  return timingSafeEqual(digest(provided), digest(expected))
}

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET?.trim()
  if (!secret) return false

  const header = request.headers.get('authorization')
  if (!header) return false

  return secretMatches(header, `Bearer ${secret}`)
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    // Jedna odpowiedz na bledny i brakujacy sekret — zadnej wskazowki, co bylo nie tak.
    return json({ error: 'Unauthorized' }, 401)
  }

  const startedAt = Date.now()

  try {
    const summary = await runWorkAutomation(createAdminClient())

    // Scheduler chodzi co minute, wiec log z KAZDEGO przebiegu bylby szumem
    // (~1440 linii na dobe bez zadnej tresci). Piszemy tylko wtedy, gdy
    // faktycznie cos sie stalo — reszta przebiegow jest widoczna w
    // `cron.job_run_details` i `net._http_response` po stronie bazy.
    if (summary.created > 0 || summary.failed > 0) {
      console.info('[work-automation] przebieg', {
        processed: summary.processed,
        created: summary.created,
        skipped: summary.skipped,
        failed: summary.failed,
        durationMs: Date.now() - startedAt,
      })
    }

    return json({ ...summary })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('[work-automation] przebieg przerwany', message)
    return json({ error: message }, 500)
  }
}
