'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  WORKSPACE_FIELD,
  WORKSPACE_FIELD_LABEL,
  WorkspaceOverlay,
  WorkspaceOverlayBody,
  WorkspaceOverlayFooter,
  WorkspaceOverlayForm,
} from '@/components/workspace'
import { cn } from '@/lib/utils'
import { useSetGoal } from '../../hooks/usePreferencesStore'
import { syncPreferencesToSupabase } from '../PreferencesProvider'
import type { Currency, Goal } from '../../types/dashboard.types'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialGoal: Goal | null
}

/**
 * Edycja celu miesięcznego.
 *
 * Zapis — kierunek projektowy:
 *   1. Optimistic w Zustand (usePreferencesStore) → widoczne natychmiast.
 *   2. Persist w localStorage (persist middleware) → przeżywa odświeżenie.
 *   3. Sync z Supabase user_metadata (hydrate + setter — PreferencesProvider
 *      robi fire-and-forget) → stan między urządzeniami.
 *
 * Dzięki temu formularz jest czysto prezentacyjny — wywołanie `setGoal`
 * aktualizuje jednocześnie wszystkie 3 warstwy, bez loading state w UI.
 */
export function GoalEditDialog({ open, onOpenChange, initialGoal }: Props) {
  const setGoal = useSetGoal()
  const [amount, setAmount] = useState<string>(
    initialGoal?.amount != null ? String(initialGoal.amount) : '',
  )
  const [currency, setCurrency] = useState<Currency>(initialGoal?.currency ?? 'PLN')

  const parsed = Number.parseFloat(amount.replace(',', '.'))
  const isValid = Number.isFinite(parsed) && parsed > 0

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isValid) return
    setGoal({ amount: parsed, currency })
    void syncPreferencesToSupabase()
    onOpenChange(false)
  }

  function handleClear() {
    setGoal(null)
    void syncPreferencesToSupabase()
    onOpenChange(false)
  }

  return (
    <WorkspaceOverlay
      open={open}
      onOpenChange={onOpenChange}
      title="Cel miesięczny"
      description="Kwota do osiągnięcia w tym miesiącu — postęp liczymy z Twoich zarobków przeliczonych na wybraną walutę."
      size="sm"
    >
      <WorkspaceOverlayForm onSubmit={handleSubmit}>
        <WorkspaceOverlayBody>
          <div className="grid grid-cols-[1fr_auto] gap-2">
            <div className="space-y-1.5">
              <Label htmlFor="goal-amount" className={WORKSPACE_FIELD_LABEL}>
                Kwota
              </Label>
              <Input
                id="goal-amount"
                className={WORKSPACE_FIELD}
                type="number"
                inputMode="decimal"
                min="0"
                step="100"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="np. 10000"
                autoFocus
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="goal-currency" className={WORKSPACE_FIELD_LABEL}>
                Waluta
              </Label>
              <Select value={currency} onValueChange={(v) => setCurrency(v as Currency)}>
                <SelectTrigger id="goal-currency" className={cn(WORKSPACE_FIELD, 'w-[92px]')}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PLN">PLN</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </WorkspaceOverlayBody>

        {/* „Usuń cel" to akcja o innym ciężarze niż zapis, więc stopka łamie
            domyślny układ i rozsuwa je na krawędzie — także na telefonie. */}
        <WorkspaceOverlayFooter className="flex-row items-center justify-between sm:justify-between">
          {initialGoal?.amount != null ? (
            <Button type="button" variant="ghost" onClick={handleClear} className="h-11 sm:h-9">
              Usuń cel
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="h-11 flex-1 sm:h-9 sm:flex-none"
            >
              Anuluj
            </Button>
            <Button
              type="submit"
              variant="accent"
              disabled={!isValid}
              className="h-11 flex-1 sm:h-9 sm:flex-none"
            >
              Zapisz
            </Button>
          </div>
        </WorkspaceOverlayFooter>
      </WorkspaceOverlayForm>
    </WorkspaceOverlay>
  )
}
