'use client'

import { Controller, useFormContext, type Control } from 'react-hook-form'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Copy, GripVertical, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import type { InvoiceBuilderValues } from '@/lib/schemas/invoice-builder.schema'
import type { LineTotals } from '@/lib/finance/invoice-builder-engine'
import { formatMoney } from '@/lib/finance/invoice-builder-engine'
import { MoneyInput } from './parts/MoneyInput'
import { QuantityInput } from './parts/QuantityInput'
import { VAT_OPTIONS } from './vat-options'

interface LineItemRowProps {
  index: number
  lineId: string
  totals: LineTotals | undefined
  currency: InvoiceBuilderValues['currency']
  onRemove: () => void
  onDuplicate: () => void
  canRemove: boolean
}

/**
 * Desktop row variant — aligned to a CSS grid that matches the header row so
 * every line lines up pixel-perfectly. Drag handle on the far left, totals
 * on the far right.
 */
export function LineItemRow({
  index,
  lineId,
  totals,
  currency,
  onRemove,
  onDuplicate,
  canRemove,
}: LineItemRowProps) {
  const { control, formState } = useFormContext<InvoiceBuilderValues>()
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: lineId,
  })

  const errors = formState.errors.items?.[index]

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'grid items-start gap-2 rounded-lg border bg-background p-3 text-sm',
        // grid-template-columns mirror the header in LineItemsSection.
        'grid-cols-[auto_minmax(0,3fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1.2fr)_auto]',
        isDragging && 'opacity-60 shadow-lg',
      )}
    >
      <button
        type="button"
        aria-label={`Przeciągnij pozycję ${index + 1}`}
        className="mt-2 cursor-grab touch-none text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>

      <DescriptionField control={control} index={index} errorMessage={errors?.description?.message} />
      <UnitField control={control} index={index} />
      <QuantityField control={control} index={index} errorMessage={errors?.quantity?.message} />
      <UnitPriceField
        control={control}
        index={index}
        currency={currency}
        errorMessage={errors?.unit_price_net?.message}
      />
      <VatField control={control} index={index} />

      <div className="pt-2 text-right font-medium tabular-nums">
        {totals ? formatMoney(totals.gross) : '—'}
      </div>

      <div className="flex items-start gap-1 pt-1">
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
    </div>
  )
}

// ---------------------------------------------------------------------------
// Field primitives — shared with LineItemCard so mobile/desktop render the
// exact same form state via Controller.
// ---------------------------------------------------------------------------

interface FieldProps {
  control: Control<InvoiceBuilderValues>
  index: number
  errorMessage?: string
}

export function DescriptionField({ control, index, errorMessage }: FieldProps) {
  return (
    <Controller
      control={control}
      name={`items.${index}.description` as const}
      render={({ field }) => (
        <div className="min-w-0">
          <Input
            {...field}
            placeholder="Opis usługi / produktu"
            aria-invalid={!!errorMessage}
            aria-label="Opis pozycji"
            className="h-10"
          />
          {errorMessage ? (
            <p role="alert" className="mt-1 text-xs text-destructive">
              {errorMessage}
            </p>
          ) : null}
        </div>
      )}
    />
  )
}

export function UnitField({ control, index }: FieldProps) {
  return (
    <Controller
      control={control}
      name={`items.${index}.unit` as const}
      render={({ field }) => (
        <Input {...field} aria-label="Jednostka miary" placeholder="szt." className="h-10" />
      )}
    />
  )
}

export function QuantityField({ control, index, errorMessage }: FieldProps) {
  return (
    <Controller
      control={control}
      name={`items.${index}.quantity` as const}
      render={({ field }) => (
        <div>
          <QuantityInput
            value={field.value}
            onChange={field.onChange}
            onBlur={field.onBlur}
            aria-label="Ilość"
            aria-invalid={!!errorMessage}
          />
          {errorMessage ? (
            <p role="alert" className="mt-1 text-xs text-destructive">
              {errorMessage}
            </p>
          ) : null}
        </div>
      )}
    />
  )
}

interface UnitPriceFieldProps extends FieldProps {
  currency: InvoiceBuilderValues['currency']
}

export function UnitPriceField({ control, index, currency, errorMessage }: UnitPriceFieldProps) {
  return (
    <Controller
      control={control}
      name={`items.${index}.unit_price_net` as const}
      render={({ field }) => (
        <div>
          <MoneyInput
            value={field.value}
            onChange={field.onChange}
            onBlur={field.onBlur}
            currency={currency}
            aria-label="Cena jednostkowa netto"
            aria-invalid={!!errorMessage}
          />
          {errorMessage ? (
            <p role="alert" className="mt-1 text-xs text-destructive">
              {errorMessage}
            </p>
          ) : null}
        </div>
      )}
    />
  )
}

/**
 * The VAT picker is the only field that conditionally shows TWO controls: a
 * mode selector (standard / zw / np / rc) and — only when `standard` — a
 * numeric rate selector. We collapse them into one Select with grouped
 * options so the UI stays a single tab stop.
 */
export function VatField({ control, index }: FieldProps) {
  return (
    <Controller
      control={control}
      name={`items.${index}.vat_mode` as const}
      render={({ field: modeField }) => (
        <Controller
          control={control}
          name={`items.${index}.vat_rate` as const}
          render={({ field: rateField }) => {
            const value = modeField.value === 'standard' ? `rate:${rateField.value}` : `mode:${modeField.value}`
            return (
              <Select
                value={value}
                onValueChange={(next) => {
                  if (next.startsWith('rate:')) {
                    modeField.onChange('standard')
                    rateField.onChange(Number(next.slice('rate:'.length)))
                  } else {
                    modeField.onChange(next.slice('mode:'.length))
                    rateField.onChange(0)
                  }
                }}
              >
                <SelectTrigger className="h-10" aria-label="Stawka VAT">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {VAT_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )
          }}
        />
      )}
    />
  )
}
