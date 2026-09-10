import { describe, expect, it } from 'vitest'
import {
  fetchWindowOf,
  previousRange,
  resolveReportRange,
  spanInDays,
  weekdayIndex,
} from '@/features/reports/domain'

const TODAY = '2026-09-10' // czwartek

describe('resolveReportRange — presety', () => {
  it('„ostatnie N dni" zawiera dzisiaj i konczy sie dzisiaj', () => {
    expect(resolveReportRange('last7d', TODAY, '', '')).toEqual({
      start: '2026-09-04',
      end: TODAY,
    })
    expect(resolveReportRange('last30d', TODAY, '', '')).toEqual({
      start: '2026-08-12',
      end: TODAY,
    })
    expect(resolveReportRange('last90d', TODAY, '', '')).toEqual({
      start: '2026-06-13',
      end: TODAY,
    })
  })

  it('„ostatnie 7 dni" ma dokladnie 7 dni — granice sa obustronnie domkniete', () => {
    expect(spanInDays(resolveReportRange('last7d', TODAY, '', ''))).toBe(7)
    expect(spanInDays(resolveReportRange('last30d', TODAY, '', ''))).toBe(30)
  })

  it('biezacy miesiac konczy sie dzisiaj, nie ostatniego dnia miesiaca', () => {
    expect(resolveReportRange('thisMonth', TODAY, '', '')).toEqual({
      start: '2026-09-01',
      end: TODAY,
    })
  })

  it('poprzedni miesiac to pelny miesiac', () => {
    expect(resolveReportRange('lastMonth', TODAY, '', '')).toEqual({
      start: '2026-08-01',
      end: '2026-08-31',
    })
  })

  it('poprzedni miesiac na przelomie roku cofa rok', () => {
    expect(resolveReportRange('lastMonth', '2026-01-15', '', '')).toEqual({
      start: '2025-12-01',
      end: '2025-12-31',
    })
  })

  it('poprzedni miesiac zna luty roku przestepnego', () => {
    expect(resolveReportRange('lastMonth', '2028-03-05', '', '')).toEqual({
      start: '2028-02-01',
      end: '2028-02-29',
    })
  })

  it('kwartal zaczyna sie od pierwszego dnia swojego kwartalu', () => {
    expect(resolveReportRange('thisQuarter', TODAY, '', '').start).toBe('2026-07-01')
    expect(resolveReportRange('thisQuarter', '2026-02-20', '', '').start).toBe('2026-01-01')
  })

  it('biezacy rok konczy sie dzisiaj, poprzedni obejmuje caly rok', () => {
    expect(resolveReportRange('thisYear', TODAY, '', '')).toEqual({
      start: '2026-01-01',
      end: TODAY,
    })
    expect(resolveReportRange('lastYear', TODAY, '', '')).toEqual({
      start: '2025-01-01',
      end: '2025-12-31',
    })
  })
})

describe('resolveReportRange — zakres wlasny', () => {
  it('przyjmuje podane daty', () => {
    expect(resolveReportRange('custom', TODAY, '2026-03-01', '2026-03-31')).toEqual({
      start: '2026-03-01',
      end: '2026-03-31',
    })
  })

  it('prostuje odwrocony zakres zamiast zwracac pustke', () => {
    expect(resolveReportRange('custom', TODAY, '2026-03-31', '2026-03-01')).toEqual({
      start: '2026-03-01',
      end: '2026-03-31',
    })
  })

  it('brak dat cofa sie do domyslnych 30 dni', () => {
    expect(resolveReportRange('custom', TODAY, '', '')).toEqual({
      start: '2026-08-12',
      end: TODAY,
    })
  })
})

describe('previousRange', () => {
  it('ma te sama dlugosc i przylega do biezacego okresu', () => {
    const range = { start: '2026-09-01', end: '2026-09-30' }
    expect(previousRange(range)).toEqual({ start: '2026-08-02', end: '2026-08-31' })
    expect(spanInDays(previousRange(range))).toBe(spanInDays(range))
  })

  it('dziala dla zakresu jednodniowego', () => {
    expect(previousRange({ start: '2026-09-10', end: '2026-09-10' })).toEqual({
      start: '2026-09-09',
      end: '2026-09-09',
    })
  })
})

describe('fetchWindowOf', () => {
  const range = { start: '2026-09-01', end: '2026-09-30' }

  it('bez porownania pobiera tylko biezacy zakres', () => {
    expect(fetchWindowOf(range, false)).toEqual(range)
  })

  it('z porownaniem siega do poczatku poprzedniego okresu', () => {
    expect(fetchWindowOf(range, true)).toEqual({ start: '2026-08-02', end: '2026-09-30' })
  })
})

describe('weekdayIndex', () => {
  it('liczy od poniedzialku', () => {
    expect(weekdayIndex('2026-09-07')).toBe(0)
    expect(weekdayIndex('2026-09-10')).toBe(3)
    expect(weekdayIndex('2026-09-13')).toBe(6)
  })
})
