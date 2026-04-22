interface SectionIntroProps {
  eyebrow: string
  title: string
  description?: string
  centered?: boolean
}

export function SectionIntro({ eyebrow, title, description, centered = true }: SectionIntroProps) {
  return (
    <div className={centered ? 'mx-auto max-w-2xl text-center' : ''}>
      <p className="text-sm font-semibold uppercase tracking-wide text-primary">{eyebrow}</p>
      <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
        {title}
      </h2>
      {description ? (
        <p className="mt-4 text-pretty text-base text-muted-foreground sm:text-lg">{description}</p>
      ) : null}
    </div>
  )
}
