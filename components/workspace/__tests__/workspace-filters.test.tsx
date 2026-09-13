import { fireEvent, render, screen } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import { describe, expect, it, vi } from 'vitest'

import common from '@/messages/pl/common.json'
import { WorkspaceFilters } from '../filters/workspace-filters'

/**
 * Pasek filtrow ma jedna niepozorna niezmienniczosc, ktora latwo zgubic przy
 * refaktorze: POLA RENDERUJA SIE RAZ. Wersja inline (desktop) i arkusz
 * (telefon) dostaja te same `children`, a pola niosa `id` powiazane
 * z `<label htmlFor>`. Gdyby obie kopie stanely w DOM naraz, etykieta
 * trafialaby w kopie niewidoczna, a czytnik ekranu czytalby kazde pole dwa razy.
 */
const wrap = (ui: React.ReactNode) =>
  render(
    <NextIntlClientProvider locale="pl" messages={{ common }}>
      {ui}
    </NextIntlClientProvider>,
  )

function Harness({ activeCount = 0, onReset = () => {} }: { activeCount?: number; onReset?: () => void }) {
  return (
    <WorkspaceFilters
      sectionLabel="Filtry listy"
      title="Filtry"
      description="Zawez liste"
      activeCount={activeCount}
      onReset={onReset}
    >
      <label htmlFor="status">Status</label>
      <select id="status" defaultValue="all">
        <option value="all">Wszystkie</option>
      </select>
    </WorkspaceFilters>
  )
}

describe('WorkspaceFilters', () => {
  it('pola stoja w DOM dokladnie raz, zanim arkusz sie otworzy', () => {
    wrap(<Harness />)
    expect(document.querySelectorAll('#status')).toHaveLength(1)
  })

  it('trigger otwiera pola w overlayu i nie dubluje ich w DOM', () => {
    wrap(<Harness />)
    fireEvent.click(screen.getByRole('button', { name: new RegExp(common.filters.open) }))

    expect(screen.getByRole('dialog', { name: 'Filtry' })).toBeTruthy()
    expect(
      document.querySelectorAll('#status'),
      'kopia inline zostala w DOM — `htmlFor` trafi w niewidoczne pole',
    ).toHaveLength(1)
  })

  it('„zastosuj" zamyka arkusz, nie czysci filtrow', () => {
    const onReset = vi.fn()
    wrap(<Harness activeCount={2} onReset={onReset} />)
    fireEvent.click(screen.getByRole('button', { name: new RegExp(common.filters.open) }))

    fireEvent.click(screen.getByRole('button', { name: common.filters.apply }))
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(onReset).not.toHaveBeenCalled()
  })

  it('skrot czyszczenia pojawia sie dopiero przy aktywnym filtrze', () => {
    const onReset = vi.fn()
    const { rerender } = wrap(<Harness activeCount={0} onReset={onReset} />)
    expect(screen.queryByRole('button', { name: common.filters.clear })).toBeNull()

    rerender(
      <NextIntlClientProvider locale="pl" messages={{ common }}>
        <Harness activeCount={3} onReset={onReset} />
      </NextIntlClientProvider>,
    )
    fireEvent.click(screen.getByRole('button', { name: common.filters.clear }))
    expect(onReset).toHaveBeenCalledTimes(1)
  })

  it('licznik aktywnych filtrow jest opisany dla czytnika ekranu', () => {
    wrap(<Harness activeCount={3} />)
    expect(screen.getByLabelText('3 aktywne filtry')).toBeTruthy()
  })
})
