import type { ReactNode } from 'react'
import { JetBrains_Mono } from 'next/font/google'

import { RevealObserver } from './_landing/ui/RevealObserver'
import './landing.css'

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
})

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <style>{`html,body{background:#000!important;}`}</style>
      <div className={`landing-root ${jetbrainsMono.variable}`}>
        <RevealObserver />
        {children}
      </div>
    </>
  )
}
