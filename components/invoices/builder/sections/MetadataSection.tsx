'use client'

import { Controller, useFormContext } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  INVOICE_BUILDER_CURRENCIES,
  INVOICE_LANGUAGES,
  type InvoiceBuilderValues,
  type InvoiceLanguage,
} from '@/lib/schemas/invoice-builder.schema'
import { SectionCard } from '../parts/SectionCard'
import { MoneyInput } from '../parts/MoneyInput'

const LANGUAGE_LABELS: Record<InvoiceLanguage, string> = {
  pl: 'Polski',
  en: 'Angielski',
  pl_en: 'Polski + Angielski',
}

export function MetadataSection() {
  const { control, watch, formState } = useFormContext<InvoiceBuilderValues>()
  const currency = watch('currency')
  const errors = formState.errors

  const showFx = currency !== 'PLN'

  return (
    <SectionCard
      title="Metadane faktury"
      description="Numer, daty, waluta i język. Termin płatności nie może wyprzedzać daty wystawienia."
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Numer faktury *" htmlFor="invoice-number" error={errors.invoice_number?.message}>
          <Controller
            control={control}
            name="invoice_number"
            render={({ field }) => (
              <Input
                {...field}
                id="invoice-number"
                placeholder="FV/04/2026/01"
                aria-invalid={!!errors.invoice_number}
              />
            )}
          />
        </Field>

        <Field label="Data wystawienia *" htmlFor="issue-date" error={errors.issue_date?.message}>
          <Controller
            control={control}
            name="issue_date"
            render={({ field }) => (
              <Input {...field} id="issue-date" type="date" aria-invalid={!!errors.issue_date} />
            )}
          />
        </Field>

        <Field label="Data sprzedaży *" htmlFor="sale-date" error={errors.sale_date?.message}>
          <Controller
            control={control}
            name="sale_date"
            render={({ field }) => (
              <Input {...field} id="sale-date" type="date" aria-invalid={!!errors.sale_date} />
            )}
          />
        </Field>

        <Field label="Termin płatności *" htmlFor="due-date" error={errors.due_date?.message}>
          <Controller
            control={control}
            name="due_date"
            render={({ field }) => (
              <Input {...field} id="due-date" type="date" aria-invalid={!!errors.due_date} />
            )}
          />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Waluta" htmlFor="currency">
          <Controller
            control={control}
            name="currency"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="currency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INVOICE_BUILDER_CURRENCIES.map((code) => (
                    <SelectItem key={code} value={code}>
                      {code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </Field>

        {showFx ? (
          <>
            <Field
              label={`Kurs ${currency}/PLN`}
              htmlFor="fx-rate"
              error={errors.exchange_rate?.message}
              hint="Opcjonalny — używany do podsumowania w PLN"
            >
              <Controller
                control={control}
                name="exchange_rate"
                render={({ field }) => (
                  <MoneyInput
                    id="fx-rate"
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    aria-label={`Kurs ${currency} do PLN`}
                  />
                )}
              />
            </Field>

            <Field label="Data kursu" htmlFor="fx-date" error={errors.exchange_rate_date?.message}>
              <Controller
                control={control}
                name="exchange_rate_date"
                render={({ field }) => (
                  <Input {...field} id="fx-date" type="date" value={field.value ?? ''} />
                )}
              />
            </Field>
          </>
        ) : null}

        <Field label="Język faktury" htmlFor="language">
          <Controller
            control={control}
            name="language"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="language">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INVOICE_LANGUAGES.map((lang) => (
                    <SelectItem key={lang} value={lang}>
                      {LANGUAGE_LABELS[lang]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </Field>
      </div>
    </SectionCard>
  )
}

interface FieldProps {
  label: string
  htmlFor: string
  error?: string
  hint?: string
  children: React.ReactNode
}

function Field({ label, htmlFor, error, hint, children }: FieldProps) {
  const hintId = hint ? `${htmlFor}-hint` : undefined
  const errorId = error ? `${htmlFor}-error` : undefined
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {hint && !error ? (
        <p id={hintId} className="text-xs text-muted-foreground">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} role="alert" className="text-xs text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  )
}
