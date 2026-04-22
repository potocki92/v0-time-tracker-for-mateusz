import type { ReactNode } from 'react'

import { InvoiceVisual } from './visuals/InvoiceVisual'
import { ReportsVisual } from './visuals/ReportsVisual'
import { TimerVisual } from './visuals/TimerVisual'

export interface ShowcaseBlock {
  eyebrow: string
  title: string
  description: string
  bullets: string[]
  visual: ReactNode
  reverse?: boolean
}

export const SHOWCASE_BLOCKS: ShowcaseBlock[] = [
  {
    eyebrow: 'Czas pracy',
    title: 'Mierz minuty, nie stresuj się zegarkiem',
    description:
      'Timer jednym kliknięciem, automatyczne grupowanie wpisów i pełna historia. Pracujesz offline? Wpisy synchronizują się po odzyskaniu połączenia.',
    bullets: [
      'Jednoklikowy start/stop z dowolnego widoku',
      'Ręczne wpisy z historią i tagami',
      'Widok dzienny, tygodniowy i kalendarzowy',
    ],
    visual: <TimerVisual />,
  },
  {
    eyebrow: 'Fakturowanie',
    title: 'Zamień godziny w fakturę — w 30 sekund',
    description:
      'Wybierz klienta, zakres dat i gotowe. WorkFlow Pro zsumuje wpisy, policzy stawki i wygeneruje fakturę PDF gotową do wysyłki.',
    bullets: [
      'Generator faktur PDF z własnym logo',
      'Numeracja, VAT, stawki i rabaty',
      'Eksport do księgowej jednym kliknięciem',
    ],
    visual: <InvoiceVisual />,
    reverse: true,
  },
  {
    eyebrow: 'Raporty',
    title: 'Podejmuj decyzje w oparciu o dane',
    description:
      'Dashboardy pokazują produktywność, rentowność klientów i projekty, które dają największy zwrot. Wszystko w czasie rzeczywistym.',
    bullets: ['Wykresy tygodniowe i miesięczne', 'Ranking klientów wg przychodu', 'Alerty o przekroczonym budżecie'],
    visual: <ReportsVisual />,
  },
]
