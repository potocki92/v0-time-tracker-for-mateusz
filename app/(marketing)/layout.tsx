import type { ReactNode } from 'react'

import { MotionProvider } from '@/components/common/motion-provider'

import { RevealObserver } from './_landing/ui/RevealObserver'
import './landing.css'

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <style>{`html,body{background:#000!important;}`}</style>
      <div className="landing-root">
        <RevealObserver />
        <MotionProvider>{children}</MotionProvider>
      </div>
    </>
  )
}
