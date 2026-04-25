'use client'

import { useFormContext } from 'react-hook-form'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Copy, GripVertical, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import type { InvoiceBuilderValues } from '@/lib/schemas/invoice-builder.schema'
import type { LineTotals } from '@/lib/finance/invoice-builder-engine'
import { formatMoney } from '@/lib/finance/invoice-builder-engine'
import {
  DescriptionField,
  QuantityField,
  UnitField,
  UnitPriceField,
  VatField,
} from './LineItemRow'

interface LineItemCardProps {
  index: number
  lineId: string
  totals: LineTotals | undefined
  currency: InvoiceBuilderValues['currency']
  onRemove: () => void
  onDuplicate: () => void
  canRemove: boolean
}

/**
 * Mobile card variant. Uses a vertical stacked layout with explicit labels —
 * an unlabeled tabular row is unreadable on a 360px screen. Each label is tied
 * to its input via aria-label inside the field primitives so screen-reader
 * users get the same context as sighted users.
 */
export function LineItemCard({
  index,
  lineId,
  totals,
  currency,
  onRemove,
  onDuplicate,
  canRemove,
}: LineItemCardProps) {
  const { control, formState } = useFormContext<InvoiceBuilderValues>()
  const errors = formState.errors.items?.[index]
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: lineId,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <article
      ref={setNodeRef}
      style={style}
      aria-label={`Pozycja faktury ${index + 1}`}
      className={cn(
        'rounded-xl border bg-background p-4 shadow-sm space-y-3',
        isDragging && 'opacity-60 shadow-lg',
      )}
    >
      <header className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <button
            type="button"
            aria-label={`Przeciągnij pozycję ${index + 1}`}
            className="cursor-grab touch-none rounded p-1 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-4 w-4" />
          </button>
          <span className="font-medium">Pozycja #{index + 1}</span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={onDuplicate}
            aria-label={`Duplikuj pozycję ${index + 1}`}
            className="h-8 w-8"
          >
            <Copy className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={onRemove}
            disabled={!canRemove}
            aria-label={`Usuń pozycję ${index + 1}`}
            className="h-8 w-8 text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <div className="space-y-1">
        <Label htmlFor={`item-${lineId}-desc`} className="text-xs">
          Opis
        </Label>
        <DescriptionField control={control} index={index} errorMessage={errors?.description?.message} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Ilość</Label>
          <QuantityField control={control} index={index} errorMessage={errors?.quantity?.message} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Jednostka</Label>
          <UnitField control={control} index={index} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Cena netto</Label>
          <UnitPriceField
            control={control}
            index={index}
            currency={currency}
            errorMessage={errors?.unit_price_net?.message}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">VAT</Label>
          <VatField control={control} index={index} />
        </div>
      </div>

      <footer className="flex items-baseline justify-between border-t pt-3 text-sm">
        <span className="text-muted-foreground">Razem brutto</span>
        <span className="text-base font-semibold tabular-nums">
          {totals ? formatMoney(totals.gross) : '—'}
        </span>
      </footer>
    </article>
  )
}
