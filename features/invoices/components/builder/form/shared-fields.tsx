'use client'

import * as React from 'react'
import {
  useFormContext,
  useFormState,
  type FieldPath,
  type FieldValues,
} from 'react-hook-form'
import { AnimatePresence, motion } from 'framer-motion'

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

import { DIALOG_DARK_SURFACE } from '../../dialog-theme'

/**
 * Bridge helpers that follow the same visual language as `<FormInput>` from
 * `components/common/form` but cover two cases that the generic FormInput
 * does not support out of the box:
 *
 *  1. **NumericFormInput** — number input with `inputMode="decimal"` (so
 *     iOS / Android open the numeric keyboard) and a string-based RHF
 *     binding. We deliberately avoid `valueAsNumber` here because it
 *     produces `NaN` for an empty field, which forces ugly UX
 *     ("0" stuck while typing). Instead we let Zod's `coerce.number` do
 *     the conversion at validation time.
 *
 *  2. **EnumSelectField** — accessible Radix Select wired to a single RHF
 *     field path. Used for currency, language, payment method, VAT mode.
 *
 * Both components subscribe to per-field error state via `useFormState`
 * (scoped re-renders) and animate error reveals via Framer Motion to
 * stay visually consistent with the rest of the form chrome.
 */

const SOFT_INVALID_CLASS =
  'aria-invalid:border-destructive/55 aria-invalid:ring-destructive/10 dark:aria-invalid:ring-destructive/20'

const INPUT_BASE_CLASS =
  'h-12 rounded-xl border-border/70 bg-background px-4 text-[0.95rem] shadow-sm transition focus-visible:border-primary/70 focus-visible:ring-primary/25'

const TRIGGER_BASE_CLASS =
  'h-12 w-full rounded-xl border-border/70 bg-background px-4 text-[0.95rem] shadow-sm focus-visible:border-primary/70 focus-visible:ring-primary/25'

// ---------------------------------------------------------------------------
// FieldShell — reused chrome (label, description, animated error message)
// ---------------------------------------------------------------------------

interface FieldShellProps {
  fieldId:      string
  label?:       React.ReactNode
  required?:    boolean
  description?: React.ReactNode
  error?:       string
  className?:   string
  children:     React.ReactNode
}

