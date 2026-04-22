import { Check } from 'lucide-react'

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
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">{block.eyebrow}</p>
        <h3 className="mt-3 text-balance text-2xl font-semibold tracking-tight sm:text-3xl">
          {block.title}
        </h3>
        <p className="mt-4 text-pretty text-base leading-relaxed text-muted-foreground">
          {block.description}
        </p>
        <ul className="mt-6 space-y-3">
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

      <div aria-hidden="true">{block.visual}</div>
    </div>
  )
}
