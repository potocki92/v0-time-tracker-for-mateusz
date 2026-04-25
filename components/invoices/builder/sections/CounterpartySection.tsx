'use client'

import { Controller, useFormContext } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import type { InvoiceBuilderValues } from '@/lib/schemas/invoice-builder.schema'
import { SectionCard } from '../parts/SectionCard'

export function CounterpartySection() {
  const { control, watch, formState } = useFormContext<InvoiceBuilderValues>()
  const country = watch('buyer.country_code')
  const isForeign = country.toUpperCase() !== 'PL'
  const errors = formState.errors.buyer

  return (
    <SectionCard
      title="Nabywca"
      description="Dane kontrahenta. Dla kontrahentów spoza PL użyj prefiksu kraju w VAT ID (np. DE123456789)."
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <FieldShell label="Nazwa nabywcy *" htmlFor="buyer-name" error={errors?.name?.message}>
          <Controller
            control={control}
            name="buyer.name"
            render={({ field }) => (
              <Input
                {...field}
                id="buyer-name"
                placeholder="Pełna nazwa firmy"
                aria-invalid={!!errors?.name}
                autoComplete="organization"
              />
            )}
          />
        </FieldShell>

        <FieldShell
          label={isForeign ? 'VAT EU ID' : 'NIP'}
          htmlFor="buyer-tax-id"
          error={errors?.tax_id?.message}
          hint={isForeign ? 'Format: kod kraju + numer (np. DE123456789)' : '10 cyfr'}
        >
          <Controller
            control={control}
            name="buyer.tax_id"
            render={({ field }) => (
              <Input
                {...field}
                id="buyer-tax-id"
                placeholder={isForeign ? 'DE123456789' : '5260250274'}
                aria-invalid={!!errors?.tax_id}
                autoComplete="off"
                inputMode={isForeign ? 'text' : 'numeric'}
              />
            )}
          />
        </FieldShell>
      </div>

      <div className="grid gap-4 sm:grid-cols-[1fr_140px_120px]">
        <FieldShell label="Adres" htmlFor="buyer-address" error={errors?.address?.message}>
          <Controller
            control={control}
            name="buyer.address"
            render={({ field }) => (
              <Input {...field} id="buyer-address" placeholder="Ulica i numer" autoComplete="street-address" />
            )}
          />
        </FieldShell>
        <FieldShell label="Miasto" htmlFor="buyer-city" error={errors?.city?.message}>
          <Controller
            control={control}
            name="buyer.city"
            render={({ field }) => (
              <Input {...field} id="buyer-city" autoComplete="address-level2" />
            )}
          />
        </FieldShell>
        <FieldShell label="Kod pocztowy" htmlFor="buyer-postal" error={errors?.postal_code?.message}>
          <Controller
            control={control}
            name="buyer.postal_code"
            render={({ field }) => (
              <Input {...field} id="buyer-postal" autoComplete="postal-code" />
            )}
          />
        </FieldShell>
      </div>

      <div className="grid gap-4 sm:grid-cols-[120px_1fr_auto] sm:items-end">
        <FieldShell
          label="Kod kraju"
          htmlFor="buyer-country"
          error={errors?.country_code?.message}
          hint="ISO 3166 (PL, DE, US)"
        >
          <Controller
            control={control}
            name="buyer.country_code"
            render={({ field }) => (
              <Input
                {...field}
                id="buyer-country"
                maxLength={2}
                onChange={(event) => field.onChange(event.target.value.toUpperCase())}
                autoComplete="country"
                aria-invalid={!!errors?.country_code}
              />
            )}
          />
        </FieldShell>
        <FieldShell label="E-mail" htmlFor="buyer-email" error={errors?.email?.message}>
          <Controller
            control={control}
            name="buyer.email"
            render={({ field }) => (
              <Input {...field} id="buyer-email" type="email" autoComplete="email" inputMode="email" />
            )}
          />
        </FieldShell>
        <div className="flex items-center justify-between gap-3 rounded-lg border p-3 sm:min-w-[220px]">
          <div>
            <Label htmlFor="buyer-vat-eu" className="text-sm font-medium">
              Płatnik VAT-EU
            </Label>
            <p className="text-xs text-muted-foreground">Włącza Reverse Charge</p>
          </div>
          <Controller
            control={control}
            name="buyer.is_vat_eu"
            render={({ field }) => (
              <Switch id="buyer-vat-eu" checked={field.value} onCheckedChange={field.onChange} />
            )}
          />
        </div>
      </div>
    </SectionCard>
  )
}

interface FieldShellProps {
  label: string
  htmlFor: string
  error?: string
  hint?: string
  children: React.ReactNode
}

function FieldShell({ label, htmlFor, error, hint, children }: FieldShellProps) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {hint && !error ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
      {error ? (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  )
}
