import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatNumber } from '@/lib/format'

interface Props {
  unit: string
  from: number
  to: number
  onChangeFrom: (value: number) => void
  onChangeTo: (value: number) => void
}

export function QuantityInput({ unit, from, to, onChangeFrom, onChangeTo }: Props) {
  const diff = to - from

  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Ilość ({unit})
      </Label>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <p className="mb-1 text-2xs uppercase tracking-wide text-muted-foreground">Od</p>
          <Input
            type="number"
            min={0}
            step={0.1}
            value={from}
            onChange={(e) => onChangeFrom(Number(e.target.value))}
            className="h-10 text-base tabular-nums sm:h-9 sm:text-sm"
            inputMode="decimal"
          />
        </div>
        <div>
          <p className="mb-1 text-2xs uppercase tracking-wide text-muted-foreground">Do</p>
          <Input
            type="number"
            min={0}
            step={0.1}
            value={to}
            onChange={(e) => onChangeTo(Number(e.target.value))}
            className="h-10 text-base tabular-nums sm:h-9 sm:text-sm"
            inputMode="decimal"
          />
        </div>
      </div>
      {diff > 0 && (
        <div className="rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
          Różnica:{' '}
          <span className="font-semibold text-foreground tabular-nums">
            {formatNumber(diff, { decimals: 2 })} {unit}
          </span>
        </div>
      )}
    </div>
  )
}
