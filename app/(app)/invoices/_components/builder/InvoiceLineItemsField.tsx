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
import { Plus } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'

import { Button } from '@/components/ui/button'
import {
  type InvoiceBuilderValues,
} from '@/lib/schemas/invoice-builder.schema'

import { emptyLineItem } from './invoice-builder.helpers'
import { InvoiceLineItemRow } from './InvoiceLineItemRow'

/**
 * Owns the `items` array on the invoice form. Wraps everything in a
 * DndContext + SortableContext so each row only has to wire its own
 * `useSortable` hook. The container doesn't subscribe to the items'
 * inner fields — it only watches the array's identity (length / order)
 * via `useFieldArray.fields`, which keeps its render budget flat.
 */
export function InvoiceLineItemsField() {
  const { control, formState } = useFormContext<InvoiceBuilderValues>()
  const { fields, append, remove, move } = useFieldArray<InvoiceBuilderValues, 'items', 'fieldArrayId'>({
    control,
    name:    'items',
    keyName: 'fieldArrayId',
  })

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

      <Button
        type="button"
        variant="outline"
        onClick={handleAdd}
        className="h-12 w-full justify-center gap-2 rounded-xl border-dashed border-border/70 text-sm font-medium text-muted-foreground hover:text-foreground sm:h-11"
      >
        <Plus className="h-4 w-4" aria-hidden="true" />
        Dodaj pozycję
      </Button>
    </div>
  )
}
