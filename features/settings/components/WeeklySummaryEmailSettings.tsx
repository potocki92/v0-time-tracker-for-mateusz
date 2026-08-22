'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Send } from 'lucide-react'
import { weeklySummaryEmailSchema, type WeeklySummaryEmailSettings as Settings } from '../domain'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'

type Props = {
  settings: Settings
  isSaving: boolean
  isSending: boolean
  onSave: (values: Settings) => Promise<void>
  onSendNow: () => void
}

export function WeeklySummaryEmailSettings({ settings, isSaving, isSending, onSave, onSendNow }: Props) {
  const form = useForm<Settings>({
    resolver: zodResolver(weeklySummaryEmailSchema),
    defaultValues: settings,
  })

  useEffect(() => {
    form.reset(settings)
  }, [form, settings])

  return (
    <Form {...form}>
      <form
        className="space-y-4 rounded-xl border p-4"
        onSubmit={form.handleSubmit(async (values) => onSave(values))}
      >
        <header>
          <h3 className="text-sm font-semibold">Skrót tygodnia dla księgowej</h3>
          <p className="text-xs text-muted-foreground">
            Ten sam tekst, który daje przycisk „Kopiuj” w podsumowaniu tygodnia — wysyłany mailem.
          </p>
        </header>

        <FormField
          control={form.control}
          name="recipientEmail"
          render={({ field }) => (
            <FormItem>
              <FormLabel>E-mail odbiorcy</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="ksiegowa@example.com"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="rounded-lg border px-3 py-2">
          <FormField
            control={form.control}
            name="enabled"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between">
                <div>
                  <FormLabel>Wysyłaj automatycznie</FormLabel>
                  <FormDescription className="text-xs">
                    Co sobotę o 18:00 idzie skrót bieżącego tygodnia. Tydzień bez
                    przepracowanych dni nie generuje maila.
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button type="submit" disabled={isSaving || !form.formState.isDirty}>
            {isSaving ? 'Zapisywanie...' : 'Zapisz ustawienia skrótu'}
          </Button>
          <Button
            type="button"
            variant="outline"
            // Wysylka idzie na ZAPISANY adres — niezapisana zmiana w polu
            // poszlaby w innym kierunku, niz pokazuje formularz.
            disabled={isSending || form.formState.isDirty || !settings.recipientEmail}
            onClick={() => onSendNow()}
          >
            <Send /> {isSending ? 'Wysyłanie...' : 'Wyślij teraz'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
