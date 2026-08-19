'use client'

import * as React from 'react'
import { useFormContext, useWatch } from 'react-hook-form'

import { FormInput } from '@/components/common/form'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'

import { CLIENT_COLORS } from '../../domain/clients.constants'
import {
  CURRENCIES,
  LOCALES,
  TIMEZONES,
  getCountryOrDefault,
} from '../../domain/clientForm.i18n'
import type { ClientFormValues } from '../../domain/clientForm.schema'
import { CountrySelect } from './CountrySelect'
import { FormSection } from './FormSection'
import { PhoneField } from './PhoneField'

interface ClientFormFieldsProps {
  isEditMode: boolean
}

export function ClientFormFields({ isEditMode }: ClientFormFieldsProps) {
  const { setValue, getValues, trigger, formState, control } =
    useFormContext<ClientFormValues>()

  // Subscribe only to the fields that drive conditional UI — keeps re-renders
  // tight (other field changes don't bubble up here).
  const countryCode     = useWatch({ control, name: 'country_code' })
  const workType        = useWatch({ control, name: 'work_type' })
  const currency        = useWatch({ control, name: 'currency' })
  const locale          = useWatch({ control, name: 'locale' })
  const timezone        = useWatch({ control, name: 'timezone' })
  const color           = useWatch({ control, name: 'color' })
  const isDefault       = useWatch({ control, name: 'is_default' })
  const autoInvoice     = useWatch({ control, name: 'auto_invoice_enabled' })
  const autoInvoiceFreq = useWatch({ control, name: 'auto_invoice_frequency' })

  const country = getCountryOrDefault(countryCode)

  /**
   * When the user switches countries we propose matching dial code / locale /
   * timezone — but only for fields they haven't explicitly touched, so we
   * don't stomp on manual overrides. RHF's `dirtyFields` is the source of
   * truth for "did the user interact with this".
   */
  const handleCountryChange = React.useCallback(
    (code: string) => {
      const next = getCountryOrDefault(code)
      const dirty = formState.dirtyFields

      setValue('country_code', code, { shouldDirty: true, shouldValidate: true })

      if (!dirty.phone_dial_code) {
        setValue('phone_dial_code', next.dialCode, { shouldDirty: false })
      }
      if (!dirty.locale) {
        setValue('locale', next.locale, { shouldDirty: false })
      }
      if (!dirty.timezone) {
        setValue('timezone', next.timezone, { shouldDirty: false })
      }

      // Clear postal code if it no longer fits the new country's format —
      // better than leaving a stale invalid value on screen.
      const currentPostal = getValues('postal_code')
      if (currentPostal && next.postalCode && !next.postalCode.test(currentPostal)) {
        setValue('postal_code', '', { shouldDirty: true, shouldValidate: true })
      }

      // Re-run validation on fields whose rules depend on the country.
      void trigger(['nip', 'regon', 'postal_code'])
    },
    [formState.dirtyFields, getValues, setValue, trigger],
  )

  return (
    <div className="space-y-5">
      {/* ── Dane podstawowe ─────────────────────────────────────────── */}
      <FormSection
        title="Dane podstawowe"
        description="Nazwa klienta, kraj działalności oraz identyfikatory podatkowe."
      >
        <FormInput<ClientFormValues>
          name="name"
          label="Nazwa *"
          placeholder="Nazwa firmy lub klienta"
          autoComplete="organization"
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <CountrySelect
            label="Kraj klienta"
            required
            value={countryCode}
            onChange={handleCountryChange}
            description="Zmienia format NIP/VAT, kodu pocztowego oraz numer kierunkowy."
          />

          <FormInput<ClientFormValues>
            name="nip"
            label={country.taxIdLabel}
            placeholder={country.taxIdHint}
            autoComplete="off"
            inputClassName="font-mono tracking-tight"
          />
        </div>

        {countryCode === 'PL' ? (
          <FormInput<ClientFormValues>
            name="regon"
            label="REGON"
            placeholder="9 lub 14 cyfr"
            autoComplete="off"
            inputClassName="font-mono tracking-tight"
          />
        ) : null}
      </FormSection>

      {/* ── Dane kontaktowe ─────────────────────────────────────────── */}
      <FormSection
        title="Dane kontaktowe"
        description="E-mail, telefon z kierunkiem kraju i strona WWW."
      >
        <FormInput<ClientFormValues>
          name="email"
          type="email"
          label="E-mail"
          placeholder="kontakt@example.com"
          autoComplete="email"
        />

        <PhoneField />

        <FormInput<ClientFormValues>
          name="website"
          type="text"
          label="Strona WWW"
          placeholder="https://example.com"
          autoComplete="url"
        />
      </FormSection>

      {/* ── Adres ───────────────────────────────────────────────────── */}
      <FormSection
        title="Adres"
        description="Uzupełnij, jeśli wystawiasz klientowi faktury lub dokumenty."
      >
        <FormInput<ClientFormValues>
          name="address"
          label="Ulica i numer"
          placeholder="ul. Marszałkowska 1/23"
          autoComplete="street-address"
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <FormInput<ClientFormValues>
            name="city"
            label="Miejscowość"
            placeholder="Warszawa"
            autoComplete="address-level2"
          />
          <FormInput<ClientFormValues>
            name="postal_code"
            label="Kod pocztowy"
            placeholder={country.postalHint}
            autoComplete="postal-code"
            inputClassName="font-mono tracking-tight"
          />
        </div>

        <FormInput<ClientFormValues>
          name="region"
          label="Region / Województwo / Stan"
          placeholder="np. mazowieckie, Bayern, California"
          autoComplete="address-level1"
        />
      </FormSection>

      {/* ── Rozliczenia ─────────────────────────────────────────────── */}
      <FormSection
        title="Rozliczenia"
        description="Typ pracy, stawka i waluta rozliczeniowa tego klienta."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="client-work-type">Typ pracy *</Label>
            <Select
              value={workType}
              onValueChange={(value) =>
                setValue('work_type', value as ClientFormValues['work_type'], {
                  shouldDirty:    true,
                  shouldValidate: true,
                })
              }
            >
              <SelectTrigger
                id="client-work-type"
                className="h-12 w-full rounded-xl border-input-border bg-background px-4 text-sm shadow-sm"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hourly">Godzinowa</SelectItem>
                <SelectItem value="piecework">Akordowa</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="client-currency">Waluta *</Label>
            <Select
              value={currency}
              onValueChange={(value) =>
                setValue('currency', value as ClientFormValues['currency'], {
                  shouldDirty:    true,
                  shouldValidate: true,
                })
              }
            >
              <SelectTrigger
                id="client-currency"
                className="h-12 w-full rounded-xl border-input-border bg-background px-4 text-sm shadow-sm"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((c) => (
                  <SelectItem key={c.code} value={c.code}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <FormInput<ClientFormValues>
              name="rate"
              type="number"
              label="Aktualna stawka *"
              placeholder="0.00"
              inputClassName="font-mono tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
            {isEditMode ? (
              <p className="text-xs text-muted-foreground">
                Edycja nadpisuje aktualną stawkę. Aby dodać nową stawkę obowiązującą
                od daty (bez utraty historii) — użyj przycisku „Historia stawek&quot;.
              </p>
            ) : null}
          </div>

          {workType === 'piecework' ? (
            <FormInput<ClientFormValues>
              name="unit"
              label="Jednostka *"
              placeholder="kW, szt, m²…"
              autoComplete="off"
            />
          ) : null}
        </div>
      </FormSection>

      {/* ── Preferencje komunikacji ─────────────────────────────────── */}
      <FormSection
        title="Preferencje komunikacji"
        description="Język i strefa czasowa — używane w mailach, powiadomieniach i harmonogramach."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="client-locale">Język komunikacji</Label>
            <Select
              value={locale}
              onValueChange={(value) =>
                setValue('locale', value, { shouldDirty: true, shouldValidate: true })
              }
            >
              <SelectTrigger
                id="client-locale"
                className="h-12 w-full rounded-xl border-input-border bg-background px-4 text-sm shadow-sm"
              >
                <SelectValue placeholder="Wybierz język" />
              </SelectTrigger>
              <SelectContent>
                {LOCALES.map((l) => (
                  <SelectItem key={l.code} value={l.code}>
                    {l.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="client-timezone">Strefa czasowa</Label>
            <Select
              value={timezone}
              onValueChange={(value) =>
                setValue('timezone', value, { shouldDirty: true, shouldValidate: true })
              }
            >
              <SelectTrigger
                id="client-timezone"
                className="h-12 w-full rounded-xl border-input-border bg-background px-4 text-sm shadow-sm"
              >
                <SelectValue placeholder="Wybierz strefę" />
              </SelectTrigger>
              <SelectContent>
                {TIMEZONES.map((tz) => (
                  <SelectItem key={tz} value={tz}>
                    {tz}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </FormSection>

      {/* ── Wygląd i status ─────────────────────────────────────────── */}
      <FormSection title="Wygląd i status">
        <div className="space-y-2">
          <Label id="client-color-label">Kolor</Label>
          <div
            role="radiogroup"
            aria-labelledby="client-color-label"
            className="flex flex-wrap gap-2"
          >
            {CLIENT_COLORS.map((colorOption) => {
              const selected = color === colorOption
              return (
                <button
                  key={colorOption}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  aria-label={`Kolor ${colorOption}`}
                  className={cn(
                    'h-10 w-10 rounded-full border-2 transition-transform',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                    selected ? 'scale-110 border-foreground' : 'border-transparent',
                  )}
                  style={{ backgroundColor: colorOption }}
                  onClick={() =>
                    setValue('color', colorOption, {
                      shouldDirty:    true,
                      shouldValidate: true,
                    })
                  }
                />
              )
            })}
          </div>
        </div>

        <label
          htmlFor="client-default"
          className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-border/60 bg-background px-4 py-3"
        >
          <span className="space-y-0.5">
            <span className="block text-sm font-medium">Domyślny klient</span>
            <span className="block text-xs text-muted-foreground">
              Wybierany automatycznie przy nowych wpisach czasu pracy.
            </span>
          </span>
          <Switch
            id="client-default"
            checked={isDefault}
            onCheckedChange={(value) =>
              setValue('is_default', value, { shouldDirty: true })
            }
          />
        </label>
      </FormSection>

      {/* ── Auto-fakturowanie ───────────────────────────────────────── */}
      <FormSection
        title="Auto-fakturowanie"
        description="Automatyczne generowanie faktury z wpisów kalendarza."
        action={
          <Switch
            id="client-auto-invoice"
            aria-label="Włącz auto-fakturowanie"
            checked={autoInvoice}
            onCheckedChange={(value) =>
              setValue('auto_invoice_enabled', value, { shouldDirty: true })
            }
          />
        }
      >
        <div className="space-y-2">
          <Label htmlFor="client-auto-invoice-freq">Częstotliwość</Label>
          <Select
            value={autoInvoiceFreq}
            onValueChange={(value) =>
              setValue(
                'auto_invoice_frequency',
                value as ClientFormValues['auto_invoice_frequency'],
                { shouldDirty: true, shouldValidate: true },
              )
            }
            disabled={!autoInvoice}
          >
            <SelectTrigger
              id="client-auto-invoice-freq"
              className="h-12 w-full rounded-xl border-input-border bg-background px-4 text-sm shadow-sm disabled:opacity-60"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="weekly">Co tydzień</SelectItem>
              <SelectItem value="monthly">Co miesiąc</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Generator działa w soboty o 23:00 (UTC). Kwota liczona z przepracowanych
            wpisów w kalendarzu.
          </p>
        </div>
      </FormSection>
    </div>
  )
}
