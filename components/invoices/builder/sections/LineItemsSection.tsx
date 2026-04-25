'use client'

import { useMemo } from 'react'
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
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
import { Button } from '@/components/ui/button'
import { useIsMobile } from '@/hooks/use-mobile'
import { SectionCard } from '../parts/SectionCard'
import { LineItemRow } from '../LineItemRow'
import { LineItemCard } from '../LineItemCard'
import type { InvoiceBuilderForm } from '../useInvoiceBuilderForm'

interface LineItemsSectionProps {
  builder: InvoiceBuilderForm
}

export function LineItemsSection({ builder }: LineItemsSectionProps) {
  const isMobile = useIsMobile()
  const currency = builder.form.watch('currency')

  // Reading errors directly from formState ensures the array-level error
  // ("at least one position required") is rendered even when no individual
  // field is in an error state.
  const itemsError = builder.form.formState.errors.items?.message

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const ids = useMemo(
    () => builder.items.fields.map((field) => (field as unknown as { id: string }).id),
    [builder.items.fields],
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const from = ids.indexOf(active.id as string)
    const to = ids.indexOf(over.id as string)
    if (from === -1 || to === -1) return
    builder.moveLine(from, to)
  }

  return (
    <SectionCard
      title="Pozycje na fakturze"
      description="Dodawaj, sortuj i usuwaj pozycje. Wartości przeliczają się automatycznie."
      trailing={
        <Button type="button" size="sm" variant="outline" onClick={builder.addLine}>
          <Plus className="mr-2 h-4 w-4" />
          Dodaj pozycję
        </Button>
      }
    >
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        modifiers={[restrictToVerticalAxis, restrictToParentElement]}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          {isMobile ? (
            <ul className="space-y-3 list-none p-0">
              {builder.items.fields.map((field, index) => {
                const lineId = (field as unknown as { id: string }).id
                return (
                  <li key={lineId}>
                    <LineItemCard
                      index={index}
                      lineId={lineId}
                      totals={builder.lineTotals[lineId]}
                      currency={currency}
                      onRemove={() => builder.removeLine(index)}
                      onDuplicate={() => builder.duplicateLine(index)}
                      canRemove={builder.items.fields.length > 1}
                    />
                  </li>
                )
              })}
            </ul>
          ) : (
            <div className="space-y-2">
              <DesktopHeader />
              <div role="list" className="space-y-2">
                {builder.items.fields.map((field, index) => {
                  const lineId = (field as unknown as { id: string }).id
                  return (
                    <div role="listitem" key={lineId}>
                      <LineItemRow
                        index={index}
                        lineId={lineId}
                        totals={builder.lineTotals[lineId]}
                        currency={currency}
                        onRemove={() => builder.removeLine(index)}
                        onDuplicate={() => builder.duplicateLine(index)}
                        canRemove={builder.items.fields.length > 1}
                      />
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </SortableContext>
      </DndContext>

      {itemsError ? (
        <p role="alert" className="text-sm text-destructive">
          {itemsError}
        </p>
      ) : null}

      <div className="sm:hidden">
        <Button type="button" variant="outline" onClick={builder.addLine} className="w-full">
          <Plus className="mr-2 h-4 w-4" />
          Dodaj pozycję
        </Button>
      </div>
    </SectionCard>
  )
}

/**
 * Header is rendered as a separate aria-hidden grid that mirrors the row's
 * `grid-template-columns` exactly. We don't use a real <table> because the
 * mobile variant needs full vertical reflow that <table> cells can't deliver
 * without JS-driven layout swaps.
 */
function DesktopHeader() {
  return (
    <div
      aria-hidden
      className="grid gap-2 px-3 text-xs font-medium uppercase tracking-wide text-muted-foreground grid-cols-[auto_minmax(0,3fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1.2fr)_auto]"
    >
      <span />
      <span>Opis</span>
      <span>J.m.</span>
      <span className="text-right">Ilość</span>
      <span className="text-right">Cena netto</span>
      <span>VAT</span>
      <span className="text-right">Brutto</span>
      <span />
    </div>
  )
}
