'use client'

import { useMemo } from 'react'

import { Skeleton } from '@/components/ui/skeleton'

import {
  DEFAULT_RUN_TIME,
  DEFAULT_TIME_ZONE,
  DEFAULT_WEEK_SCHEDULE,
  type AutomationOverview,
  type WorkAutomationSettingsInput,
} from '../domain'
import { useResumeWork, useUpdateWorkAutomation, useWorkAutomationOverview } from '../hooks'
import { WorkAutomationForm } from './WorkAutomationForm'
import { WorkAutomationStatus } from './WorkAutomationStatus'

const DISABLED_REASON_MESSAGE = {
  client_deleted: 'Automat został wyłączony: usunięto klienta, do którego trafiały wpisy.',
  project_deleted: 'Automat został wyłączony: usunięto skonfigurowany projekt.',
} as const

/** Domyslne wartosci dla konta, ktore nie zapisalo jeszcze konfiguracji. */
function toFormValues(overview: AutomationOverview): WorkAutomationSettingsInput {
  if (overview.settings) {
    const { disabledReason: _disabledReason, ...config } = overview.settings
    // Klon grafiku: react-hook-form mutuje wartosci formularza, a `settings`
    // pochodzi z cache TanStack Query.
    return { ...config, weekSchedule: structuredClone(config.weekSchedule) }
  }

  return {
    enabled: false,
    startDate: overview.today,
    runTime: DEFAULT_RUN_TIME,
    timeZone: DEFAULT_TIME_ZONE,
    weekSchedule: structuredClone(DEFAULT_WEEK_SCHEDULE),
    clientId: '',
    projectId: '',
  }
}

/**
 * Sekcja „Automatyczne zapisywanie pracy" w ustawieniach konta.
 *
 * Kolejnosc na ekranie jest celowa: najpierw stan i najblizszy zapis, potem
 * pelna konfiguracja — na telefonie liczy sie to, co widac bez przewijania.
 */
export function WorkAutomationSection() {
  const overviewQuery = useWorkAutomationOverview()
  const updateSettings = useUpdateWorkAutomation()
  const resumeWork = useResumeWork()

  const overview = overviewQuery.data
  const formValues = useMemo(() => (overview ? toFormValues(overview) : null), [overview])

  return (
    <section className="space-y-4 rounded-xl border p-4">
      <header>
        <h3 className="text-sm font-semibold">Automatyczne zapisywanie pracy</h3>
        <p className="text-xs text-muted-foreground">
          Automat dopisuje rzeczywiście przepracowane dni według grafiku tygodnia i zapisanych
          wyjazdów. Nie nadpisuje wpisów wprowadzonych ręcznie.
        </p>
      </header>

      {overviewQuery.isLoading && (
        <div className="space-y-2">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      )}

      {overviewQuery.isError && (
        <p className="rounded-lg border border-destructive/40 p-3 text-sm text-destructive">
          {overviewQuery.error instanceof Error
            ? overviewQuery.error.message
            : 'Nie udało się pobrać stanu automatu.'}
        </p>
      )}

      {overview?.settings?.disabledReason && (
        <p className="rounded-lg border border-destructive/40 p-3 text-sm text-destructive">
          {DISABLED_REASON_MESSAGE[overview.settings.disabledReason]} Wybierz nowego i włącz
          automat ponownie.
        </p>
      )}

      {overview && formValues && (
        <>
          <WorkAutomationStatus
            overview={overview}
            isResuming={resumeWork.isPending}
            onResume={(resumeDate) => resumeWork.mutate(resumeDate)}
          />

          <WorkAutomationForm
            settings={formValues}
            clients={overview.clients}
            projects={overview.projects}
            isSaving={updateSettings.isPending}
            onSave={async (values) => {
              await updateSettings.mutateAsync(values)
            }}
          />
        </>
      )}
    </section>
  )
}
