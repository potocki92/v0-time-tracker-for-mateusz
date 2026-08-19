export function BrandMark({ label = true }: { label?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <span
        className="relative h-7 w-7 shrink-0 overflow-hidden rounded-[8px] hair-strong"
        style={{ background: 'linear-gradient(135deg,#0F1A12,#000)' }}
      >
        <span className="absolute inset-0 flex items-end justify-center gap-[3px] p-1.5">
          <span className="h-[6px] w-[3px] rounded-[1.5px] bg-[#22E07A]" />
          <span className="h-[10px] w-[3px] rounded-[1.5px] bg-[#22E07A]" />
          <span className="h-[14px] w-[3px] rounded-[1.5px] bg-[#22E07A]" />
        </span>
      </span>
      {label && <span className="text-sm font-semibold tracking-tight">TimeTracker</span>}
    </span>
  )
}
