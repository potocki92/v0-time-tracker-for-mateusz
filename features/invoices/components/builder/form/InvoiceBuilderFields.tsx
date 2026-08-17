'use client'

import * as React from 'react'
import { useFormContext, useWatch } from 'react-hook-form'
import { useQuery } from '@tanstack/react-query'

import { FormInput, FormSection } from '@/components/common/form'
import { Switch } from '@/components/ui/switch'
import { fetchCurrentEurRate } from '@/lib/api/eurRate'
import { QUERY_CONFIG, QUERY_KEYS } from '@/lib/query'
import {
  INVOICE_BUILDER_CURRENCIES,
  type InvoiceBuilderCurrency,
  type InvoiceBuilderValues,
  type InvoiceLanguage,
  type PaymentMethod,
} from '@/lib/schemas/invoice-builder.schema'
import { useEffectiveEurRate } from '@/features/dashboard/hooks/usePreferencesStore'

import { InvoiceLineItemsField } from './InvoiceLineItemsField'
import { InvoiceTotalsSummary } from './InvoiceTotalsSummary'
import { isForeignCurrency, todayIso } from './invoice-builder.helpers'
import { EnumSelectField, NumericFormInput } from './shared-fields'

interface InvoiceBuilderFieldsProps {
  isEditMode: boolean
  /**
   * Currently linked client id. Drives the optional "load from worked
   * weeks" affordance in the line items section — when null, the button
   * disappears because we have no client to look up `work_entries` for.
   */
  clientId?: string | null
}

/**
 * The 5 information-architecture sections, composed in reading order:
 *   1. Metadata        — invoice number + dates
 *   2. Counterparty    — buyer details with VAT-EU support
 *   3. Line items      — sortable, responsive item manager
 *   4. Summary         — VAT breakdown + totals (auto-computed)
 *   5. Payment & notes — bank/method selection, language, free-form notes
 *
 * Conditional UI (FX rate when foreign currency, VAT-EU toggle, etc.) lives
 * inside the relevant section so context-switching cost is minimal.
 */
