import type { Metric } from 'next/web-vitals'
import * as Sentry from '@sentry/nextjs'

const WEB_VITALS_BUDGETS = {
  LCP: 2500,
  INP: 200,
  CLS: 0.1,
  FCP: 1800,
  TTFB: 800,
} as const

export type WebVitalName = keyof typeof WEB_VITALS_BUDGETS

function isWebVitalName(name: string): name is WebVitalName {
  return name in WEB_VITALS_BUDGETS
}

export function isWebVitalOverBudget(metric: Metric): boolean {
  if (!isWebVitalName(metric.name)) return false
  return metric.value > WEB_VITALS_BUDGETS[metric.name]
}

export function reportWebVital(metric: Metric): void {
  if (!isWebVitalName(metric.name)) return
  if (!isWebVitalOverBudget(metric)) return

  Sentry.captureMessage('web_vital_over_budget', {
    level: 'warning',
    tags: {
      metric: metric.name,
      rating: metric.rating,
      navigationType: metric.navigationType,
    },
    extra: {
      id: metric.id,
      value: metric.value,
      budget: WEB_VITALS_BUDGETS[metric.name],
      delta: metric.delta,
    },
  })
}
