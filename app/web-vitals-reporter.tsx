'use client'

import { useReportWebVitals } from 'next/web-vitals'
import { reportWebVital } from '@/lib/monitoring/web-vitals'

export function WebVitalsReporter() {
  useReportWebVitals((metric) => {
    reportWebVital(metric)
  })

  return null
}
