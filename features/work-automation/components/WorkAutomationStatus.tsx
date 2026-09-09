'use client'

import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useFormat } from '@/lib/format/client'
import { cn } from '@/lib/utils'

import {
  ERROR_REASON_LABELS,
  PRESENCE_LABELS,
  SKIP_REASON_LABELS,
  type AutomationOverview,
  type ErrorReason,
  type RunDecisionRecord,
  type SkipReason,
} from '../domain'

interface Props {
  overview: AutomationOverview
  isResuming: boolean
  onResume: (resumeDate: string) => void
}

function reasonLabel(record: RunDecisionRecord): string {
  if (record.outcome === 'created') return 'Zapisano'
  if (record.outcome === 'error') {
    return ERROR_REASON_LABELS[record.reason as ErrorReason] ?? 'Błąd wykonania'
  }
  return SKIP_REASON_LABELS[record.reason as SkipReason] ?? 'Pominięto'
}

/**
 * Stan automatu: co zrobi najblizszym razem, co planuje na tydzien i co zrobil
 * ostatnio. Podglad nie zapisuje niczego — pokazuje wynik tej samej logiki,
 * ktora wykona zadanie serwerowe.
 */
export function WorkAutomationStatus({ overview, isResuming, onResume }: Props) {
  const fmt = useFormat()
  const { settings, presence, preview, recentRuns, nextRun, today } = overview
  const [resumeDate, setResumeDate] = useState(today)

  if (!settings) return null

  return (
    <div className="space-y-4">
      <dl className="grid gap-2 sm:grid-cols-2">
        <div className="rounded-lg border px-3 py-2">
          <dt className="text-xs text-muted-foreground">Najbliższy zapis</dt>
          <dd className="text-sm font-medium">
            {nextRun
              ? `${fmt.weekday(nextRun.date, 'long')}, ${fmt.date(nextRun.date, 'dayMonthLong')}, ${nextRun.time}`
              : 'Automat wyłączony'}
          </dd>
        </div>

        <div className="rounded-lg border px-3 py-2">
          <dt className="text-xs text-muted-foreground">Stan</dt>
          <dd className="text-sm font-medium">
            {presence ? PRESENCE_LABELS[presence.because] : 'Brak konfiguracji'}
          </dd>
        </div>
      </dl>

      <p className="text-xs text-muted-foreground">
        Sprawdzanie odbywa się co godzinę, więc zapis następuje w pierwszym przebiegu po
        ustawionej godzinie — nigdy przed nią. Opóźnienie do ok. 60 minut jest normalne.
      </p>

      {presence?.at === 'home' && (
        <div className="space-y-2 rounded-lg border border-dashed px-3 py-3">
          <p className="text-sm font-medium">Wznów pracę</p>
          <p className="text-xs text-muted-foreground">
            Jawne rozpoczęcie pracy — działa też bez znanej daty kolejnego zjazdu. Kolejny
            zapisany powrót ponownie ją wstrzyma.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Input
              type="date"
              className="w-auto"
              aria-label="Data wznowienia pracy"
              value={resumeDate}
              onChange={(event) => setResumeDate(event.target.value)}
            />
            <Button
              type="button"
              variant="outline"
              disabled={isResuming || !resumeDate}
              onClick={() => onResume(resumeDate)}
            >
              {isResuming ? 'Zapisywanie...' : 'Wznów pracę od dnia…'}
            </Button>
          </div>
        </div>
      )}

      <section className="space-y-2">
        <h4 className="text-sm font-medium">Najbliższe 7 dni</h4>
        <ul className="divide-y rounded-lg border">
          {preview.map((day) => (
            <li key={day.date} className="flex items-center justify-between gap-3 px-3 py-2">
              <span className="text-sm">
                {fmt.weekday(day.date, 'short')} {fmt.date(day.date, 'dayMonth')}
              </span>
              <span
                className={cn(
                  'text-sm',
                  day.hours === null ? 'text-muted-foreground' : 'font-medium',
                )}
              >
                {day.hours === null
                  ? (day.reason ? SKIP_REASON_LABELS[day.reason] : 'Brak zapisu')
                  : fmt.hours(day.hours)}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-2">
        <h4 className="text-sm font-medium">Ostatnie wykonania</h4>
        {recentRuns.length === 0 ? (
          <p className="text-xs text-muted-foreground">Automat nie podjął jeszcze żadnej decyzji.</p>
        ) : (
          <ul className="divide-y rounded-lg border">
            {recentRuns.map((record) => (
              <li
                key={record.localDate}
                className="flex items-center justify-between gap-3 px-3 py-2"
              >
                <span className="text-sm">{fmt.date(record.localDate, 'short')}</span>
                <span
                  className={cn(
                    'text-right text-xs',
                    record.outcome === 'error' ? 'text-destructive' : 'text-muted-foreground',
                  )}
                >
                  {reasonLabel(record)}
                  {record.hours !== null && ` · ${fmt.hours(record.hours)}`}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
