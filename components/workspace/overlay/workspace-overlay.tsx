'use client'

import * as React from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { LAYER, type WorkspaceLayer } from '@/components/ui/tokens'
import { cn } from '@/lib/utils'

/**
 * Jeden overlay ekranowy panelu.
 *
 * Zastępuje cztery równoległe rozwiązania, które panel niósł wcześniej:
 * `Dialog`, `Sheet side="bottom"`, `Sheet side="right"` i `DialogContent`
 * rozciągnięty ręcznie do pełnego ekranu. Feature nie decyduje już, którym
 * z nich jest — wybiera tylko rozmiar.
 *
 * MOBILE (< 640 px) arkusz od dołu, DESKTOP (>= 640 px) wyśrodkowany panel —
 * ten sam komponent, to samo drzewo DOM, różnica wyłącznie w CSS. Nie ma tu
 * `useIsMobile()`: gałąź po JS oznaczałaby remount formularza przy obrocie
 * telefonu (utrata stanu pól) i pierwszy render po stronie klienta bez
 * znanego breakpointu.
 *
 * Nie ma tu triggera: overlaye panelu otwierają się ze stanu feature'a
 * (edycja wiersza, akcja z menu, quick action z sidebara), a nie z jednego
 * przycisku stojącego obok nich w drzewie — `open`/`onOpenChange` wystarczą.
 *
 * Geometria stoi na `inset-0 + margin:auto` zamiast `translate(-50%,-50%)`,
 * bo animacje wejścia/wyjścia (`zoom-in`, `slide-in`) podmieniają `transform`
 * — centrowanie przez transform gubiłoby pozycję na czas animacji.
 */

type OverlaySize = 'sm' | 'md' | 'lg' | 'xl'

/**
 * Cztery szerokości, każda z realnym zbiorem ekranów:
 *   sm  potwierdzenia (usunięcie klienta/faktury/projektu, edycja celu)
 *   md  krótkie formularze (historia stawek, wyjazdy, wpis dnia)
 *   lg  pełne formularze (klient, projekt, szybka faktura, wybór tygodni)
 *   xl  builder faktury — jedyny ekran z dwiema kolumnami w środku
 */
const SIZE: Record<OverlaySize, string> = {
  sm: 'sm:max-w-md',
  md: 'sm:max-w-lg',
  lg: 'sm:max-w-2xl',
  xl: 'sm:max-w-3xl',
}

type WorkspaceOverlayProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Widoczny tytuł. Zawsze renderowany jako `DialogTitle` — landmark dla czytnika. */
  title: string
  /** Zdanie pod tytułem. Bez niego Radix nie ustawia `aria-describedby`. */
  description?: string
  /** Opis wyłącznie dla czytnika ekranu — gdy tytuł nie wystarcza, a zdanie w UI byłoby szumem. */
  srDescription?: string
  size?: OverlaySize
  /** Prawa strona nagłówka: status, licznik, akcja pomocnicza. */
  headerAction?: React.ReactNode
  /**
   * `stacked` dla overlaya otwieranego z wnętrza innego overlaya — patrz
   * `LAYER` w `components/ui/tokens.ts`.
   */
  layer?: WorkspaceLayer
  children: React.ReactNode
  className?: string
  'data-testid'?: string
} & Pick<
  React.ComponentProps<typeof DialogPrimitive.Content>,
  'onOpenAutoFocus' | 'onCloseAutoFocus' | 'onInteractOutside' | 'onEscapeKeyDown'
>

