import type { FeatureItem } from './data'

export function FeatureCard({ icon: Icon, title, description }: FeatureItem) {
  return (
    <div className="group relative h-full overflow-hidden rounded-2xl border border-border/70 bg-card/80 p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/10">
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
      >
        <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-primary/10 blur-2xl" />
      </div>

      <div className="relative">
        <div className="inline-flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/15 transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
          <Icon className="size-5" aria-hidden="true" />
        </div>
        <h3 className="mt-6 text-base font-semibold">{title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
      </div>
    </div>
  )
}
