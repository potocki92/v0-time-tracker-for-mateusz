'use client'

import * as React from 'react'
import {
  FormProvider,
  useForm,
  useFormContext,
  useFormState,
  type DefaultValues,
  type FieldValues,
  type Resolver,
  type SubmitHandler,
  type UseFormReturn,
} from 'react-hook-form'

import { cn } from '@/lib/utils'
import { MotionProvider } from '@/components/common/motion-provider'

import { FormInput } from './FormInput'
import type { UniversalFieldConfig } from './types'

export interface UniversalFormProps<TValues extends FieldValues> {
  /** Zod/Yup/etc. resolver — decouples form from validator impl. */
  resolver:      Resolver<TValues>
  defaultValues: DefaultValues<TValues>
  onSubmit:      SubmitHandler<TValues>
  /** Declarative field list — renders FormInput for each entry. */
  fields?:       ReadonlyArray<UniversalFieldConfig<TValues>>
  /** Custom content receives the RHF return value for advanced composition. */
  children?:     ReactOrRenderChildren<TValues>
  /** Optional label to render as form's `aria-label`. */
  ariaLabel?:    string
  id?:           string
  className?:    string
  /** When true, disables fields while submission is in-flight. Default: true. */
  disableOnSubmit?: boolean
  /** Resets form when `defaultValues` changes (useful for edit/create dialogs). */
  resetOnDefaultValuesChange?: boolean
}

type ReactOrRenderChildren<TValues extends FieldValues> =
  | React.ReactNode
  | ((form: UseFormReturn<TValues>) => React.ReactNode)

/**
 * Fully generic, reusable form wrapper built on top of React Hook Form.
 *
 * Features:
 *  - Resolver-agnostic (Zod, Yup, custom) — pass any `Resolver<T>`.
 *  - `mode: 'onBlur'` + `reValidateMode: 'onChange'` for UX that feels snappy
 *    without spamming errors while typing.
 *  - Declarative `fields` prop OR imperative `children` (function-as-child) for
 *    advanced composition (custom inputs, sections, layouts).
 *  - Subscribes to `isSubmitting` via `useFormState` to disable fieldset,
 *    so re-renders stay scoped.
 *
 * Usage:
 *   <UniversalForm resolver={zodResolver(schema)} defaultValues={...} onSubmit={...}
 *                  fields={LOGIN_FIELDS}>
 *     <SubmitButton>Zaloguj</SubmitButton>
 *   </UniversalForm>
 */
export function UniversalForm<TValues extends FieldValues>({
  resolver,
  defaultValues,
  onSubmit,
  fields,
  children,
  ariaLabel,
  id,
  className,
  disableOnSubmit = true,
  resetOnDefaultValuesChange = false,
}: UniversalFormProps<TValues>) {
  const methods = useForm<TValues>({
    resolver,
    defaultValues,
    mode:           'onBlur',
    reValidateMode: 'onChange',
    shouldFocusError: true,
    criteriaMode:     'firstError',
  })

  React.useEffect(() => {
    if (!resetOnDefaultValuesChange) return
    methods.reset(defaultValues)
  }, [defaultValues, methods, resetOnDefaultValuesChange])

  return (
    <MotionProvider>
      <FormProvider {...methods}>
        <form
          id={id}
          aria-label={ariaLabel}
          noValidate
          onSubmit={methods.handleSubmit(onSubmit)}
          className={cn('space-y-6', className)}
        >
          <FormSubmittingFieldset enabled={disableOnSubmit}>
            {fields?.map((field) => (
              <FormInput<TValues> key={String(field.name)} {...field} />
            ))}
            {typeof children === 'function' ? children(methods) : children}
          </FormSubmittingFieldset>
        </form>
      </FormProvider>
    </MotionProvider>
  )
}

/**
 * Fieldset wrapper that disables all inputs while the form is submitting.
 * Isolated component so `useFormState` re-renders only this subtree.
 */
function FormSubmittingFieldset({
  children,
  enabled,
}: {
  children: React.ReactNode
  enabled:  boolean
}) {
  const { isSubmitting } = useFormState()
  return (
    <fieldset
      disabled={enabled && isSubmitting}
      className="contents disabled:opacity-90"
    >
      {children}
    </fieldset>
  )
}

/**
 * Submit button wired to RHF form state. Shows a loader while submitting.
 * Must be used inside a <UniversalForm> (or any RHF FormProvider).
 */
export interface SubmitButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'type'> {
  pendingLabel?: React.ReactNode
  /** When true, button is disabled unless form is valid. Default: false — schema is source of truth on submit. */
  requireValid?: boolean
  /** When true, disable until form is dirty. Default: false. */
  requireDirty?: boolean
}

export const SubmitButton = React.forwardRef<
  HTMLButtonElement,
  SubmitButtonProps
>(function SubmitButton(
  {
    children,
    pendingLabel,
    className,
    disabled,
    requireValid = false,
    requireDirty = false,
    ...rest
  },
  ref,
) {
  useFormContext()
  const { isSubmitting, isValid, isDirty } = useFormState()
  const isDisabled =
    disabled ||
    isSubmitting ||
    (requireValid && !isValid) ||
    (requireDirty && !isDirty)

  return (
    <button
      ref={ref}
      type="submit"
      disabled={isDisabled}
      className={cn(
        'relative mt-2 inline-flex h-12 w-full items-center justify-center gap-2 overflow-hidden',
        'rounded-xl bg-primary px-5 text-[0.95rem] font-semibold text-primary-foreground tracking-tight',
        'shadow-md shadow-primary/20 transition-all duration-200',
        'hover:shadow-lg hover:shadow-primary/30 hover:brightness-[1.04] active:scale-[0.99]',
        'disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card',
        className,
      )}
      {...rest}
    >
      <span
        className="inline-flex items-center gap-2"
      >
        {isSubmitting ? (
          <>
            <SpinnerIcon />
            {pendingLabel ?? children}
          </>
        ) : (
          children
        )}
      </span>
    </button>
  )
})

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
