'use client'

import { forwardRef, useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface MoneyInputProps {
  id?: string
  name?: string
  value: number | undefined
  onChange: (value: number) => void
  onBlur?: () => void
  placeholder?: string
  currency?: string
  disabled?: boolean
  className?: string
  'aria-label'?: string
  'aria-invalid'?: boolean
  'aria-describedby'?: string
}

/**
 * Money input. Uses inputMode="decimal" so iOS/Android render the numeric
 * keypad (with a decimal separator) rather than the full QWERTY keyboard.
 * We deliberately avoid `type="number"` because it breaks comma-as-decimal
 * locales, blocks the scroll-to-change gesture, and refuses to emit
 * intermediate strings like "12." while the user is still typing.
 */
export const MoneyInput = forwardRef<HTMLInputElement, MoneyInputProps>(function MoneyInput(
  { value, onChange, onBlur, currency, className, ...rest },
  ref,
) {
  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const raw = event.target.value.replace(',', '.').trim()
      if (raw === '' || raw === '-') {
        onChange(0)
        return
      }
      // Allow incremental typing like "12." by tolerating trailing dot.
      const parsed = Number(raw)
      if (Number.isFinite(parsed)) onChange(parsed)
    },
    [onChange],
  )

  return (
    <div className={cn('relative', className)}>
      <Input
        ref={ref}
        type="text"
        inputMode="decimal"
        pattern="[0-9]*[.,]?[0-9]*"
        autoComplete="off"
        value={value === undefined || value === null || Number.isNaN(value) ? '' : String(value)}
        onChange={handleChange}
        onBlur={onBlur}
        className={cn(currency ? 'pr-14 text-right tabular-nums' : 'text-right tabular-nums')}
        {...rest}
      />
      {currency ? (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs font-medium text-muted-foreground"
        >
          {currency}
        </span>
      ) : null}
    </div>
  )
})
