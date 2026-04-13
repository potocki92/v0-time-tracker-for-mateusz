'use client'

import Link from 'next/link'
import Image from 'next/image'

export function Logo() {
  return (
    <Link
      href="/dashboard"
      className="flex items-center gap-2 shrink-0"
    >
      <Image
        src="/logo.png"
        alt="Time Tracker"
        width={32}
        height={32}
        priority
        className="object-contain"
      />

      <span className="text-lg font-semibold tracking-tight">
        TimeTracker
      </span>
    </Link>
  )
}