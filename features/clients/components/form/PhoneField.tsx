'use client'

import * as React from 'react'
import { AnimatePresence, m } from 'framer-motion'
import { useFormContext, useFormState } from 'react-hook-form'

import { Input } from '@/components/ui/input'
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
import type { ClientFormValues } from '../../domain/clientForm.schema'

interface PhoneFieldProps {
  label?: string
}

/**
 * International phone input.
 *
 * The dial code picker and the local number share a single visual control
 * (same height, same radius) but are independent fields in the form state:
 *   - `phone_dial_code`: E.164 country prefix, e.g. `+48`.
 *   - `phone_number`:    local number, free format.
 *
 * The composition yields a single error region below, combining both fields
 * — so the user sees one source of truth per error and the layout does not
 * jump on validation changes.
 */
export function PhoneField({ label = 'Telefon' }: PhoneFieldProps) {
  const { setValue, register, getValues } = useFormContext<ClientFormValues>()
  const { errors } = useFormState<ClientFormValues>({
    name: ['phone_dial_code', 'phone_number'],
  })

  const reactId = React.useId()
  const numberId = `${reactId}-phone-number`
  const errorId = `${reactId}-phone-error`

  const dialError = errors.phone_dial_code?.message as string | undefined
  const numberError = errors.phone_number?.message as string | undefined
  const error = numberError ?? dialError

  const dialCode = getValues('phone_dial_code')
  const [currentDial, setCurrentDial] = React.useState(dialCode)

  React.useEffect(() => {
    setCurrentDial(dialCode)
  }, [dialCode])

  return (
    <div className="space-y-2" data-slot="form-field">
      <Label htmlFor={numberId} className={cn(error && 'text-destructive/90')}>
        {label}
      </Label>

      <div
        className={cn(
          'flex items-stretch gap-0 rounded-xl border border-border/70 bg-background shadow-sm transition',
          'focus-within:border-primary/70 focus-within:ring-2 focus-within:ring-primary/25',
          error && 'border-destructive/55 ring-destructive/10',
        )}
      >
        <Select
          value={currentDial}
          onValueChange={(value) => {
            setCurrentDial(value)
            setValue('phone_dial_code', value, {
              shouldDirty:    true,
              shouldValidate: true,
            })
          }}
        >
          <SelectTrigger
            aria-label="Numer kierunkowy kraju"
            className={cn(
              'h-12 w-[6.5rem] shrink-0 rounded-r-none border-0 border-r border-border/60 bg-transparent',
              'shadow-none focus-visible:ring-0 focus-visible:ring-offset-0',
            )}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {COUNTRIES.map((country) => (
              <SelectItem key={country.code} value={country.dialCode}>
                <span className="inline-flex items-center gap-2">
                  <span aria-hidden="true">{country.flag}</span>
                  <span className="font-mono text-sm">{country.dialCode}</span>
                  <span className="text-muted-foreground">{country.code}</span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input
          id={numberId}
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          placeholder="123 456 789"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          className={cn(
            'h-12 flex-1 rounded-l-none border-0 bg-transparent px-3 text-sm shadow-none',
            'focus-visible:ring-0 focus-visible:ring-offset-0',
          )}
          {...register('phone_number')}
        />
      </div>

      <AnimatePresence initial={false}>
        {error ? (
          <m.p
            key="phone-error"
            id={errorId}
            role="alert"
            initial={{ opacity: 0, y: -4, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -4, height: 0 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="pt-0.5 text-xs text-destructive/75 dark:text-destructive/80"
          >
            {error}
          </m.p>
        ) : null}
      </AnimatePresence>
    </div>
  )
}
