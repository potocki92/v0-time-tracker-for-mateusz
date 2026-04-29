import { Check } from 'lucide-react'

import { MotionReveal } from '@/app/(marketing)/_landing/ui/MotionReveal'
import { ParallaxLayer } from '@/app/(marketing)/_landing/ui/ParallaxLayer'
import { cn } from '@/lib/utils'

import type { ShowcaseBlock } from './data'

export function ShowcaseRow({ block }: { block: ShowcaseBlock }) {
  return (
    <div
      className={cn(
        'grid items-center gap-10 lg:grid-cols-2 lg:gap-16',
        block.reverse && 'lg:[&>div:first-child]:order-2',
      )}
    >
      <MotionReveal>
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">
            {block.eyebrow}
          </p>
          <h3 className="mt-3 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            {block.title}
          </h3>
          <p className="mt-5 text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
            {block.description}
          </p>
          <ul className="mt-7 space-y-3">
            {block.bullets.map((bullet) => (
              <li key={bullet} className="flex items-start gap-3 text-sm">
                <span className="mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                  <Check className="size-3" aria-hidden="true" />
                </span>
                <span>{bullet}</span>
              </li>
            ))}
          </ul>
        </div>
      </MotionReveal>

      <MotionReveal y={34}>
        <ParallaxLayer offset={block.reverse ? 45 : -45}>
          <div className="relative" aria-hidden="true">
            <div className="absolute -inset-5 -z-10 rounded-[2rem] bg-gradient-to-br from-primary/15 via-chart-2/10 to-transparent blur-3xl" />
            {block.visual}
          </div>
        </ParallaxLayer>
      </MotionReveal>
    </div>
  )
}
