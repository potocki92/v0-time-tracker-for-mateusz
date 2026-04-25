'use client'

import { Controller, useFormContext } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { PAYMENT_METHODS, type InvoiceBuilderValues, type PaymentMethod } from '@/lib/schemas/invoice-builder.schema'
import { SectionCard } from '../parts/SectionCard'

const METHOD_LABELS: Record<PaymentMethod, string> = {
  bank_transfer: 'Przelew bankowy',
  card: 'Karta',
  cash: 'Gotówka',
  online: 'Płatność online',
}

export function PaymentSection() {
  const { control, watch, formState } = useFormContext<InvoiceBuilderValues>()
  const method = watch('payment.method')
  const errors = formState.errors

  const showBankFields = method === 'bank_transfer'

  return (
    <SectionCard title="Płatność i uwagi" description="Sposób rozliczenia oraz dodatkowe informacje dla nabywcy.">
      <div className="grid gap-4 sm:grid-cols-2">
        <FieldShell label="Metoda płatności" htmlFor="payment-method">
          <Controller
            control={control}
            name="payment.method"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="payment-method">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map((m) => (
                    <SelectItem key={m} value={m}>
                      {METHOD_LABELS[m]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </FieldShell>

        {showBankFields ? (
          <FieldShell
            label="Numer konta (IBAN)"
            htmlFor="bank-account"
            error={errors.payment?.bank_account?.message}
          >
            <Controller
              control={control}
              name="payment.bank_account"
              render={({ field }) => (
                <Input
                  {...field}
                  id="bank-account"
                  placeholder="PL 12 3456 7890 ..."
                  inputMode="text"
                  autoComplete="off"
                  aria-invalid={!!errors.payment?.bank_account}
                />
              )}
            />
          </FieldShell>
        ) : null}
      </div>

      {showBankFields ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <FieldShell label="Bank" htmlFor="bank-name" error={errors.payment?.bank_name?.message}>
            <Controller
              control={control}
              name="payment.bank_name"
              render={({ field }) => <Input {...field} id="bank-name" placeholder="np. mBank" />}
            />
          </FieldShell>
          <FieldShell label="SWIFT / BIC" htmlFor="swift" error={errors.payment?.swift?.message}>
            <Controller
              control={control}
              name="payment.swift"
              render={({ field }) => (
                <Input
                  {...field}
                  id="swift"
                  placeholder="BREXPLPW"
                  onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                />
              )}
            />
          </FieldShell>
        </div>
      ) : null}

      <FieldShell label="Uwagi" htmlFor="notes" error={errors.notes?.message}>
        <Controller
          control={control}
          name="notes"
          render={({ field }) => (
            <Textarea {...field} id="notes" rows={3} placeholder="Dodatkowe informacje na fakturze..." />
          )}
        />
      </FieldShell>
    </SectionCard>
  )
}

function FieldShell({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string
  htmlFor: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error ? (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  )
}
