import { describe, it, expect } from 'vitest'
import {
  countBusinessDays,
  targetHoursForRange,
  HOURS_PER_WORKDAY,
} from '@/lib/date/business-days'

describe('countBusinessDays', () => {
  it('liczy dni pon–pt w pelnym miesiacu', () => {
    // Luty 2026: 20 dni roboczych. Lipiec 2026: 23.
    expect(countBusinessDays(new Date(2026, 1, 1), new Date(2026, 1, 28))).toBe(20)
    expect(countBusinessDays(new Date(2026, 6, 1), new Date(2026, 6, 31))).toBe(23)
  })

  it('pomija weekend', () => {
    // sobota 8.08.2026 – niedziela 9.08.2026
    expect(countBusinessDays(new Date(2026, 7, 8), new Date(2026, 7, 9))).toBe(0)
  })

  it('liczy granice wlacznie i ignoruje godzine', () => {
    const from = new Date(2026, 7, 10, 23, 30)
    const to = new Date(2026, 7, 10, 0, 15)
    expect(countBusinessDays(from, to)).toBe(1)
  })
})

describe('targetHoursForRange', () => {
  it('daje rozne cele roznym miesiacom', () => {
    // Stara mapa `range -> h` dawala 160 h zarowno lutemu, jak i lipcowi.
    const luty = targetHoursForRange(new Date(2026, 1, 1), new Date(2026, 1, 28))
    const lipiec = targetHoursForRange(new Date(2026, 6, 1), new Date(2026, 6, 31))
    expect(luty).toBe(20 * HOURS_PER_WORKDAY)
    expect(lipiec).toBe(23 * HOURS_PER_WORKDAY)
    expect(luty).not.toBe(lipiec)
  })

  it('pelny tydzien roboczy to 40 h', () => {
    expect(targetHoursForRange(new Date(2026, 7, 10), new Date(2026, 7, 16))).toBe(40)
  })

  it('zwraca null bez granic zakresu', () => {
    expect(targetHoursForRange(null, null)).toBeNull()
    expect(targetHoursForRange(new Date(2026, 7, 10), null)).toBeNull()
  })
})
