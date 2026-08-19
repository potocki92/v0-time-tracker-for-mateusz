'use client'

import * as React from 'react'

import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

import { COUNTRIES } from '../../domain/clientForm.i18n'

interface CountrySelectProps {
  id?:         string
  label:       string
  value:       string
  onChange:    (code: string) => void
  required?:   boolean
  error?:      string
  description?: string
}

/**
 * Accessible country picker. Uses the shared Radix Select primitive
 * (so we inherit keyboard support, portal, typeahead for free). Flags are
 * emoji to avoid any static asset dependency.
 */
export function CountrySelect({
  id,
  label,
  value,
  onChange,
  required,
  error,
  description,
}: CountrySelectProps) {
  const reactId = React.useId()
  const triggerId = id ?? `${reactId}-country`
  const errorId = `${triggerId}-error`
  const descId = description ? `${triggerId}-desc` : undefined

  return (
    <div className="space-y-2" data-slot="form-field">
      <Label htmlFor={triggerId} className={cn(error && 'text-destructive/90')}>
        {label}
        {required ? <span aria-hidden="true" className="ml-0.5 text-destructive/80">*</span> : null}
      </Label>

      <Select value={value} onValueChange={onChange}>
        <SelectTrigger
          id={triggerId}
          aria-invalid={Boolean(error)}
          aria-required={required}
          aria-describedby={[descId, error ? errorId : undefined].filter(Boolean).join(' ') || undefined}
          className={cn(
            'h-12 w-full rounded-xl border-border/70 bg-background px-4 text-sm shadow-sm',
            'focus-visible:border-primary/70 focus-visible:ring-primary/25',
            error && 'border-destructive/55 ring-destructive/10',
          )}
        >
          <SelectValue placeholder="Wybierz kraj" />
        </SelectTrigger>
        <SelectContent>
          {COUNTRIES.map((country) => (
            <SelectItem key={country.code} value={country.code}>
              <span className="inline-flex items-center gap-2">
                <span aria-hidden="true">{country.flag}</span>
                <span>{country.name}</span>
                <span className="text-muted-foreground">({country.code})</span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {description ? (
        <p id={descId} className="text-xs text-muted-foreground">
          {description}
        </p>
      ) : null}

      {error ? (
        <p id={errorId} role="alert" className="pt-0.5 text-xs text-destructive/75">
          {error}
        </p>
      ) : null}
    </div>
  )
}
