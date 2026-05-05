'use client'

import * as React from 'react'
import { useFieldArray, useFormContext } from 'react-hook-form'
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import { restrictToVerticalAxis, restrictToParentElement } from '@dnd-kit/modifiers'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CalendarRange, Plus } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'

import { Button } from '@/components/ui/button'
import {
  type InvoiceBuilderValues,
} from '@/lib/schemas/invoice-builder.schema'
import type { WorkedWeekSummary } from '@/features/invoices/services/worked-weeks.service.server'

import { emptyLineItem, makeLineItemId } from './invoice-builder.helpers'
import { InvoiceLineItemRow } from './InvoiceLineItemRow'
import { WorkedWeeksPickerDialog } from './WorkedWeeksPickerDialog'

/**
 * Owns the `items` array on the invoice form. Wraps everything in a
 * DndContext + SortableContext so each row only has to wire its own
 * `useSortable` hook. The container doesn't subscribe to the items'
 * inner fields — it only watches the array's identity (length / order)
 * via `useFieldArray.fields`, which keeps its render budget flat.
 */
interface InvoiceLineItemsFieldProps {
  /** Linked client id — required to fetch worked weeks. */
  clientId: string | null
}

function weekToLineItem(week: WorkedWeekSummary) {
  const description =
    week.workType === 'piecework'
      ? `Praca w tygodniu ${week.id} (${week.start} – ${week.end}) — ${week.quantity.toLocaleString('pl-PL')} szt.`
      : `Praca w tygodniu ${week.id} (${week.start} – ${week.end}) — ${week.hours.toLocaleString('pl-PL')} h`

  const quantity = week.workType === 'piecework' ? week.quantity || 1 : week.hours || 1
  const unit_price_net = quantity > 0 ? Number((week.amount / quantity).toFixed(2)) : 0

  return {
    id:             makeLineItemId(),
    description,
    unit:           week.workType === 'piecework' ? 'szt.' : 'h',
    quantity:       Number(quantity.toFixed(3)),
    unit_price_net,
    vat_mode:       'standard' as const,
    vat_rate:       23,
  }
}

export function InvoiceLineItemsField({ clientId }: InvoiceLineItemsFieldProps) {
  const { control, formState, getValues, setValue } = useFormContext<InvoiceBuilderValues>()
  const { fields, append, remove, move } = useFieldArray<InvoiceBuilderValues, 'items', 'fieldArrayId'>({
    control,
    name:    'items',
    keyName: 'fieldArrayId',
  })
  const [pickerOpen, setPickerOpen] = React.useState(false)

  // Pointer + keyboard sensors. Pointer activates after a small distance
  // so taps on the row's inputs don't accidentally start a drag.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const arrayError = (formState.errors.items as { message?: string } | undefined)?.message

  // dnd-kit identifies items by stable string ids. We store one inside
  // each line item (`id`) — that's also the key React uses.
  const sortableIds = React.useMemo(
    () => fields.map((f) => (f as unknown as { id: string }).id),
    [fields],
  )

  const handleDragEnd = React.useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event
      if (!over || active.id === over.id) return
      const from = sortableIds.indexOf(String(active.id))
      const to = sortableIds.indexOf(String(over.id))
      if (from < 0 || to < 0) return
      move(from, to)
    },
    [move, sortableIds],
  )

  const handleAdd = React.useCallback(() => {
    append(emptyLineItem(), { shouldFocus: true })
  }, [append])

  const handleApplyWeeks = React.useCallback(
    (weeks: WorkedWeekSummary[]) => {
      const newItems = weeks.map(weekToLineItem)
      const current = getValues('items') ?? []

      // Heuristic: if the only existing item is a fresh blank one (no
      // description, no price), replace it. Otherwise append so we don't
      // wipe work the user already typed in.
      const isOnlyBlank =
        current.length === 1 &&
        (current[0].description ?? '').trim() === '' &&
        Number(current[0].unit_price_net ?? 0) === 0

      const next = isOnlyBlank ? newItems : [...current, ...newItems]
      setValue('items', next, { shouldDirty: true, shouldValidate: true })
      setPickerOpen(false)
    },
    [getValues, setValue],
  )

  const handleRemove = React.useCallback(
    (index: number) => {
      // The schema requires at least one line — guard at the UI layer
      // too so we don't even let the user try.
      if (fields.length <= 1) return
      remove(index)
    },
    [fields.length, remove],
  )

  return (
    <div className="space-y-3">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        modifiers={[restrictToVerticalAxis, restrictToParentElement]}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
          <ul className="space-y-3" role="list" aria-label="Pozycje na fakturze">
            <AnimatePresence initial={false}>
              {fields.map((field, index) => (
                <motion.div
                  key={(field as unknown as { id: string }).id}
                  layout="position"
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4, height: 0 }}
                  transition={{ duration: 0.18, ease: 'easeOut' }}
                >
                  <InvoiceLineItemRow
                    index={index}
                    itemId={(field as unknown as { id: string }).id}
                    itemCount={fields.length}
                    onRemove={handleRemove}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </ul>
        </SortableContext>
      </DndContext>

      {arrayError ? (
        <p
          role="alert"
          className="text-[13px] text-destructive/75 dark:text-destructive/80"
        >
          {arrayError}
        </p>
      ) : null}

      <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
        <Button
          type="button"
          variant="outline"
          onClick={handleAdd}
          className="h-12 w-full justify-center gap-2 rounded-xl border-dashed border-border/70 text-sm font-medium text-muted-foreground hover:text-foreground sm:h-11"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Dodaj pozycję
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => setPickerOpen(true)}
          disabled={!clientId}
          title={clientId ? undefined : 'Wybierz klienta, aby wczytać przepracowane tygodnie'}
          className="h-12 justify-center gap-2 rounded-xl text-sm font-medium sm:h-11"
        >
          <CalendarRange className="h-4 w-4" aria-hidden="true" />
          Wczytaj z tygodni
        </Button>
      </div>

      {clientId ? (
        <WorkedWeeksPickerDialog
          open={pickerOpen}
          clientId={clientId}
          onClose={() => setPickerOpen(false)}
          onConfirm={handleApplyWeeks}
        />
      ) : null}
    </div>
  )
}
