import type { ReactNode } from 'react'

import { MotionProvider } from '@/components/common/motion-provider'

import './landing.css'

/**
 * Layout landingu.
 *
 * `MotionProvider` (LazyMotion + `reducedMotion="user"`) stoi TUTAJ, nie w
 * roocie — animowane jest tylko to jedno poddrzewo, panel nie placi za nie
 * ani bajta.
 */
export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {/* Panel i landing dziela <html>; motyw uzytkownika nie moze rozjasnic
          strony marketingowej, ktora jest z zalozenia czarna. */}
      <style>{`html,body{background:#000!important;}`}</style>
      <div className="lp">
        <MotionProvider>{children}</MotionProvider>
      </div>
    </>
  )
}
