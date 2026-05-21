import { describe, expect, it } from 'vitest'
import type { Metric } from 'next/web-vitals'
import { isWebVitalOverBudget } from '@/lib/monitoring/web-vitals'

function metric(name: Metric['name'], value: number): Metric {
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
    expect(isWebVitalOverBudget(metric('LCP', 2000))).toBe(false)
    expect(isWebVitalOverBudget(metric('CLS', 0.05))).toBe(false)
  })

  it('returns true for metrics over budget', () => {
    expect(isWebVitalOverBudget(metric('LCP', 3000))).toBe(true)
    expect(isWebVitalOverBudget(metric('INP', 250))).toBe(true)
  })
})
