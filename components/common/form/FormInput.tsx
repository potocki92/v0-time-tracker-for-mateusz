'use client'

import * as React from 'react'
import { useFormContext, useFormState, type FieldValues } from 'react-hook-form'
import { AnimatePresence, motion } from 'framer-motion'
import { Eye, EyeOff } from 'lucide-react'

import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

import type { UniversalFieldConfig } from './types'

interface FormInputProps<TValues extends FieldValues>
  extends UniversalFieldConfig<TValues> {
  className?: string
}

/**
 * Field renderer driven purely by React Hook Form context.
 *
 * - Uses `register` (uncontrolled) for zero re-renders on keystroke.
 * - `useFormState({ name })` subscribes only to this field's error state,
 *   so parent components don't re-render when other fields change.
 * - Softer aria-invalid styling (reduced ring opacity, gentler red)
 *   — full-strength destructive is reserved for critical UI.
 * - Animated error reveal via Framer Motion.
 */
export function FormInput<TValues extends FieldValues>({
  name,
  type = 'text',
  label,
  placeholder,
  description,
  autoComplete,
  icon,
  toggleVisibility,
  labelAction,
  disabled,
  inputClassName,
  className,
}: FormInputProps<TValues>) {
  const { register } = useFormContext<TValues>()
  const { errors, isSubmitting } = useFormState<TValues>({ name })
  const error = errors[name as keyof typeof errors] as
    | { message?: string }
    | undefined

  const reactId = React.useId()
  const fieldId = `${reactId}-${String(name)}`
  const errorId = `${fieldId}-error`
  const descId  = description ? `${fieldId}-description` : undefined

  const [revealed, setRevealed] = React.useState(false)
  const isPassword = type === 'password'
  const showToggle = toggleVisibility ?? isPassword
  const effectiveType = isPassword && revealed ? 'text' : type

  const hasIcon  = Boolean(icon)
  const hasRight = showToggle && isPassword

  const commonProps = {
    id: fieldId,
    'aria-invalid': !!error,
    'aria-describedby':
      [descId, error ? errorId : undefined].filter(Boolean).join(' ') ||
      undefined,
    autoComplete,
    placeholder,
    disabled: disabled || isSubmitting,
  } as const

  const softInvalidClass =
    'aria-invalid:border-destructive/55 aria-invalid:ring-destructive/10 dark:aria-invalid:ring-destructive/20'

  return (
    <div className={cn('space-y-2', className)} data-slot="form-field">
      <div className="flex items-center justify-between gap-2">
        <Label
          htmlFor={fieldId}
          className={cn(
            'text-sm font-medium transition-colors',
            error && 'text-destructive/90',
          )}
        >
          {label}
        </Label>
        {labelAction}
      </div>

      <div className="relative group">
        {hasIcon ? (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-muted-foreground/80 transition-colors group-focus-within:text-primary"
          >
            {icon}
          </span>
        ) : null}

        {type === 'textarea' ? (
          <Textarea
            {...commonProps}
            {...register(name)}
            className={cn(
              'min-h-[112px] resize-none rounded-xl border-border/70 bg-background px-4 py-3 text-[0.95rem] shadow-sm transition',
              'focus-visible:border-primary/70 focus-visible:ring-primary/25',
              softInvalidClass,
              hasIcon && 'pl-11',
              inputClassName,
            )}
          />
        ) : (
          <Input
            {...commonProps}
            {...register(
              name,
              type === 'number' ? { valueAsNumber: true } : undefined,
            )}
            type={effectiveType}
            className={cn(
              'h-12 rounded-xl border-border/70 bg-background px-4 text-[0.95rem] shadow-sm transition',
              'focus-visible:border-primary/70 focus-visible:ring-primary/25',
              softInvalidClass,
              hasIcon && 'pl-11',
              hasRight && 'pr-12',
              inputClassName,
            )}
          />
        )}

        {hasRight ? (
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setRevealed((v) => !v)}
            aria-label={revealed ? 'Ukryj hasło' : 'Pokaż hasło'}
            aria-pressed={revealed}
            className="absolute inset-y-0 right-2 flex items-center justify-center rounded-lg px-2 text-muted-foreground/80 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {revealed ? (
              <EyeOff className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Eye className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
        ) : null}
      </div>

      {description ? (
        <p id={descId} className="text-xs text-muted-foreground">
          {description}
        </p>
      ) : null}

      <AnimatePresence initial={false}>
        {error?.message ? (
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
            {error.message}
          </motion.p>
        ) : null}
      </AnimatePresence>
    </div>
  )
}
