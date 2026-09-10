import { toMajorUnits } from './dataset'
import { buildWorksitePeriods } from './worksites'
import type { BreakdownItem, ReportModel, ReportRecord } from './types'

/**
 * Budowanie tresci eksportow. Czyste funkcje — hook dokleda tylko pobranie
 * pliku i toast, wiec format da sie przetestowac bez przegladarki.
 *
 * Etykiety kolumn wchodza argumentem: naglowek CSV widzi uzytkownik, wiec
 * nalezy do `messages/`, a nie do tego pliku.
 */

export type CsvColumnLabels = {
  date: string
  client: string
  project: string
  workType: string
  hours: string
  quantity: string
  rate: string
  currency: string
  value: string
  valueBase: string
  billable: string
  tags: string
  source: string
}

/** Wartosci logiczne w CSV — arkusz ma pokazac slowo uzytkownika, nie `true`. */
export type CsvBooleanLabels = { yes: string; no: string }

function escapeCsv(value: string | number): string {
  const text = String(value)
  return /[",;\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

function row(record: ReportRecord, booleans: CsvBooleanLabels): Array<string | number> {
  return [
    record.date,
    record.clientName ?? '',
    record.projectName ?? '',
    record.workType,
    record.hours,
    record.quantity,
    toMajorUnits(record.appliedRateMinor),
    record.appliedCurrency,
    toMajorUnits(record.valueMinor),
    toMajorUnits(record.valueBaseMinor),
    record.billable ? booleans.yes : booleans.no,
    record.tags.join('|'),
    record.source,
  ]
}

/**
 * CSV wpisow raportu.
 *
 * Kolumny sa dobrane pod uzytek finansowy: obok godzin ida ilosc akordowa,
 * stawka FAKTYCZNIE zastosowana, waluta wpisu i wartosc w obu walutach —
 * czyli dokladnie to, czego brakowalo w poprzedniej wersji (data, klient,
 * projekt, godziny, tagi), zeby arkusz zgadzal sie z tym, co pokazuje ekran.
 *
 * BOM na poczatku zostaje: bez niego Excel czyta UTF-8 jako ANSI.
 */
export function buildReportCsv(
  model: ReportModel,
  labels: CsvColumnLabels,
  booleans: CsvBooleanLabels,
): string {
  const header = [
    labels.date,
    labels.client,
    labels.project,
    labels.workType,
    labels.hours,
    labels.quantity,
    labels.rate,
    labels.currency,
    labels.value,
    `${labels.valueBase} (${model.currency})`,
    labels.billable,
    labels.tags,
    labels.source,
  ]

  return `﻿${[header, ...model.records.map((record) => row(record, booleans))]
    .map((cells) => cells.map(escapeCsv).join(','))
    .join('\n')}`
}

export type WorksiteCsvLabels = {
  project: string
  client: string
  location: string
  from: string
  to: string
  workedDays: string
  hours: string
  /** Etykieta wiersza sumy. */
  total: string
  /** Podstawiane, gdy wpisy nie maja projektu albo klienta. */
  unassigned: string
  /** Podstawiane, gdy projekt nie ma zapisanego adresu. */
  noLocation: string
}

/**
 * CSV zestawienia miejsc pracy: jeden wiersz na projekt, na koncu suma.
 *
 * Suma bierze godziny i dni z KPI, a nie z dodawania kolumn — dzien
 * przepracowany w dwoch projektach jest jednym dniem pracy, mimo ze wystepuje
 * w dwoch wierszach.
 */
export function buildWorksiteCsv(model: ReportModel, labels: WorksiteCsvLabels): string {
  const header = [
    labels.project,
    labels.client,
    labels.location,
    labels.from,
    labels.to,
    labels.workedDays,
    labels.hours,
  ]

  const rows = buildWorksitePeriods(model.records).map((period) => [
    period.projectName ?? labels.unassigned,
    period.clientName ?? labels.unassigned,
    period.location ?? labels.noLocation,
    period.from,
    period.to,
    period.workedDays,
    period.hours,
  ])

  const total = [
    labels.total,
    '',
    '',
    model.range.start,
    model.range.end,
    model.kpis.activeDays,
    model.kpis.totalHours,
  ]

  return `﻿${[header, ...rows, total].map((cells) => cells.map(escapeCsv).join(',')).join('\n')}`
}

const breakdownToJson = (items: BreakdownItem[]) =>
  items.map((item) => ({
    key: item.key,
    label: item.label,
    hours: item.hours,
    share: item.share,
    value: toMajorUnits(item.valueBaseMinor),
    entryCount: item.entryCount,
  }))

/**
 * JSON raportu: to samo, co pokazuje ekran — zakres, filtry, KPI, breakdowny
 * i wpisy. Poprzednia wersja zrzucala surowe wiersze Supabase, wiec plik nie
 * mial ani zakresu, ani zadnej z policzonych wartosci.
 */
export function buildReportJson(model: ReportModel, generatedAt: string): string {
  return JSON.stringify(
    {
      generatedAt,
      range: model.range,
      currency: model.currency,
      eurRate: model.eurRate,
      kpis: {
        totalHours: model.kpis.totalHours,
        workValue: toMajorUnits(model.kpis.workValueMinor),
        activeDays: model.kpis.activeDays,
        avgHoursPerActiveDay: model.kpis.avgHoursPerActiveDay,
        effectiveHourlyRate:
          model.kpis.effectiveHourlyRateMinor === null
            ? null
            : toMajorUnits(model.kpis.effectiveHourlyRateMinor),
        billableRatio: model.kpis.billableRatio,
        entryCount: model.kpis.entryCount,
      },
      breakdowns: {
        client: breakdownToJson(model.breakdowns.client),
        project: breakdownToJson(model.breakdowns.project),
        tag: breakdownToJson(model.breakdowns.tag),
      },
      entries: model.records.map((record) => ({
        id: record.id,
        date: record.date,
        client: record.clientName,
        project: record.projectName,
        workType: record.workType,
        hours: record.hours,
        quantity: record.quantity,
        rate: toMajorUnits(record.appliedRateMinor),
        currency: record.appliedCurrency,
        value: toMajorUnits(record.valueMinor),
        valueBase: toMajorUnits(record.valueBaseMinor),
        billable: record.billable,
        tags: record.tags,
        source: record.source,
      })),
    },
    null,
    2,
  )
}

/** `raport_2026-09-01_2026-09-30.csv` — baza nazwy pochodzi z i18n. */
export function exportFileName(base: string, model: ReportModel, extension: string): string {
  return `${base}_${model.range.start}_${model.range.end}.${extension}`
}
