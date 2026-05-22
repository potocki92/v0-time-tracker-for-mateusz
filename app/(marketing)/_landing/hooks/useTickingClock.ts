'use client'

import { useEffect, useRef, useState } from 'react'

interface TickingClock {
  seconds: number
  paused: boolean
  toggle: () => void
  reset: () => void
}

export function useTickingClock(start: number): TickingClock {
  const [seconds, setSeconds] = useState(start)
  const [running, setRunning] = useState(true)
  const startRef = useRef(start)

  useEffect(() => {
    if (!running) return
    const id = setInterval(() => setSeconds((prev) => prev + 1), 1000)
    return () => clearInterval(id)
  }, [running])

  return {
    seconds,
    paused: !running,
    toggle: () => setRunning((v) => !v),
    reset: () => {
      setRunning(false)
      setSeconds(startRef.current)
    },
  }
}
