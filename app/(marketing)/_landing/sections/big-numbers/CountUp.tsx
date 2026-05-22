'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

import { animate, useInView, useReducedMotion } from 'framer-motion'

interface Parsed {
  prefix: string
  suffix: string
  target: number
  decimals: number
  hasComma: boolean
}

function parse(display: string): Parsed {
  const match = display.match(/^([^\d]*)([\d.,]+)([^\d]*)$/)
  if (!match) return { prefix: '', suffix: '', target: 0, decimals: 0, hasComma: false }
  const [, prefix, core, suffix] = match
  const hasComma = core.includes(',')
  const plain = core.replace(/,/g, '')
  const dot = plain.split('.')[1]
  return {
    prefix,
    suffix,
    target: parseFloat(plain),
    decimals: dot ? dot.length : 0,
    hasComma,
  }
}

function format(n: number, p: Parsed): string {
  let s = n.toFixed(p.decimals)
  if (p.hasComma) {
    const [intPart, dec] = s.split('.')
    s = Number(intPart).toLocaleString('en-US') + (dec ? `.${dec}` : '')
  }
  return `${p.prefix}${s}${p.suffix}`
}

export function CountUp({ value, className }: { value: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  const shouldReduceMotion = useReducedMotion()
  const parsed = useMemo(() => parse(value), [value])
  const [display, setDisplay] = useState(() =>
    shouldReduceMotion ? value : format(0, parsed),
  )

  useEffect(() => {
    if (shouldReduceMotion) {
      setDisplay(value)
      return
    }
    if (!inView) return
    const controls = animate(0, parsed.target, {
      duration: 1.2,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setDisplay(format(v, parsed)),
    })
    return () => controls.stop()
  }, [inView, shouldReduceMotion, value, parsed])

  return (
    <span ref={ref} className={className}>
      {display}
    </span>
  )
}
