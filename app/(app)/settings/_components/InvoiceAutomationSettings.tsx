'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { InvoiceSettings } from '../_domain'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'

const schema = z.object({
  userPrefix: z.string().trim().min(1).max(12),
  numberingPattern: z.string().trim().min(3),
  series: z.string().trim().min(1),
  branch: z.string().trim().min(1),
  resetSequence: z.enum(['monthly', 'yearly']),
  defaultTemplate: z.enum(['classic', 'modern', 'minimal']),
  templateAccentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  templateFooter: z.string().trim().max(180),
  autoIssueEnabled: z.boolean(),
  autoIssueDay: z.coerce.number().int().min(0).max(6),
  dueDays: z.coerce.number().int().min(1).max(90),
})

type FormValues = z.infer<typeof schema>

const DAYS = [
  { value: '1', label: 'Poniedziałek' },
  { value: '2', label: 'Wtorek' },
  { value: '3', label: 'Środa' },
  { value: '4', label: 'Czwartek' },
  { value: '5', label: 'Piątek' },
  { value: '6', label: 'Sobota' },
  { value: '0', label: 'Niedziela' },
]

type Props = {
  settings: InvoiceSettings
  isSaving: boolean
  onSave: (values: InvoiceSettings) => Promise<void>
}

export function InvoiceAutomationSettings({ settings, isSaving, onSave }: Props) {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: settings,
  })

  useEffect(() => {
    form.reset(settings)
  }, [form, settings])

  return (
    <Form {...form}>
      <form className="space-y-4 rounded-xl border p-4" onSubmit={form.handleSubmit(async (values) => onSave(values))}>
        <header>
          <h3 className="text-sm font-semibold">Faktury: numeracja, szablon i automatyzacja</h3>
          <p className="text-xs text-muted-foreground">
            Auto-fakturowanie używa formatu: [PREFIKS] [NUMER]/[MM]/[YYYY]
          </p>
        </header>

        <div className="grid gap-3 sm:grid-cols-2">
          <FormField control={form.control} name="userPrefix" render={({ field }) => (
            <FormItem><FormLabel>Prefiks użytkownika</FormLabel><FormControl><Input {...field} placeholder="np. FR" /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="numberingPattern" render={({ field }) => (
            <FormItem><FormLabel>Wzór numeru (manualny)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="series" render={({ field }) => (
            <FormItem><FormLabel>Seria</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="branch" render={({ field }) => (
            <FormItem><FormLabel>Oddział</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
          )} />
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <FormField control={form.control} name="resetSequence" render={({ field }) => (
            <FormItem><FormLabel>Reset</FormLabel><Select value={field.value} onValueChange={field.onChange}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="monthly">Miesięczny</SelectItem><SelectItem value="yearly">Roczny</SelectItem></SelectContent></Select><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="defaultTemplate" render={({ field }) => (
            <FormItem><FormLabel>Szablon</FormLabel><Select value={field.value} onValueChange={field.onChange}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="classic">Classic</SelectItem><SelectItem value="modern">Modern</SelectItem><SelectItem value="minimal">Minimal</SelectItem></SelectContent></Select><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="templateAccentColor" render={({ field }) => (
            <FormItem><FormLabel>Kolor</FormLabel><FormControl><Input type="color" {...field} /></FormControl><FormMessage /></FormItem>
          )} />
        </div>

        <FormField control={form.control} name="templateFooter" render={({ field }) => (
          <FormItem><FormLabel>Stopka</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
        )} />

        <div className="space-y-3 rounded-lg border px-3 py-2">
          <FormField control={form.control} name="autoIssueEnabled" render={({ field }) => (
            <FormItem className="flex items-center justify-between"><FormLabel>Auto-wystawianie</FormLabel><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>
          )} />
          <div className="grid gap-2 sm:grid-cols-2">
            <FormField control={form.control} name="autoIssueDay" render={({ field }) => (
              <FormItem><Select value={String(field.value)} onValueChange={(value) => field.onChange(Number(value))}><FormControl><SelectTrigger><SelectValue placeholder="Dzień" /></SelectTrigger></FormControl><SelectContent>{DAYS.map((day) => <SelectItem key={day.value} value={day.value}>{day.label}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="dueDays" render={({ field }) => (
              <FormItem><FormControl><Input type="number" min={1} max={90} {...field} /></FormControl><FormMessage /></FormItem>
            )} />
          </div>
        </div>

        <Button type="submit" disabled={isSaving || !form.formState.isDirty}>
          {isSaving ? 'Zapisywanie...' : 'Zapisz ustawienia faktur'}
        </Button>
      </form>
    </Form>
  )
}
