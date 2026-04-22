import { SHOWCASE_BLOCKS } from './data'
import { ShowcaseRow } from './ShowcaseRow'

export function FeatureShowcaseSection() {
  return (
    <section id="korzysci" className="border-b border-border bg-muted/30">
      <div className="mx-auto flex max-w-7xl flex-col gap-24 px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        {SHOWCASE_BLOCKS.map((block) => (
          <ShowcaseRow key={block.title} block={block} />
        ))}
      </div>
    </section>
  )
}
