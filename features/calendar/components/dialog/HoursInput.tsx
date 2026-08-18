import { Clock, Minus, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface Props {
  value: number
  onChange: (value: number) => void
}

/**
 * Mobile-first input godzin — duże przyciski +/- po bokach (step 0.5),
 * tabular-nums w środku, dobry target dla kciuka (44x44).
 */
export function HoursInput({ value, onChange }: Props) {
  const clamp = (v: number) => Math.min(24, Math.max(0, v))

  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Godziny
      </Label>
      <div className="flex items-stretch gap-1.5">
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label="Zmniejsz godziny"
          onClick={() => onChange(clamp(value - 0.5))}
          className="h-10 w-10 shrink-0 sm:h-9 sm:w-9"
        >
          <Minus className="h-4 w-4" />
        </Button>

        <div className="relative flex-1">
          <Clock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="number"
            min={0}
            max={24}
            step={0.5}
            value={value}
            onChange={(e) => onChange(clamp(Number(e.target.value)))}
            className="h-10 pl-9 text-center text-base tabular-nums font-semibold sm:h-9 sm:text-sm"
            inputMode="decimal"
          />
        </div>

        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label="Zwiększ godziny"
          onClick={() => onChange(clamp(value + 0.5))}
          className="h-10 w-10 shrink-0 sm:h-9 sm:w-9"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
