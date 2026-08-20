/**
 * Pure calculation engine for the redesigned Invoice Builder.
 *
 * All arithmetic is integer-based via bigint, in the minor unit of the invoice
 * currency (grosze / cents / pence). This mirrors the approach in
 * `./money.ts` but is specialized for the builder's wider currency set
 * (PLN / EUR / USD / GBP) without having to widen the app-wide `CURRENCY` type.
 *
 * The module is intentionally framework-free — it takes a plain values shape
 * and returns totals. That lets us test it in isolation and reuse it for
 * PDF rendering, JPK exports, and server-side checks.
 */

import type {
  InvoiceBuilderCurrency,
  InvoiceBuilderValues,
  LineItemInput,
  VatMode,
} from '@/lib/schemas/invoice-builder.schema'

const ZERO = BigInt(0)
const ONE = BigInt(1)
const TWO = BigInt(2)
const MINOR = BigInt(100)
const QUANTITY_SCALE = BigInt(1_000_000) // 6 decimal places for qty/rate factors

export interface MoneyAmount {
  readonly amountMinor: bigint
  readonly currency: InvoiceBuilderCurrency
}

export interface LineTotals {
  net: MoneyAmount
  vat: MoneyAmount
  gross: MoneyAmount
  /** Effective VAT rate after collapsing special modes to zero. */
  effective_vat_rate: number
}

export interface VatBreakdownRow {
  label: string
  /** Effective numeric rate (0 for zw/np/rc). */
  rate: number
  mode: VatMode
  net: MoneyAmount
  vat: MoneyAmount
  gross: MoneyAmount
}

export interface InvoiceTotals {
  currency: InvoiceBuilderCurrency
  net: MoneyAmount
  vat: MoneyAmount
  gross: MoneyAmount
  vat_breakdown: VatBreakdownRow[]
  /** PLN equivalent of `gross`, if the invoice is in a foreign currency AND an FX rate was supplied. */
  gross_in_pln?: MoneyAmount
  /** True if any line uses reverse charge / NP — consumers render a notice. */
  has_special_vat: boolean
}

// ---------------------------------------------------------------------------
// Primitives
// ---------------------------------------------------------------------------

function toBigIntRounded(value: number): bigint {
  if (!Number.isFinite(value)) return ZERO
  return BigInt(Math.round(value))
}

function roundHalfAwayFromZero(value: bigint, divisor: bigint): bigint {
  const negative = value < ZERO
  const abs = negative ? -value : value
  const quot = abs / divisor
  const rem = abs % divisor
  const rounded = rem * TWO >= divisor ? quot + ONE : quot
  return negative ? -rounded : rounded
}

function money(amountMinor: bigint, currency: InvoiceBuilderCurrency): MoneyAmount {
  return { amountMinor, currency }
}

function zeroMoney(currency: InvoiceBuilderCurrency): MoneyAmount {
  return money(ZERO, currency)
}

function addMoney(a: MoneyAmount, b: MoneyAmount): MoneyAmount {
  if (a.currency !== b.currency) {
    throw new Error(`invoice-builder-engine: cannot add ${a.currency} to ${b.currency}`)
  }
  return money(a.amountMinor + b.amountMinor, a.currency)
}

/**
 * Multiply Money by a scalar factor (quantity, VAT rate, FX rate). The factor
 * is lifted to 6 decimal-places of precision before integer multiplication so
 * that typical invoice quantities (e.g. 0.125h) round deterministically.
 */
function multiplyMoney(m: MoneyAmount, factor: number): MoneyAmount {
  if (!Number.isFinite(factor) || factor === 0) return zeroMoney(m.currency)
  const scaled = toBigIntRounded(factor * 1_000_000)
  const product = m.amountMinor * scaled
  return money(roundHalfAwayFromZero(product, QUANTITY_SCALE), m.currency)
}

function fromMajor(value: number, currency: InvoiceBuilderCurrency): MoneyAmount {
  if (!Number.isFinite(value)) return zeroMoney(currency)
  return money(toBigIntRounded(value * 100), currency)
}

export function toMajor(m: MoneyAmount): number {
  const whole = m.amountMinor / MINOR
  const frac = m.amountMinor % MINOR
  const fracAbs = frac < ZERO ? -frac : frac
  const sign = m.amountMinor < ZERO ? -1 : 1
  return Number(whole) + (sign * Number(fracAbs)) / 100
}

