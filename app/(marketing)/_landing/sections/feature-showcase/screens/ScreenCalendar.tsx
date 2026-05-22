import { type CSSProperties } from 'react'

import { CALENDAR_OFFSET, INTENSITIES, TODAY_INDEX } from '../data'

const DAY_HEADERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
const TOTAL_CELLS = 35

const DETAIL_ENTRIES = [
  { color: '#22E07A', label: 'Foundation review', time: '3.5h' },
  { color: '#74A9F0', label: 'Strategy sync', time: '1.5h' },
  { color: '#E66F8E', label: 'Site visit', time: '3.5h' },
]

function dayClass(dataIndex: number): string {
  const lvl = INTENSITIES[dataIndex]
  if (lvl === 0) return 'day-off'
  if (lvl === 3) return 'day-active'
  return ''
}

function dayStyle(dataIndex: number): CSSProperties {
  const lvl = INTENSITIES[dataIndex]
  if (lvl === 1)
    return { background: 'rgba(34,224,122,0.08)', border: '1px solid rgba(34,224,122,0.18)' }
  if (lvl === 2)
    return { background: 'rgba(34,224,122,0.18)', border: '1px solid rgba(34,224,122,0.30)' }
  return {}
}

export function ScreenCalendar() {
  return (
    <div className="flex h-full flex-col gap-3 p-4">
      <div className="text-[13px] font-semibold" style={{ color: 'var(--ink-1)' }}>
        Calendar · April 2026
      </div>

      <div className="grid grid-cols-7 gap-1">
        {DAY_HEADERS.map((d, i) => (
          <div key={i} className="text-center text-[10px]" style={{ color: 'var(--ink-3)' }}>
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: TOTAL_CELLS }).map((_, cellIndex) => {
          const dataIndex = cellIndex - CALENDAR_OFFSET
          const dayNum = dataIndex + 1
          const isEmpty = dataIndex < 0 || dataIndex >= 30
          const isToday = dataIndex === TODAY_INDEX

          if (isEmpty) {
            return <div key={cellIndex} className="day-empty aspect-square rounded-md text-[10px]" />
          }

          return (
            <div
              key={cellIndex}
              className={`flex aspect-square items-center justify-center rounded-md text-[10px] ${isToday ? 'day-today' : dayClass(dataIndex)}`}
              style={isToday ? {} : dayStyle(dataIndex)}
            >
              <span style={{ color: isToday ? '#22E07A' : 'var(--ink-3)' }}>{dayNum}</span>
            </div>
          )
        })}
      </div>

      <div className="panel mt-auto">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[11px] font-medium" style={{ color: 'var(--ink-1)' }}>
            Apr 22 · Wed
          </span>
          <span className="num text-[13px]">8.5h</span>
        </div>
        <div className="flex flex-col gap-1.5">
          {DETAIL_ENTRIES.map((entry) => (
            <div key={entry.label} className="flex items-center gap-2">
              <div className="h-3 w-1 shrink-0 rounded-full" style={{ background: entry.color }} />
              <span className="flex-1 text-[11px]" style={{ color: 'var(--ink-2)' }}>
                {entry.label}
              </span>
              <span className="mono text-[10px]" style={{ color: 'var(--ink-3)' }}>
                {entry.time}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
