'use client'

import { useEffect } from 'react'

export function RevealObserver() {
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('in')
            io.unobserve(e.target)
          }
        })
      },
      { threshold: 0.12 },
    )
    const els = document.querySelectorAll('.reveal-row')
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])

  return null
}