export function InvoiceBuilderFields({
  isEditMode: _isEditMode,
  clientId,
}: InvoiceBuilderFieldsProps) {
  const { control, setValue, formState } = useFormContext<InvoiceBuilderValues>()

  const currency       = useWatch({ control, name: 'currency' })
  const buyerCountry   = useWatch({ control, name: 'buyer.country_code' })
  const isVatEu        = useWatch({ control, name: 'buyer.is_vat_eu' })
  const exchangeRate   = useWatch({ control, name: 'exchange_rate' })
  const preferredEurRate = useEffectiveEurRate()
  const autoSeededEurRateRef = React.useRef<number | null>(null)
  const { data: liveEurRate } = useQuery({
    queryKey: QUERY_KEYS.eurRate(),
    queryFn: fetchCurrentEurRate,
    enabled: currency === 'EUR',
    ...QUERY_CONFIG.eurRate,
  })

  const country = COUNTRIES.find((c) => c.code === (buyerCountry ?? 'PL').toUpperCase()) ?? COUNTRIES[0]
  const requiresFx = isForeignCurrency(currency as InvoiceBuilderCurrency)
  const eurRate = liveEurRate ?? preferredEurRate

  // When the user switches to a foreign currency, eagerly seed today's
  // FX rate date so the field is meaningful even before they type a rate.
  React.useEffect(() => {
    if (!requiresFx) return
    if (!formState.dirtyFields.exchange_rate_date) {
      setValue('exchange_rate_date', todayIso(), { shouldDirty: false })
    }
  }, [requiresFx, formState.dirtyFields.exchange_rate_date, setValue])

  React.useEffect(() => {
    if (currency !== 'EUR') {
      autoSeededEurRateRef.current = null
      return
    }
    if (formState.dirtyFields.exchange_rate) return
    if (!Number.isFinite(eurRate) || eurRate <= 0) return

    const currentRate = Number(exchangeRate)
    const wasAutoSeeded =
      autoSeededEurRateRef.current !== null &&
      Number.isFinite(currentRate) &&
      Math.abs(currentRate - autoSeededEurRateRef.current) < 0.00005

    if (Number.isFinite(currentRate) && currentRate > 0 && !wasAutoSeeded) return

    const nextRate = Number(eurRate.toFixed(4))
    autoSeededEurRateRef.current = nextRate
    setValue('exchange_rate', nextRate, {
      shouldDirty: false,
      shouldValidate: true,
    })
  }, [currency, eurRate, exchangeRate, formState.dirtyFields.exchange_rate, setValue])

  return (
    <div className="space-y-5">
      {/* ── 1. Metadane ──────────────────────────────────────────────── */}
      <FormSection
        title="Metadane faktury"
        description="Numer dokumentu i daty rozliczeniowe — termin płatności jest walidowany względem daty wystawienia."
        className="border-[#1a1a1a] bg-[#0a0a0a]"
      >
        <FormInput<InvoiceBuilderValues>
          name="invoice_number"
          label="Numer faktury *"
          placeholder="np. FV/04/2026/01"
          autoComplete="off"
          inputClassName="font-mono tracking-tight"
        />

        <div className="grid gap-4 sm:grid-cols-3">
          <FormInput<InvoiceBuilderValues>
            name="issue_date"
            type="text"
            label="Data wystawienia *"
            inputClassName="appearance-none"
          />
          <FormInput<InvoiceBuilderValues>
            name="sale_date"
            type="text"
            label="Data sprzedaży *"
          />
          <FormInput<InvoiceBuilderValues>
            name="due_date"
            type="text"
            label="Termin płatności *"
          />
        </div>

        <p className="text-xs leading-relaxed text-muted-foreground">
          Wskazówka: pola dat akceptują format <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">YYYY-MM-DD</code>.
          Mobilne klawiatury otwierają natywny picker, gdy
          dotkniesz pola.
        </p>
      </FormSection>

      {/* ── 2. Kontrahent ───────────────────────────────────────────── */}
      <FormSection
        title="Kontrahent (Nabywca)"
        description="Dane do wystawienia dokumentu. Włącz „VAT-EU”, jeśli to transakcja unijna."
        className="border-[#1a1a1a] bg-[#0a0a0a]"
        action={
          <label
            htmlFor="buyer-vat-eu"
            className="flex items-center gap-2 text-xs text-muted-foreground"
          >
            <span>VAT-EU</span>
            <Switch
              id="buyer-vat-eu"
              checked={isVatEu ?? false}
              onCheckedChange={(value) =>
                setValue('buyer.is_vat_eu', value, { shouldDirty: true })
              }
            />
          </label>
        }
      >
        <FormInput<InvoiceBuilderValues>
          name="buyer.name"
          label="Nazwa nabywcy *"
          placeholder="Nazwa firmy lub klienta"
          autoComplete="organization"
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <EnumSelectField<InvoiceBuilderValues, string>
            name="buyer.country_code"
            label="Kraj"
            required
            options={COUNTRIES.map((c) => ({
              value: c.code,
              label: (
                <span className="inline-flex items-center gap-2">
                  <span aria-hidden="true">{c.flag}</span>
                  <span>{c.name}</span>
                  <span className="text-muted-foreground">({c.code})</span>
                </span>
              ),
            }))}
            description="Zmienia etykietę identyfikatora podatkowego."
          />

          <FormInput<InvoiceBuilderValues>
            name="buyer.tax_id"
            label={country.taxIdLabel}
            placeholder={country.taxIdHint}
            autoComplete="off"
            inputClassName="font-mono tracking-tight"
          />
        </div>

        <FormInput<InvoiceBuilderValues>
          name="buyer.address"
          label="Adres (ulica i numer)"
          placeholder="ul. Marszałkowska 1/23"
          autoComplete="street-address"
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <FormInput<InvoiceBuilderValues>
            name="buyer.city"
            label="Miejscowość"
            placeholder="Warszawa"
            autoComplete="address-level2"
          />
          <FormInput<InvoiceBuilderValues>
            name="buyer.postal_code"
            label="Kod pocztowy"
            placeholder={country.postalHint}
            autoComplete="postal-code"
            inputClassName="font-mono tracking-tight"
          />
        </div>

        <FormInput<InvoiceBuilderValues>
          name="buyer.email"
          type="email"
          label="Email kontrahenta"
          placeholder="kontakt@example.com"
          autoComplete="email"
        />
      </FormSection>

      {/* ── 3. Pozycje ──────────────────────────────────────────────── */}
      <FormSection
        title="Pozycje na fakturze"
        description="Każda pozycja jest przeliczana automatycznie. Możesz zmieniać kolejność (uchwyt z lewej, klawiatura: spacja + strzałki)."
        className="border-[#1a1a1a] bg-[#0a0a0a]"
        bodyClassName="space-y-3"
      >
        <InvoiceLineItemsField clientId={clientId ?? null} />
      </FormSection>

      {/* ── 4. Podsumowanie ─────────────────────────────────────────── */}
      <FormSection
        title="Podsumowanie"
        description="Rozbicie na poszczególne stawki VAT oraz łączne kwoty netto / brutto."
        className="border-[#1a1a1a] bg-[#0a0a0a]"
      >
        <InvoiceTotalsSummary />
      </FormSection>

      {/* ── 5. Płatność, waluta i uwagi ─────────────────────────────── */}
      <FormSection
        title="Płatność, waluta i uwagi"
        description="Waluta dokumentu, metoda płatności i opcjonalne notatki dla kontrahenta."
        className="border-[#1a1a1a] bg-[#0a0a0a]"
      >
        <div className="grid gap-4 sm:grid-cols-3">
          <EnumSelectField<InvoiceBuilderValues, InvoiceBuilderCurrency>
            name="currency"
            label="Waluta *"
            options={INVOICE_BUILDER_CURRENCIES.map((c) => ({ value: c, label: c }))}
          />
          <EnumSelectField<InvoiceBuilderValues, InvoiceLanguage>
            name="language"
            label="Język faktury"
            options={[
              { value: 'pl',    label: 'Polski' },
              { value: 'en',    label: 'English' },
              { value: 'pl_en', label: 'Dwujęzyczna (PL / EN)' },
            ]}
            description="Wpływa na nagłówki i opisy w wygenerowanym PDF."
          />
          <EnumSelectField<InvoiceBuilderValues, PaymentMethod>
            name="payment.method"
            label="Metoda płatności"
            options={PAYMENT_METHOD_OPTIONS}
          />
        </div>

        {requiresFx ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <NumericFormInput<InvoiceBuilderValues>
              name="exchange_rate"
              label={`Kurs ${currency} → PLN`}
              step="0.0001"
              min={0}
              placeholder="np. 4.3215"
              suffix="PLN"
              description="Opcjonalny — bez kursu nie pokażemy równowartości w PLN."
            />
            <FormInput<InvoiceBuilderValues>
              name="exchange_rate_date"
              label="Data kursu"
              placeholder="YYYY-MM-DD"
            />
          </div>
        ) : null}

        <FormInput<InvoiceBuilderValues>
          name="payment.bank_account"
          label="Numer konta bankowego (IBAN)"
          placeholder="PL61 1090 1014 0000 0712 1981 2874"
          inputClassName="font-mono tracking-tight"
          autoComplete="off"
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <FormInput<InvoiceBuilderValues>
            name="payment.bank_name"
            label="Nazwa banku"
            placeholder="np. mBank S.A."
            autoComplete="off"
          />
          <FormInput<InvoiceBuilderValues>
            name="payment.swift"
            label="SWIFT / BIC"
            placeholder="BREXPLPWMBK"
            autoComplete="off"
            inputClassName="font-mono tracking-tight"
          />
        </div>

        <FormInput<InvoiceBuilderValues>
          name="notes"
          type="textarea"
          label="Notatki"
          placeholder="Dodatkowe informacje widoczne na fakturze..."
        />

        {/* Tiny helper visualising the FX assumption — the totals summary
            also surfaces this, but reinforcing it next to the inputs that
            drive it makes the cause/effect clearer. */}
        {requiresFx && exchangeRate ? (
          <p className="text-xs text-muted-foreground">
            Kurs zostanie zapisany razem z fakturą i użyty do przeliczenia
            wartości w księgowości.
          </p>
        ) : null}
      </FormSection>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Static option lists — colocated to keep this file self-contained.
// ---------------------------------------------------------------------------

const PAYMENT_METHOD_OPTIONS: ReadonlyArray<{ value: PaymentMethod; label: string }> = [
  { value: 'bank_transfer', label: 'Przelew bankowy' },
  { value: 'card',          label: 'Karta płatnicza' },
  { value: 'cash',          label: 'Gotówka' },
  { value: 'online',        label: 'Płatność online' },
]

interface CountryMeta {
  code:        string
  name:        string
  flag:        string
  taxIdLabel:  string
  taxIdHint:   string
  postalHint:  string
}

/**
 * A trimmed country list dedicated to the buyer block. Intentionally short —
 * the goal is "the countries you actually invoice", not a full ISO dump.
 * Extend as the business expands.
 */
const COUNTRIES: ReadonlyArray<CountryMeta> = [
  { code: 'PL', name: 'Polska',         flag: '🇵🇱', taxIdLabel: 'NIP',                taxIdHint: '1234567890',     postalHint: '00-000' },
  { code: 'DE', name: 'Niemcy',         flag: '🇩🇪', taxIdLabel: 'USt-IdNr',           taxIdHint: 'DE123456789',    postalHint: '10115'  },
  { code: 'GB', name: 'Wielka Brytania',flag: '🇬🇧', taxIdLabel: 'VAT number',         taxIdHint: 'GB123456789',    postalHint: 'SW1A 1AA' },
  { code: 'US', name: 'USA',            flag: '🇺🇸', taxIdLabel: 'EIN',                taxIdHint: '12-3456789',     postalHint: '10001'  },
  { code: 'FR', name: 'Francja',        flag: '🇫🇷', taxIdLabel: 'N° TVA',             taxIdHint: 'FR12345678901',  postalHint: '75001'  },
  { code: 'NL', name: 'Holandia',       flag: '🇳🇱', taxIdLabel: 'BTW-nummer',         taxIdHint: 'NL123456789B01', postalHint: '1011 AB' },
  { code: 'CZ', name: 'Czechy',         flag: '🇨🇿', taxIdLabel: 'DIČ',                taxIdHint: 'CZ12345678',     postalHint: '110 00' },
  { code: 'SE', name: 'Szwecja',        flag: '🇸🇪', taxIdLabel: 'Org.nr / VAT',       taxIdHint: 'SE123456789012', postalHint: '111 22' },
  { code: 'NO', name: 'Norwegia',       flag: '🇳🇴', taxIdLabel: 'Org.nr',             taxIdHint: '123 456 789',    postalHint: '0150'   },
  { code: 'CH', name: 'Szwajcaria',     flag: '🇨🇭', taxIdLabel: 'UID',                taxIdHint: 'CHE-123.456.789', postalHint: '8001'  },
] as const
