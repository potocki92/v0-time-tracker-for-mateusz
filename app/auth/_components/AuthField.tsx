'use client'

import * as React from 'react'
import { AnimatePresence, m } from 'framer-motion'
import { Eye, EyeOff } from 'lucide-react'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

interface AuthFieldProps {
  name:          string
  label:         string
  type?:         'text' | 'email' | 'password'
  placeholder?:  string
  description?:  string
  autoComplete?: string
  icon?:         React.ReactNode
  /** Komunikat z akcji serwerowej — renderowany pod polem. */
  error?:        string
  disabled?:     boolean
}

/**
 * Pole formularza auth sterowane natywnym `name` + bledami z Server Action.
 *
 * Wizualnie i pod katem dostepnosci to ten sam kontrakt co `FormInput`
 * (ikona, przelacznik widocznosci hasla, `aria-invalid`, animowany blad),
 * tyle ze bez React Hook Form — auth ma zostac poza bundlem walidatora.
 */
export function AuthField({
  name,
  label,
  type = 'text',
  placeholder,
  description,
  autoComplete,
  icon,
  error,
  disabled,
}: AuthFieldProps) {
  const reactId = React.useId()
  const fieldId = `${reactId}-${name}`
  const errorId = `${fieldId}-error`
  const descId  = description ? `${fieldId}-description` : undefined

  const [revealed, setRevealed] = React.useState(false)
  const isPassword = type === 'password'
  const effectiveType = isPassword && revealed ? 'text' : type

  return (
    <div className="space-y-2" data-slot="form-field">
      <Label
        htmlFor={fieldId}
        className={cn(
          'text-sm font-medium transition-colors',
          error && 'text-destructive/90',
        )}
      >
        {label}
      </Label>

      <div className="relative group">
        {icon ? (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-muted-foreground/80 transition-colors group-focus-within:text-primary"
          >
            {icon}
          </span>
        ) : null}

        <Input
          id={fieldId}
          name={name}
          type={effectiveType}
          placeholder={placeholder}
          autoComplete={autoComplete}
          disabled={disabled}
          aria-invalid={!!error}
          aria-describedby={
            [descId, error ? errorId : undefined].filter(Boolean).join(' ') || undefined
          }
          className={cn(
            'h-12 rounded-xl border-input-border bg-background px-4 text-sm shadow-sm transition',
            'focus-visible:border-primary/70 focus-visible:ring-primary/25',
            'aria-invalid:border-destructive/55 aria-invalid:ring-destructive/10 dark:aria-invalid:ring-destructive/20',
            icon && 'pl-11',
            isPassword && 'pr-12',
          )}
        />

        {isPassword ? (
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
        {error ? (
          <m.p
            key="error"
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

/**
 * Przycisk submit dla formularzy auth — `pending` przychodzi z
 * `useActionState`, a nie ze stanu React Hook Form.
 */
export function AuthSubmitButton({
  pending,
  pendingLabel,
  children,
}: {
  pending:       boolean
  pendingLabel:  React.ReactNode
  children:      React.ReactNode
}) {
  return (
    <button
      type="submit"
      disabled={pending}
      className={cn(
        'relative mt-2 inline-flex h-12 w-full items-center justify-center gap-2 overflow-hidden',
        'rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground tracking-tight',
        'shadow-md shadow-primary/20 transition-all duration-200',
        'hover:shadow-lg hover:shadow-primary/30 hover:brightness-[1.04] active:scale-[0.99]',
        'disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card',
      )}
    >
      <span className="inline-flex items-center gap-2">
        {pending ? (
          <>
            <SpinnerIcon />
            {pendingLabel}
          </>
        ) : (
          children
        )}
      </span>
    </button>
  )
}

function SpinnerIcon() {
  return (
    <svg
      className="h-4 w-4 animate-spin"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeOpacity="0.25"
        strokeWidth="4"
      />
      <path
        d="M12 2a10 10 0 0 1 10 10"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
      />
    </svg>
  )
}
