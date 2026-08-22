'use client'

import { SURFACE } from '@/components/ui/tokens'
import * as React from 'react'
import { useFormContext, useWatch } from 'react-hook-form'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Trash2 } from 'lucide-react'

import { FormInput } from '@/components/common/form'
import { cn } from '@/lib/utils'
import {
  computeLineTotals,
  formatMoney,
} from '@/lib/finance/invoice-builder-engine'
import {
  type InvoiceBuilderValues,
  type VatMode,
} from '@/lib/schemas/invoice-builder.schema'

import { EnumSelectField, NumericFormInput } from './shared-fields'

interface InvoiceLineItemRowProps {
  /** RHF index of this item in the `items` array. */
  index:       number
  /** Stable id used by dnd-kit. Comes from `items[index].id`. */
  itemId:      string
  /** Total number of items — drives the "delete" affordance. */
  itemCount:   number
  onRemove:    (index: number) => void
}

/**
 * A single editable line item, rendered as a sortable card on mobile and as
 * a 12-column row on `md:` and up. Subscribes only to its own slice of the
 * `items` array via `useWatch`, so editing one row never re-renders the
 * others — important because invoices can hit the schema's max of 200 lines.
 *
 * Drag affordance is wired via `@dnd-kit/sortable` (the parent provides the
 * SortableContext). Keyboard reorder is automatic — focus the handle, hit
 * space, then arrow keys.
 */
