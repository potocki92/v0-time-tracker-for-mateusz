import type { ReactNode } from 'react'
import type { FieldValues, Path } from 'react-hook-form'

export type UniversalFieldType =
  | 'text'
  | 'email'
  | 'password'
  | 'tel'
  | 'url'
  | 'number'
  | 'textarea'

export interface UniversalFieldConfig<TValues extends FieldValues> {
  name:          Path<TValues>
  type?:         UniversalFieldType
  label:         string
  placeholder?:  string
  description?:  string
  autoComplete?: string
  icon?:         ReactNode
  /** Toggle visibility icon for password fields. Default: true for type="password". */
  toggleVisibility?: boolean
  /** Renders extra content on the right side of the label (e.g. "Forgot password?"). */
  labelAction?: ReactNode
  disabled?:    boolean
  /** Override class on the input element. */
  inputClassName?: string
}
