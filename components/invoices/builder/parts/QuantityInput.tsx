'use client'

import { forwardRef, useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface QuantityInputProps {
  id?: string
  value: number | undefined
  onChange: (value: number) => void
  onBlur?: () => void
  disabled?: boolean
  className?: string
  'aria-label'?: string
  'aria-invalid'?: boolean
  'aria-describedby'?: string
}

export const QuantityInput = forwardRef<HTMLInputElement, QuantityInputProps>(function QuantityInput(
  { value, onChange, onBlur, className, ...rest },
  ref,
) {
  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const raw = event.target.value.replace(',', '.').trim()
      if (raw === '') {
        onChange(0)
        return
      }
      const parsed = Number(raw)
      if (Number.isFinite(parsed) && parsed >= 0) onChange(parsed)
    },
    [onChange],
  )

  return (
    <Input
      ref={ref}
      type="text"
      inputMode="decimal"
      pattern="[0-9]*[.,]?[0-9]*"
      autoComplete="off"
      value={value === undefined || value === null || Number.isNaN(value) ? '' : String(value)}
      onChange={handleChange}
      onBlur={onBlur}
      className={cn('text-right tabular-nums', className)}
      {...rest}
    />
  )
})