export function WorkspaceOverlay({
  open,
  onOpenChange,
  title,
  description,
  srDescription,
  size = 'lg',
  headerAction,
  layer = 'base',
  children,
  className,
  'data-testid': testId,
  ...contentProps
}: WorkspaceOverlayProps) {
  const t = useTranslations('common')
  const zIndex = LAYER[layer]
  const describedBy = description || srDescription

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className={cn(
            'fixed inset-0 bg-surface-0/60 backdrop-blur-sm',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0',
            zIndex,
          )}
        />
        <DialogPrimitive.Content
          data-slot="workspace-overlay"
          data-testid={testId}
          // Radix zawsze wskazuje `aria-describedby` na węzeł opisu. Bez opisu
          // wskazywałby na element, którego nie ma — stąd jawne wycięcie.
          {...(describedBy ? {} : { 'aria-describedby': undefined })}
          className={cn(
            // `workspace-surface` — overlay portaluje się do <body>, więc nie
            // dziedziczy skóry panelu po powłoce. Patrz `app/globals.css`.
            'workspace-surface',
            // Wspólne: kolumna flex, żeby przewijało się WYŁĄCZNIE body.
            'fixed flex flex-col overflow-hidden border border-hairline bg-surface-1 text-zinc-200',
            // Mobile: arkusz przyklejony do dołu ekranu.
            'inset-x-0 bottom-0 max-h-[90dvh] rounded-t-2xl',
            // Safe area telefonu — dolna krawędź arkusza dotyka paska gestów.
            'pb-[env(safe-area-inset-bottom)] sm:pb-0',
            // Desktop: centrowanie przez auto-marginesy, bez transformacji.
            'sm:inset-0 sm:m-auto sm:h-fit sm:max-h-[85dvh] sm:w-[calc(100%-2rem)] sm:rounded-2xl',
            SIZE[size],
            'data-[state=open]:animate-in data-[state=closed]:animate-out duration-200',
            'data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0',
            'data-[state=open]:slide-in-from-bottom data-[state=closed]:slide-out-to-bottom',
            // Na desktopie wjazd od dołu zamienia się w krótki podskok + zoom.
            'sm:data-[state=open]:slide-in-from-bottom-2 sm:data-[state=closed]:slide-out-to-bottom-2',
            'sm:data-[state=open]:zoom-in-95 sm:data-[state=closed]:zoom-out-95',
            zIndex,
            className,
          )}
          {...contentProps}
        >
          <header className="flex shrink-0 items-start gap-3 border-b border-hairline px-4 py-3 sm:px-5">
            <div className="min-w-0 flex-1">
              <DialogPrimitive.Title className="truncate text-base font-semibold text-white">
                {title}
              </DialogPrimitive.Title>
              {description && (
                <DialogPrimitive.Description className="mt-0.5 text-xs text-zinc-400">
                  {description}
                </DialogPrimitive.Description>
              )}
              {!description && srDescription && (
                <DialogPrimitive.Description className="sr-only">
                  {srDescription}
                </DialogPrimitive.Description>
              )}
            </div>

            {headerAction}

            <DialogPrimitive.Close
              aria-label={t('actions.close')}
              className={cn(
                'inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-zinc-400',
                'transition-colors hover:bg-surface-3 hover:text-zinc-200',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500/60',
              )}
            >
              <X aria-hidden className="size-4" />
            </DialogPrimitive.Close>
          </header>

          {children}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

/**
 * Przewijana treść overlaya. Jedyny element ze scrollem — nagłówek i stopka
 * zostają widoczne niezależnie od długości formularza.
 */
export function WorkspaceOverlayBody({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      data-slot="workspace-overlay-body"
      className={cn(
        'min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-5',
        className,
      )}
    >
      {children}
    </div>
  )
}

/**
 * Stopka z akcjami. Na telefonie przyciski idą w pełnej szerokości i w
 * odwróconej kolejności (akcja główna najniżej, pod kciukiem), na desktopie
 * wracają do rzędu wyrównanego do prawej.
 */
export function WorkspaceOverlayFooter({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <footer
      data-slot="workspace-overlay-footer"
      className={cn(
        'flex shrink-0 flex-col-reverse gap-2 border-t border-hairline px-4 py-3',
        'sm:flex-row sm:justify-end sm:px-5',
        className,
      )}
    >
      {children}
    </footer>
  )
}

/**
 * Owija `<form>` tak, żeby pola przewijały się niezależnie, a stopka została
 * w środku formularza (przycisk `type="submit"` musi mieć go nad sobą).
 */
export function WorkspaceOverlayForm({
  children,
  className,
  ...props
}: React.ComponentProps<'form'>) {
  return (
    <form
      data-slot="workspace-overlay-form"
      className={cn('flex min-h-0 flex-1 flex-col', className)}
      {...props}
    >
      {children}
    </form>
  )
}

