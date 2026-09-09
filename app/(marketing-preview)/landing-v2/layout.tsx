import type { ReactNode } from 'react'

import { MotionProvider } from '@/components/common/motion-provider'

import './landing-v2.css'

/**
 * Layout podgladu Landing V2.
 *
 * Osobna grupa tras `(marketing-preview)` stoi obok `(marketing)` celowo:
 * nowa strona nie dotyka ani jednego pliku starego landingu, wiec `/` i
 * `/landing-v2` mozna ogladac obok siebie i porownac przed decyzja o
 * migracji.
 *
 * `MotionProvider` (LazyMotion + `reducedMotion="user"`) stoi TUTAJ, nie w
 * roocie — poddrzewo animowane jest tylko to jedno.
 */
export default function LandingV2Layout({ children }: { children: ReactNode }) {
  return (
    <>
      {/* Panel i landing dziela <html>; motyw uzytkownika nie moze rozjasnic
          strony marketingowej, ktora jest z zalozenia czarna. */}
      <style>{`html,body{background:#000!important;}`}</style>
      <div className="lv2">
        <MotionProvider>{children}</MotionProvider>
      </div>
    </>
  )
}
