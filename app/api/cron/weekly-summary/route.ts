import { NextResponse, type NextRequest } from 'next/server'
import { renderWeeklySummaryEmail } from '@/features/dashboard/server'
import { sendMail } from '@/lib/email/mailer'
import { isSentForWeek, type WeeklySummaryEmailRow } from '@/lib/email/weekly-summary-dispatch'
import { createAdminClient } from '@/lib/supabase/admin'
import { DEFAULT_LOCALE, isAppLocale, type AppLocale } from '@/i18n/config'

/**
 * Cotygodniowa wysylka skrotu dla ksiegowej.
 *
 * Wola to GitHub Actions (`.github/workflows/weekly-summary.yml`) w sobote,
 * z naglowkiem `Authorization: Bearer $CRON_SECRET`. Bez sesji uzytkownika,
 * wiec czytamy klientem service-role — kazde zapytanie filtruje po `user_id`.
 *
 * Tydzien bez przepracowanych dni nie generuje maila, a `last_sent_week_*`
 * pilnuje, zeby reczne uruchomienie workflow nie wyslalo dubla.
 */

// nodemailer to modul Node — runtime edge nie ma tu czego szukac.
export const runtime = 'nodejs'

/** Sufit jednego przebiegu; przy jednym uzytkowniku czysta formalnosc. */
const MAX_RECIPIENTS = 200

/** Raport przebiegu jest jednorazowy — nic z tego nie moze wpasc do cache. */
function json(body: Record<string, unknown>, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { 'Cache-Control': 'no-store' },
  })
}

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET?.trim()
  if (!secret) return false
  return request.headers.get('authorization') === `Bearer ${secret}`
}

/**
 * Jezyk interfejsu wlasciciela konta. Brak preferencji albo blad odczytu
 * oznacza jezyk bazowy — mail ma wyjsc, nawet gdy metadanych nie da sie
 * przeczytac.
 */
async function ownerLocale(
  supabase: ReturnType<typeof createAdminClient>,
  userId: string,
): Promise<AppLocale> {
  try {
    const { data } = await supabase.auth.admin.getUserById(userId)
    const preferred = data?.user?.user_metadata?.preferred_locale
    return isAppLocale(preferred) ? preferred : DEFAULT_LOCALE
  } catch {
    return DEFAULT_LOCALE
  }
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return json({ error: 'Unauthorized' }, 401)
  }

  try {
    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('weekly_summary_email_settings')
      .select('user_id, recipient_email, last_sent_week_year, last_sent_week_number')
      .eq('enabled', true)
      .not('recipient_email', 'is', null)
      .limit(MAX_RECIPIENTS)

    if (error) throw new Error(error.message)

    const rows = (data ?? []) as WeeklySummaryEmailRow[]
    const errors: string[] = []
    let sent = 0
    let skipped = 0

    for (const row of rows) {
      try {
        // Jezyk maila = `preferred_locale` WLASCICIELA konta. Cron nie ma
        // requestu uzytkownika, wiec czyta go wprost z Auth Admin API.
        const email = await renderWeeklySummaryEmail(
          supabase,
          row.user_id,
          await ownerLocale(supabase, row.user_id),
        )

        if (email.isEmpty || isSentForWeek(row, email.weekYear, email.weekNumber)) {
          skipped++
          continue
        }

        await sendMail({
          to: row.recipient_email as string,
          subject: email.subject,
          text: email.text,
        })

        const { error: stampError } = await supabase
          .from('weekly_summary_email_settings')
          .update({
            last_sent_week_year: email.weekYear,
            last_sent_week_number: email.weekNumber,
            last_sent_at: new Date().toISOString(),
          })
          .eq('user_id', row.user_id)

        if (stampError) throw new Error(stampError.message)
        sent++
      } catch (userError) {
        const message = userError instanceof Error ? userError.message : 'Unknown error'
        console.error('[weekly-summary] wysylka nieudana', row.user_id, message)
        errors.push(`${row.user_id}: ${message}`)
      }
    }

    return json({ sent, skipped, failed: errors.length, errors })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('[weekly-summary] przebieg przerwany', message)
    return json({ error: message }, 500)
  }
}
