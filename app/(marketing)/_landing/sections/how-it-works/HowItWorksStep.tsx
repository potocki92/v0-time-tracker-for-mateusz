interface HowItWorksStepProps {
  number: string
  title: string
  description: string
  showConnector: boolean
}

export function HowItWorksStep({ number, title, description, showConnector }: HowItWorksStepProps) {
  return (
    <li className="relative rounded-xl border border-border bg-card p-6">
      <div className="flex items-center justify-between">
        <span className="font-mono text-2xl font-semibold text-primary">{number}</span>
        {showConnector ? <span aria-hidden="true" className="hidden h-px w-10 bg-border lg:block" /> : null}
      </div>
      <h3 className="mt-4 text-base font-semibold">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
    </li>
  )
}
