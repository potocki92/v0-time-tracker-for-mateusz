import { useState } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import { describe, expect, it, vi } from 'vitest'

import common from '@/messages/pl/common.json'
import {
  WorkspaceOverlay,
  WorkspaceOverlayBody,
  WorkspaceOverlayFooter,
} from '../overlay/workspace-overlay'
import { WorkspaceConfirmOverlay } from '../overlay/workspace-confirm-overlay'

/**
 * Kontrakt DOSTEPNOSCI wspolnego overlaya — ta czesc migracji, ktorej nie da
 * sie sprawdzic czytaniem klas. Wczesniej kazdy feature skladal ten sam ekran
 * z innego prymitywu (Dialog, Sheet, pelnoekranowy DialogContent), wiec rola,
 * nazwa dostepna i obsluga Escape byly osobna decyzja w kazdym z nich.
 *
 * Wersje wizualna (geometria arkusza vs panelu) trzyma `e2e/` — tu liczy sie
 * to, co czyta czytnik ekranu i klawiatura.
 */
const wrap = (ui: React.ReactNode) =>
  render(
    <NextIntlClientProvider locale="pl" messages={{ common }}>
      {ui}
    </NextIntlClientProvider>,
  )

function Harness({ description }: { description?: string }) {
  const [open, setOpen] = useState(true)
  return (
    <WorkspaceOverlay
      open={open}
      onOpenChange={setOpen}
      title="Nowy projekt"
      description={description}
      size="lg"
    >
      <WorkspaceOverlayBody>
        <label htmlFor="pole">Nazwa</label>
        <input id="pole" />
      </WorkspaceOverlayBody>
      <WorkspaceOverlayFooter>
        <button type="button">Anuluj</button>
        <button type="button">Zapisz</button>
      </WorkspaceOverlayFooter>
    </WorkspaceOverlay>
  )
}

describe('WorkspaceOverlay — kontrakt dostepnosci', () => {
  it('jest dialogiem o nazwie z tytulu i ma wlasny backdrop', () => {
    wrap(<Harness />)
    // Nazwa dostepna bierze sie z `DialogTitle` — bez niej czytnik oglasza
    // „dialog" i tyle.
    expect(screen.getByRole('dialog', { name: 'Nowy projekt' })).toBeTruthy()
    // Backdrop odcina tresc pod spodem; bez niego overlay jest tylko pudelkiem
    // narysowanym na wierzchu.
    expect(document.querySelector('[data-state="open"].bg-surface-0\\/60')).toBeTruthy()
  })

  it('tytul jest naglowkiem, nie samym tekstem', () => {
    wrap(<Harness />)
    expect(screen.getByRole('heading', { name: 'Nowy projekt' })).toBeTruthy()
  })

  it('opis wpina sie w aria-describedby', () => {
    wrap(<Harness description="Uzupelnij dane projektu." />)
    const dialog = screen.getByRole('dialog')
    const describedBy = dialog.getAttribute('aria-describedby')
    expect(describedBy, 'brak powiazania z opisem').toBeTruthy()
    expect(document.getElementById(describedBy!)?.textContent).toBe(
      'Uzupelnij dane projektu.',
    )
  })

  it('bez opisu nie zostawia aria-describedby wskazujacego w prozne', () => {
    // Radix domyslnie celuje w wezel opisu takze wtedy, gdy opisu nie ma —
    // czytnik czytalby wtedy „brak opisu" zamiast niczego.
    wrap(<Harness />)
    expect(screen.getByRole('dialog').getAttribute('aria-describedby')).toBeNull()
  })

  it('Escape zamyka overlay', () => {
    wrap(<Harness />)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('przycisk zamkniecia ma przetlumaczona etykiete', () => {
    wrap(<Harness />)
    expect(screen.getByRole('button', { name: common.actions.close })).toBeTruthy()
  })

  it('focus wchodzi do wnetrza overlaya', () => {
    wrap(<Harness />)
    expect(screen.getByRole('dialog').contains(document.activeElement)).toBe(true)
  })

  it('przewija sie tylko body, nie caly overlay', () => {
    wrap(<Harness />)
    const dialog = screen.getByRole('dialog')
    expect(dialog.className).toContain('overflow-hidden')
    const body = dialog.querySelector('[data-slot="workspace-overlay-body"]')
    expect(body?.className).toContain('overflow-y-auto')
  })
})

describe('WorkspaceConfirmOverlay — potwierdzenie w tym samym systemie', () => {
  it('jest tym samym dialogiem, tylko kompaktowym', () => {
    wrap(
      <WorkspaceConfirmOverlay
        open
        onOpenChange={() => {}}
        title="Usunac klienta?"
        confirmLabel="Usun"
        onConfirm={() => {}}
      >
        Operacja jest nieodwracalna.
      </WorkspaceConfirmOverlay>,
    )
    const dialog = screen.getByRole('dialog', { name: 'Usunac klienta?' })
    expect(dialog.className).toContain('sm:max-w-md')
  })

  it('potwierdzenie wola onConfirm, anulowanie zamyka', () => {
    const onConfirm = vi.fn()
    const onOpenChange = vi.fn()
    wrap(
      <WorkspaceConfirmOverlay
        open
        onOpenChange={onOpenChange}
        title="Usunac klienta?"
        confirmLabel="Usun"
        onConfirm={onConfirm}
      >
        Operacja jest nieodwracalna.
      </WorkspaceConfirmOverlay>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Usun' }))
    expect(onConfirm).toHaveBeenCalledTimes(1)

    fireEvent.click(screen.getByRole('button', { name: common.actions.cancel }))
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('w trakcie operacji blokuje obie akcje', () => {
    wrap(
      <WorkspaceConfirmOverlay
        open
        onOpenChange={() => {}}
        title="Usunac klienta?"
        confirmLabel="Usun"
        pendingLabel="Usuwanie..."
        isPending
        onConfirm={() => {}}
      >
        Operacja jest nieodwracalna.
      </WorkspaceConfirmOverlay>,
    )
    const confirm = screen.getByRole('button', { name: 'Usuwanie...' }) as HTMLButtonElement
    const cancel = screen.getByRole('button', { name: common.actions.cancel }) as HTMLButtonElement
    expect(confirm.disabled).toBe(true)
    expect(cancel.disabled).toBe(true)
  })
})
