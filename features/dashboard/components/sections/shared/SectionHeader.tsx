import { SectionEyebrow } from '@/components/common/section/SectionEyebrow'

type Props = {
  label: string
}

export function SectionHeader({ label }: Props) {
  return (
    <div className="flex items-center gap-3 px-1">
      <SectionEyebrow>{label}</SectionEyebrow>
      <span aria-hidden className="h-px flex-1 bg-hairline" />
    </div>
  )
}