// ---------------------------------------------------------------------------
// VAT handling
// ---------------------------------------------------------------------------

/**
 * Resolve the effective numeric VAT rate for a line. The three special modes
 * (zw / np / rc) always collapse to zero — they're rendered as a badge on the
 * invoice instead of as a numeric rate.
 */
export function resolveVatRate(line: Pick<LineItemInput, 'vat_mode' | 'vat_rate'>): number {
  if (line.vat_mode !== 'standard') return 0
  const rate = Number(line.vat_rate)
  if (!Number.isFinite(rate) || rate < 0) return 0
  return rate
}

/** Stable human-readable label for each VAT bucket in the summary table. */
function vatBucketLabel(mode: VatMode, rate: number): string {
  switch (mode) {
    case 'zw':
      return 'zw.'
    case 'np':
      return 'np.'
    case 'rc':
      return 'Reverse charge'
    default:
      return `${rate}%`
  }
}

// ---------------------------------------------------------------------------
// Line + invoice totals
// ---------------------------------------------------------------------------

export function computeLineTotals(
  line: Pick<LineItemInput, 'quantity' | 'unit_price_net' | 'vat_mode' | 'vat_rate'>,
  currency: InvoiceBuilderCurrency,
): LineTotals {
  const unit = fromMajor(Number(line.unit_price_net) || 0, currency)
  const net = multiplyMoney(unit, Number(line.quantity) || 0)
  const rate = resolveVatRate(line)
  const vat = multiplyMoney(net, rate / 100)
  return {
    net,
    vat,
    gross: addMoney(net, vat),
    effective_vat_rate: rate,
  }
}

/**
 * Aggregate totals across all lines, grouped by VAT bucket (mode + rate).
 * We never mix currencies — the builder enforces a single invoice currency
 * upstream, so this function trusts that invariant.
 */
export function computeInvoiceTotals(
  values: Pick<InvoiceBuilderValues, 'items' | 'currency' | 'exchange_rate'>,
): InvoiceTotals {
  const currency = values.currency
  const buckets = new Map<string, VatBreakdownRow>()
  let net = zeroMoney(currency)
  let vat = zeroMoney(currency)
  let hasSpecial = false

  for (const line of values.items) {
    const totals = computeLineTotals(line, currency)
    net = addMoney(net, totals.net)
    vat = addMoney(vat, totals.vat)
    if (line.vat_mode !== 'standard') hasSpecial = true

    const bucketKey = `${line.vat_mode}:${totals.effective_vat_rate}`
    const existing = buckets.get(bucketKey)
    if (existing) {
      buckets.set(bucketKey, {
        ...existing,
        net: addMoney(existing.net, totals.net),
        vat: addMoney(existing.vat, totals.vat),
        gross: addMoney(existing.gross, totals.gross),
      })
    } else {
      buckets.set(bucketKey, {
        label: vatBucketLabel(line.vat_mode, totals.effective_vat_rate),
        rate: totals.effective_vat_rate,
        mode: line.vat_mode,
        net: totals.net,
        vat: totals.vat,
        gross: totals.gross,
      })
    }
  }

  const gross = addMoney(net, vat)

  // Sort buckets: standard rates ascending, special modes last.
  const breakdown = [...buckets.values()].sort((a, b) => {
    const aSpecial = a.mode !== 'standard'
    const bSpecial = b.mode !== 'standard'
    if (aSpecial !== bSpecial) return aSpecial ? 1 : -1
    return a.rate - b.rate
  })

  const result: InvoiceTotals = {
    currency,
    net,
    vat,
    gross,
    vat_breakdown: breakdown,
    has_special_vat: hasSpecial,
  }

  if (
    currency !== 'PLN' &&
    typeof values.exchange_rate === 'number' &&
    Number.isFinite(values.exchange_rate) &&
    values.exchange_rate > 0
  ) {
    const grossPln = multiplyMoney(gross, values.exchange_rate)
    result.gross_in_pln = { amountMinor: grossPln.amountMinor, currency: 'PLN' }
  }

  return result
}

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------

export function formatMoney(
  m: MoneyAmount,
  locale = 'pl-PL',
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: m.currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(toMajor(m))
}
