'use client'

import { useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'

import {
  TIME_ZONE_OPTIONS,
  workAutomationSettingsSchema,
  type AutomationClientOption,
  type AutomationProjectOption,
  type WorkAutomationSettingsInput,
} from '../domain'
import { WeekScheduleFields } from './WeekScheduleFields'

/** Radix Select nie przyjmuje pustej wartosci — „bez projektu" ma wlasny klucz. */
const NO_PROJECT = 'none'

interface Props {
  settings: WorkAutomationSettingsInput
  clients: AutomationClientOption[]
  projects: AutomationProjectOption[]
  isSaving: boolean
  onSave: (values: WorkAutomationSettingsInput) => Promise<void>
}

export function WorkAutomationForm({ settings, clients, projects, isSaving, onSave }: Props) {
  const form = useForm<WorkAutomationSettingsInput>({
    resolver: zodResolver(workAutomationSettingsSchema),
    defaultValues: settings,
  })

  useEffect(() => {
    form.reset(settings)
  }, [form, settings])

  const selectedClientId = form.watch('clientId')

  // Projekt musi nalezec do wybranego klienta — lista sama tego pilnuje,
  // a serwer sprawdza to ponownie przed zapisem.
  const clientProjects = useMemo(
    () => projects.filter((project) => project.clientId === selectedClientId),
    [projects, selectedClientId],
  )

  // Klienci akordowi sa poza zakresem pierwszej wersji: automat nie ma skad
  // wziac ilosci, a zgadywanie oznaczaloby fałszywe kwoty na fakturze.
  const hourlyClients = useMemo(
    () => clients.filter((client) => client.workType === 'hourly'),
    [clients],
  )

  const timeZones = useMemo(
    () =>
      TIME_ZONE_OPTIONS.includes(settings.timeZone as (typeof TIME_ZONE_OPTIONS)[number])
        ? [...TIME_ZONE_OPTIONS]
        : [settings.timeZone, ...TIME_ZONE_OPTIONS],
    [settings.timeZone],
  )

  return (
    <Form {...form}>
      <form className="space-y-4" onSubmit={form.handleSubmit(async (values) => onSave(values))}>
        <div className="grid gap-3 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Data rozpoczęcia</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="runTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Godzina zapisu</FormLabel>
                <FormControl>
                  <Input type="time" {...field} />
                </FormControl>
                <FormDescription className="text-xs">
                  Moment dopisania godzin za dany dzień — nie godzina rozpoczęcia pracy. Automat
                  zapisuje pracę przy pierwszym sprawdzeniu po wskazanej godzinie.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="timeZone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Strefa czasowa</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {timeZones.map((zone) => (
                    <SelectItem key={zone} value={zone}>
                      {zone}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <WeekScheduleFields />

        <div className="grid gap-3 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="clientId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Klient</FormLabel>
                <Select
                  value={field.value}
                  onValueChange={(value) => {
                    field.onChange(value)
                    form.setValue('projectId', '', { shouldDirty: true })
                  }}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Wybierz klienta" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {hourlyClients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription className="text-xs">
                  Tylko klienci rozliczani godzinowo.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="projectId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Projekt (opcjonalnie)</FormLabel>
                <Select
                  value={field.value || NO_PROJECT}
                  onValueChange={(value) => field.onChange(value === NO_PROJECT ? '' : value)}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value={NO_PROJECT}>Bez projektu</SelectItem>
                    {clientProjects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="rounded-lg border px-3 py-2">
          <FormField
            control={form.control}
            name="enabled"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between">
                <div>
                  <FormLabel>Zapisuj automatycznie</FormLabel>
                  <FormDescription className="text-xs">
                    Działa po stronie serwera — nie wymaga otwartej aplikacji ani włączonego
                    telefonu.
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        <Button type="submit" disabled={isSaving || !form.formState.isDirty}>
          {isSaving ? 'Zapisywanie...' : 'Zapisz ustawienia automatu'}
        </Button>
      </form>
    </Form>
  )
}
