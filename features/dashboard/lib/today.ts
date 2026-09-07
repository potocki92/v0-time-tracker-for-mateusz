import { DAILY_NORM_HOURS, defaultMetricsSettings, toMetricsInput } from '@/lib/metrics/adapter'
import { computeMonthMetrics } from '@/lib/metrics/computeMonthMetrics'
import type { IsoDate } from '@/lib/metrics/types'
import type { Client, WorkEntry } from '@/lib/types'

export interface TodayGlance {
  /** Godziny zarejestrowane na dzis — 0, gdy nie ma wpisu. */
  hours: number
  /** Norma dobowa, czyli ile proponuje przycisk „Dodaj dzis". */
  normHours: number
  /** Klient oznaczony jako domyslny — cel akcji glownej. */
  defaultClientName: string | null
}

/**
 * „Co z dzisiaj" liczone tym samym silnikiem, co reszta metryk — okno
 * jednodniowe zamiast miesiaca. Hero nie liczy nic samo: sumowanie godzin
 * na piechote rozjechaloby sie z Kalendarzem przy pierwszym wpisie akordowym
 * albo zaplanowanym na przyszlosc.
 */
export function computeTodayGlance({
  workEntries,
  clients,
  eurRate,
  todayIso,
}: {
  workEntries: WorkEntry[]
  clients: Client[]
  eurRate: number
  todayIso: IsoDate
}): TodayGlance {
  const metrics = computeMonthMetrics(
    toMetricsInput({
      period: { from: todayIso, to: todayIso, label: todayIso },
      today: todayIso,
      workEntries,
      clients,
      settings: defaultMetricsSettings(eurRate),
    }),
  )

  return {
    hours: metrics.hours.actual,
    normHours: DAILY_NORM_HOURS,
    defaultClientName: clients.find((client) => client.is_default)?.name ?? null,
  }
}