function FieldShell({
  fieldId,
  label,
  required,
  description,
  error,
  className,
  children,
}: FieldShellProps) {
  const errorId = `${fieldId}-error`
  const descId = description ? `${fieldId}-desc` : undefined

  return (
    <div className={cn('space-y-2', className)} data-slot="form-field">
      {label ? (
        <Label
          htmlFor={fieldId}
          className={cn(
            'text-sm font-medium transition-colors',
            error && 'text-destructive/90',
          )}
        >
          {label}
          {required ? (
            <span aria-hidden="true" className="ml-0.5 text-destructive/80">*</span>
          ) : null}
        </Label>
      ) : null}

      {/* Render children with the wiring needed for a11y. */}
      {React.cloneElement(children as React.ReactElement<{ id?: string; 'aria-describedby'?: string }>, {
        id: fieldId,
        'aria-describedby':
          [descId, error ? errorId : undefined].filter(Boolean).join(' ') ||
          undefined,
      })}

      {description ? (
        <p id={descId} className="text-xs text-muted-foreground">
          {description}
        </p>
      ) : null}

      <AnimatePresence initial={false}>
        {error ? (
          <motion.p
            key="error"
            id={errorId}
            role="alert"
            initial={{ opacity: 0, y: -4, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -4, height: 0 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="pt-0.5 text-[13px] text-destructive/75 dark:text-destructive/80"
          >
            {error}
          </motion.p>
        ) : null}
      </AnimatePresence>
    </div>
  )
}

// ---------------------------------------------------------------------------
// NumericFormInput
// ---------------------------------------------------------------------------

interface NumericFormInputProps<TValues extends FieldValues> {
  name:         FieldPath<TValues>
  label?:       React.ReactNode
  required?:    boolean
  placeholder?: string
  description?: React.ReactNode
  /** Step in major units (default "0.01" for money / "1" for integers). */
  step?:        string
  min?:         number
  max?:         number
  /** Visual hint inside the input (e.g. currency code). */
  suffix?:      React.ReactNode
  className?:   string
  inputClassName?: string
  disabled?:    boolean
  ariaLabel?:   string
}

/**
 * Numeric input that opens a decimal keyboard on mobile, prevents the
 * scroll-wheel from changing the value (a notorious source of accidental
 * money mutations), and uses a string binding so empty inputs don't
 * collapse to NaN.
 */
export function NumericFormInput<TValues extends FieldValues>({
  name,
  label,
  required,
  placeholder,
  description,
  step = '0.01',
  min,
  max,
  suffix,
  className,
  inputClassName,
  disabled,
  ariaLabel,
}: NumericFormInputProps<TValues>) {
  const { register } = useFormContext<TValues>()
  const { errors, isSubmitting } = useFormState<TValues>({ name })
  const fieldError = getNestedError(errors, name)

  const reactId = React.useId()
  const fieldId = `${reactId}-numeric`

  return (
    <FieldShell
      fieldId={fieldId}
      label={label}
      required={required}
      description={description}
      error={fieldError}
      className={className}
    >
      <div className="relative">
        <Input
          {...register(name)}
          type="number"
          inputMode="decimal"
          step={step}
          min={min}
          max={max}
          placeholder={placeholder}
          aria-invalid={Boolean(fieldError)}
          aria-required={required}
          aria-label={ariaLabel}
          disabled={disabled || isSubmitting}
          onWheel={(event) => {
            // Block wheel events from mutating focused number inputs —
            // a long-standing Chrome footgun for currency fields.
            if (document.activeElement === event.currentTarget) {
              event.currentTarget.blur()
            }
          }}
          className={cn(
            INPUT_BASE_CLASS,
            'font-mono tabular-nums',
            // Hide the spin buttons; users have step controls or just type.
            '[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none',
            SOFT_INVALID_CLASS,
            suffix && 'pr-14',
            inputClassName,
          )}
        />
        {suffix ? (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs font-medium text-muted-foreground"
          >
            {suffix}
          </span>
        ) : null}
      </div>
    </FieldShell>
  )
}

// ---------------------------------------------------------------------------
// EnumSelectField
// ---------------------------------------------------------------------------

export interface EnumOption<TValue extends string = string> {
  value: TValue
  label: React.ReactNode
  /** Optional helper line shown under the option label. */
  description?: React.ReactNode
}

interface EnumSelectFieldProps<TValues extends FieldValues, TValue extends string> {
  name:         FieldPath<TValues>
  options:      ReadonlyArray<EnumOption<TValue>>
  label?:       React.ReactNode
  required?:    boolean
  placeholder?: string
  description?: React.ReactNode
  className?:   string
  triggerClassName?: string
  disabled?:    boolean
  /** Optional callback fired alongside RHF setValue (e.g. for derived fields). */
  onChange?:    (value: TValue) => void
}

/**
 * Single-value Select bound to a RHF field. We use `setValue` rather than
 * `Controller` here because the field is small enough that a direct write
 * keeps the implementation simple and stays consistent with how the
 * clients form drives its Selects.
 */
export function EnumSelectField<
  TValues extends FieldValues,
  TValue extends string = string,
>({
  name,
  options,
  label,
  required,
  placeholder,
  description,
  className,
  triggerClassName,
  disabled,
  onChange,
}: EnumSelectFieldProps<TValues, TValue>) {
  const { setValue, watch } = useFormContext<TValues>()
  const { errors } = useFormState<TValues>({ name })
  const value = watch(name) as TValue | undefined
  const fieldError = getNestedError(errors, name)

  const reactId = React.useId()
  const fieldId = `${reactId}-select`

  return (
    <FieldShell
      fieldId={fieldId}
      label={label}
      required={required}
      description={description}
      error={fieldError}
      className={className}
    >
      <Select
        value={value ?? ''}
        onValueChange={(next) => {
          setValue(name, next as never, {
            shouldDirty:    true,
            shouldValidate: true,
          })
          onChange?.(next as TValue)
        }}
        disabled={disabled}
      >
        <SelectTrigger
          aria-invalid={Boolean(fieldError)}
          aria-required={required}
          className={cn(TRIGGER_BASE_CLASS, fieldError && 'border-destructive/55 ring-destructive/10', triggerClassName)}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent className={DIALOG_DARK_SURFACE}>
          {options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.description ? (
                <span className="flex flex-col">
                  <span>{opt.label}</span>
                  <span className="text-xs text-muted-foreground">{opt.description}</span>
                </span>
              ) : (
                opt.label
              )}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FieldShell>
  )
}

// ---------------------------------------------------------------------------
// Internal — extract a nested error message from RHF's `errors` tree.
// ---------------------------------------------------------------------------

function getNestedError(
  errors: Record<string, unknown>,
  path: string,
): string | undefined {
  const parts = path.split('.')
  let cursor: unknown = errors
  for (const part of parts) {
    if (cursor && typeof cursor === 'object' && part in (cursor as object)) {
      cursor = (cursor as Record<string, unknown>)[part]
    } else {
      return undefined
    }
  }
  if (cursor && typeof cursor === 'object' && 'message' in cursor) {
    const message = (cursor as { message?: unknown }).message
    return typeof message === 'string' ? message : undefined
  }
  return undefined
}