export const InvoiceLineItemRow = React.memo(function InvoiceLineItemRow({
  index,
  itemId,
  itemCount,
  onRemove,
}: InvoiceLineItemRowProps) {
  const { control } = useFormContext<InvoiceBuilderValues>()

  // Targeted subscriptions — only the fields that drive totals + the VAT
  // mode (which gates the "rate" field).
  const item = useWatch({ control, name: `items.${index}` })
  const currency = useWatch({ control, name: 'currency' })

  const totals = React.useMemo(
    () =>
      computeLineTotals(
        {
          quantity:       Number(item?.quantity) || 0,
          unit_price_net: Number(item?.unit_price_net) || 0,
          vat_mode:       (item?.vat_mode ?? 'standard') as VatMode,
          vat_rate:       Number(item?.vat_rate) || 0,
        },
        currency,
      ),
    [item?.quantity, item?.unit_price_net, item?.vat_mode, item?.vat_rate, currency],
  )

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: itemId })

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
  }

  const isStandard = (item?.vat_mode ?? 'standard') === 'standard'
  const canDelete = itemCount > 1

  return (
    <li
      ref={setNodeRef}
      style={style}
      data-dragging={isDragging || undefined}
      className={cn(
        SURFACE.card,
        'group relative p-3 sm:p-4 shadow-sm',
        'transition data-[dragging=true]:shadow-lg data-[dragging=true]:ring-2 data-[dragging=true]:ring-emerald-500/40',
      )}
    >
      <div className="grid grid-cols-12 gap-3">
        {/* Handle + ordinal */}
        <div className="col-span-12 flex items-center gap-2 md:col-span-1 md:flex-col md:items-center md:justify-start md:pt-3">
          <button
            type="button"
            aria-label={`Przeciągnij pozycję ${index + 1}`}
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground/70 transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring touch-none"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-4 w-4" aria-hidden="true" />
          </button>
          <span
            aria-hidden="true"
            className="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-muted px-2 text-xs font-semibold tabular-nums text-muted-foreground"
          >
            {index + 1}
          </span>

          {/* Mobile-only delete sits next to the handle to save vertical space. */}
          <button
            type="button"
            aria-label={`Usuń pozycję ${index + 1}`}
            disabled={!canDelete}
            onClick={() => onRemove(index)}
            className="ml-auto inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground/70 transition hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive/40 disabled:cursor-not-allowed disabled:opacity-40 md:hidden"
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {/* Description — full width, multiline-friendly. */}
        <div className="col-span-12 md:col-span-11">
          <FormInput<InvoiceBuilderValues>
            name={`items.${index}.description`}
            label="Opis pozycji"
            placeholder="np. Usługa programistyczna — kwiecień"
            autoComplete="off"
          />
        </div>

        {/* Numeric inputs — three on mobile (qty / unit / price) stacked,
            then VAT controls below. On desktop they share the row. */}
        <div className="col-span-6 md:col-span-2 md:col-start-2">
          <NumericFormInput<InvoiceBuilderValues>
            name={`items.${index}.quantity`}
            label="Ilość"
            placeholder="1"
            step="0.01"
            min={0}
          />
        </div>

        <div className="col-span-6 md:col-span-2">
          <FormInput<InvoiceBuilderValues>
            name={`items.${index}.unit`}
            label="Jednostka"
            placeholder="szt."
          />
        </div>

        <div className="col-span-12 md:col-span-3">
          <NumericFormInput<InvoiceBuilderValues>
            name={`items.${index}.unit_price_net`}
            label="Cena jedn. netto"
            placeholder="0.00"
            step="0.01"
            min={0}
            suffix={currency}
          />
        </div>

        <div className="col-span-7 md:col-span-2">
          <EnumSelectField<InvoiceBuilderValues, VatMode>
            name={`items.${index}.vat_mode`}
            label="VAT"
            options={VAT_MODE_OPTIONS}
          />
        </div>

        <div className="col-span-5 md:col-span-2">
          {isStandard ? (
            <NumericFormInput<InvoiceBuilderValues>
              name={`items.${index}.vat_rate`}
              label="Stawka %"
              placeholder="23"
              step="1"
              min={0}
              max={100}
              suffix="%"
            />
          ) : (
            <div className="space-y-2">
              <span className="block text-sm font-medium text-muted-foreground">Stawka %</span>
              <div className="flex h-12 items-center justify-center rounded-xl border border-dashed border-border/60 bg-muted/30 text-xs text-muted-foreground">
                {VAT_MODE_LABEL[(item?.vat_mode ?? 'standard') as VatMode]}
              </div>
            </div>
          )}
        </div>

        {/* Totals strip — calculated, read-only. Mirrors a "subtotal" row
            in a traditional invoice grid. */}
        <div className="col-span-12 md:col-start-2 md:col-span-11">
          <div
            className={cn(
              SURFACE.cardNested,
              'flex flex-wrap items-center justify-between gap-3 px-3 py-2 text-xs',
            )}
            aria-live="polite"
          >
            <dl className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
              <div className="flex items-baseline gap-1.5">
                <dt className="text-muted-foreground">Netto</dt>
                <dd className="font-mono tabular-nums font-medium text-foreground">
                  {formatMoney(totals.net)}
                </dd>
              </div>
              <div className="flex items-baseline gap-1.5">
                <dt className="text-muted-foreground">VAT</dt>
                <dd className="font-mono tabular-nums">
                  {formatMoney(totals.vat)}
                </dd>
              </div>
              <div className="flex items-baseline gap-1.5">
                <dt className="text-muted-foreground">Brutto</dt>
                <dd className="font-mono tabular-nums font-semibold text-foreground">
                  {formatMoney(totals.gross)}
                </dd>
              </div>
            </dl>

            {/* Desktop-only delete, aligned with the totals strip. */}
            <button
              type="button"
              aria-label={`Usuń pozycję ${index + 1}`}
              disabled={!canDelete}
              onClick={() => onRemove(index)}
              className="hidden md:inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-muted-foreground/80 transition hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive/40 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              Usuń
            </button>
          </div>
        </div>
      </div>
    </li>
  )
})

const VAT_MODE_LABEL: Record<VatMode, string> = {
  standard: 'standard',
  zw:       'zw.',
  np:       'np.',
  rc:       'reverse charge',
}

const VAT_MODE_OPTIONS: ReadonlyArray<{ value: VatMode; label: React.ReactNode; description?: React.ReactNode }> = [
  { value: 'standard', label: 'Standardowa stawka', description: '0 / 5 / 8 / 23 %' },
  { value: 'zw',       label: 'Zwolnione (zw.)',   description: 'Towar / usługa zwolnione z VAT' },
  { value: 'np',       label: 'Nie podlega (np.)', description: 'Poza zakresem polskiego VAT' },
  { value: 'rc',       label: 'Reverse charge',     description: 'Odwrotne obciążenie (UE/eksport)' },
] as const

