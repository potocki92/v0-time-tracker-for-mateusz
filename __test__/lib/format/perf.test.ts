import { beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * Konstruktor Intl jest drogi — w listach i na wykresach formatujemy setki
 * wartości na jeden render. Cache w lib/format/intl.ts ma stworzyć formatter raz.
 *
 * `vi.spyOn` samo w sobie nie przeżywa wywołania przez `new`, więc podstawiamy
 * implementację delegującą do oryginału i liczymy wywołania.
 */
function countConstructions<K extends 'NumberFormat' | 'DateTimeFormat'>(key: K) {
  const original = Intl[key]
  // Funkcja strzalkowa nie jest konstruktorem — tu musi byc zwykla `function`.
  return vi.spyOn(Intl, key).mockImplementation(function (...args: unknown[]) {
    return Reflect.construct(original as never, args)
  } as never)
}

describe('cache formatterów', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    vi.resetModules()
  })

  it('1000 wywołań formatMoney tworzy dokładnie jedną instancję Intl.NumberFormat', async () => {
    const spy = countConstructions('NumberFormat')
    const { formatMoney } = await import('@/lib/format')

    for (let i = 0; i < 1000; i += 1) formatMoney(i * 100, 'PLN')

    expect(spy).toHaveBeenCalledTimes(1)
  })

  it('1000 wywołań formatDate tworzy dokładnie jedną instancję Intl.DateTimeFormat', async () => {
    const spy = countConstructions('DateTimeFormat')
    const { formatDate } = await import('@/lib/format')

    for (let i = 1; i <= 28; i += 1) {
      for (let repeat = 0; repeat < 36; repeat += 1) {
        formatDate(`2026-08-${String(i).padStart(2, '0')}`, 'short')
      }
    }

    expect(spy).toHaveBeenCalledTimes(1)
  })
})
