'use client'

import { useFormContext } from 'react-hook-form'

import { FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'

import { WEEKDAY_KEYS, WEEKDAY_LABELS, type WorkAutomationSettingsInput } from '../domain'

/**
 * Grafik tygodnia: dla kazdego dnia przelacznik i liczba godzin.
 *
 * Niedziela jest zwyklym wierszem listy, nie wyjatkiem schowanym pod
 * dodatkowa opcja — ma byc widac, ze jest wylaczona i ile godzin dostanie po
 * wlaczeniu.
 */
export function WeekScheduleFields() {
  const form = useFormContext<WorkAutomationSettingsInput>()

  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium">Grafik tygodnia</legend>

      <div className="divide-y rounded-lg border">
        {WEEKDAY_KEYS.map((day) => (
          <div key={day} className="flex items-center gap-3 px-3 py-2">
            <FormField
              control={form.control}
              name={`weekSchedule.${day}.enabled`}
              render={({ field }) => (
                <FormItem className="flex flex-1 items-center gap-3 space-y-0">
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      aria-label={`Praca: ${WEEKDAY_LABELS[day]}`}
                    />
                  </FormControl>
                  <span className="text-sm">{WEEKDAY_LABELS[day]}</span>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name={`weekSchedule.${day}.hours`}
              render={({ field }) => (
                <FormItem className="w-28 space-y-0">
                  <FormControl>
                    <Input
                      type="number"
                      inputMode="decimal"
                      min={0}
                      max={24}
                      step={0.5}
                      aria-label={`Godziny: ${WEEKDAY_LABELS[day]}`}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        ))}
      </div>
    </fieldset>
  )
}
