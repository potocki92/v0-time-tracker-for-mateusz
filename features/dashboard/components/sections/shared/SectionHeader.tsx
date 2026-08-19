type Props = {
  label: string
}

export function SectionHeader({ label }: Props) {
  return (
    <div className="flex items-center gap-3 px-1">
      <p className="text-2xs font-semibold uppercase tracking-[0.22em] text-zinc-500">
        {label}
      </p>
      <span aria-hidden className="h-px flex-1 bg-[#1a1a1a]" />
    </div>
  )
}
