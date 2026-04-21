'use client'

import { useState } from 'react'
import type { InvoiceSettings } from '../_domain'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'

interface InvoiceAutomationSettingsProps {
  settings: InvoiceSettings
  isSaving: boolean
  onSave: (settings: Partial<InvoiceSettings>) => Promise<void>
}

const DAYS = [
  { value: 1, label: 'Poniedziałek' },
  { value: 2, label: 'Wtorek' },
  { value: 3, label: 'Środa' },
  { value: 4, label: 'Czwartek' },
  { value: 5, label: 'Piątek' },
  { value: 6, label: 'Sobota' },
  { value: 0, label: 'Niedziela' },
]

export function InvoiceAutomationSettings({ settings, isSaving, onSave }: InvoiceAutomationSettingsProps) {
  const [draft, setDraft] = useState(settings)

  return (
    <section className="space-y-4 rounded-xl border p-4">
      <header>
        <h3 className="text-sm font-semibold">Numeracja, szablony i auto-fakturowanie</h3>
        <p className="text-xs text-muted-foreground">
          Tokeny numeracji: {'{SERIA}'} {'{BRANCH}'} {'{YYYY}'} {'{YY}'} {'{MM}'} {'{SEQ}'}
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="grid gap-1.5 sm:col-span-2">
          <Label>Wzór numeru faktury</Label>
          <Input
            value={draft.numberingPattern}
            onChange={(event) => setDraft((prev) => ({ ...prev, numberingPattern: event.target.value }))}
          />
        </div>
        <div className="grid gap-1.5">
          <Label>Seria</Label>
          <Input value={draft.series} onChange={(event) => setDraft((prev) => ({ ...prev, series: event.target.value }))} />
        </div>
        <div className="grid gap-1.5">
          <Label>Oddział</Label>
          <Input value={draft.branch} onChange={(event) => setDraft((prev) => ({ ...prev, branch: event.target.value }))} />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="grid gap-1.5">
          <Label>Reset sekwencji</Label>
          <Select
            value={draft.resetSequence}
            onValueChange={(value: 'monthly' | 'yearly') => setDraft((prev) => ({ ...prev, resetSequence: value }))}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="monthly">Co miesiąc</SelectItem>
              <SelectItem value="yearly">Co rok</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-1.5">
          <Label>Szablon PDF</Label>
          <Select
            value={draft.defaultTemplate}
            onValueChange={(value: 'classic' | 'modern' | 'minimal') => setDraft((prev) => ({ ...prev, defaultTemplate: value }))}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="classic">Classic</SelectItem>
              <SelectItem value="modern">Modern</SelectItem>
              <SelectItem value="minimal">Minimal</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-1.5">
          <Label>Kolor akcentu</Label>
          <Input type="color" value={draft.templateAccentColor} onChange={(event) => setDraft((prev) => ({ ...prev, templateAccentColor: event.target.value }))} />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label>Stopka szablonu</Label>
          <Input value={draft.templateFooter} onChange={(event) => setDraft((prev) => ({ ...prev, templateFooter: event.target.value }))} />
        </div>
        <div className="space-y-3 rounded-lg border px-3 py-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm">Włącz auto-fakturowanie</Label>
            <Switch checked={draft.autoIssueEnabled} onCheckedChange={(checked) => setDraft((prev) => ({ ...prev, autoIssueEnabled: checked }))} />
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <Select
              value={String(draft.autoIssueDay)}
              onValueChange={(value) => setDraft((prev) => ({ ...prev, autoIssueDay: Number(value) }))}
            >
              <SelectTrigger><SelectValue placeholder="Dzień" /></SelectTrigger>
              <SelectContent>
                {DAYS.map((day) => <SelectItem key={day.value} value={String(day.value)}>{day.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input
              type="number"
              min={1}
              max={90}
              value={draft.dueDays}
              onChange={(event) => setDraft((prev) => ({ ...prev, dueDays: Number(event.target.value || 7) }))}
              placeholder="Termin płatności (dni)"
            />
          </div>
        </div>
      </div>

      <Button disabled={isSaving} onClick={() => void onSave(draft)}>
        {isSaving ? 'Zapisywanie...' : 'Zapisz ustawienia automatyzacji'}
      </Button>
    </section>
  )
}
