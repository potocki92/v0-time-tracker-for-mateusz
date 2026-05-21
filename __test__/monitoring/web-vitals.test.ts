import { describe, expect, it } from 'vitest'
import type { WebVitalMetric } from '@/lib/monitoring/web-vitals'
import { WEB_VITALS_BUDGETS, isWebVitalOverBudget } from '@/lib/monitoring/web-vitals'

function metric(name: WebVitalMetric['name'], value: number): WebVitalMetric {
  return {
    name,
    value,
    rating: 'good',
    id: 'id-1',
    delta: value,
    entries: [],
    navigationType: 'navigate',
  }
}

describe('isWebVitalOverBudget', () => {
  it('returns false for metrics under budget', () => {
    expect(isWebVitalOverBudget(metric('LCP', WEB_VITALS_BUDGETS.LCP - 1))).toBe(false)
    expect(isWebVitalOverBudget(metric('CLS', WEB_VITALS_BUDGETS.CLS))).toBe(false)
  })

  it('returns true for metrics over budget', () => {
    expect(isWebVitalOverBudget(metric('LCP', WEB_VITALS_BUDGETS.LCP + 1))).toBe(true)
    expect(isWebVitalOverBudget(metric('INP', WEB_VITALS_BUDGETS.INP + 1))).toBe(true)
  })
})
