export function BentoCalCell({ lvl }: { lvl: number }) {
  if (lvl === 0)
    return (
      <div
        className="h-6 rounded-md"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--hair)' }}
      />
    )
  if (lvl === 1)
    return (
      <div
        className="h-6 rounded-md"
        style={{ background: 'rgba(34,224,122,0.08)', border: '1px solid rgba(34,224,122,0.18)' }}
      />
    )
  if (lvl === 2)
    return (
      <div
        className="h-6 rounded-md"
        style={{ background: 'rgba(34,224,122,0.18)', border: '1px solid rgba(34,224,122,0.30)' }}
      />
    )
  return <div className="day-active h-6 rounded-md" />
}
