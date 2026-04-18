'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog'
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
import { useSetGoal } from '../../_hooks/usePreferencesStore'
import type { Currency, Goal } from '../../_domain/dashboard.types'

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
    onOpenChange(false)
  }

  function handleClear() {
    setGoal(null)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Cel miesięczny</DialogTitle>
            <DialogDescription>
              Kwota do osiągnięcia w tym miesiącu — postęp liczymy
              z Twoich zarobków przeliczonych na wybraną walutę.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-[1fr_auto] gap-2">
            <div className="space-y-1.5">
              <Label htmlFor="goal-amount">Kwota</Label>
              <Input
                id="goal-amount"
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
              <Label htmlFor="goal-currency">Waluta</Label>
              <Select
                value={currency}
                onValueChange={(v) => setCurrency(v as Currency)}
              >
                <SelectTrigger id="goal-currency" className="w-[84px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PLN">PLN</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:justify-between">
            {initialGoal?.amount != null && (
              <Button type="button" variant="ghost" onClick={handleClear}>
                Usuń cel
              </Button>
            )}
            <div className="flex gap-2 sm:ml-auto">
              <DialogClose asChild>
                <Button type="button" variant="outline">Anuluj</Button>
              </DialogClose>
              <Button type="submit" disabled={!isValid}>Zapisz</Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
