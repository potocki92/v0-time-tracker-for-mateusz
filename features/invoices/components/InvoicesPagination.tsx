'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface InvoicesPaginationProps {
  pageIndex:        number
  pageCount:        number
  pageSize:         number
  totalCount:       number
  onPageChange:     (pageIndex: number) => void
  onPageSizeChange: (pageSize: number) => void
}

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const

/**
 * Lekka, samodzielna paginacja listy faktur. Nie używamy DataTable —
 * lista to zwykły `<ul>` — więc komponent operuje wprost na indeksie
 * strony i jej rozmiarze.
 */
export function InvoicesPagination({
  pageIndex,
  pageCount,
  pageSize,
  totalCount,
  onPageChange,
  onPageSizeChange,
}: InvoicesPaginationProps) {
  if (totalCount === 0) return null

  const fromIndex = pageIndex * pageSize
  const toIndex   = Math.min(fromIndex + pageSize, totalCount)
  const canPrev   = pageIndex > 0
  const canNext   = pageIndex < pageCount - 1

  return (
    <div className="mt-4 flex flex-col items-center justify-between gap-3 rounded-2xl border border-[#1a1a1a] bg-[#0a0a0a] px-4 py-3 sm:flex-row">
      <div className="flex items-center gap-3 text-[12px] text-zinc-400">
        <span className="tabular-nums">
          {fromIndex + 1}–{toIndex} z {totalCount}
        </span>

        <label className="flex items-center gap-2 text-[11.5px] text-zinc-500">
          <span>Na stronę</span>
          <select
            value={pageSize}
            onChange={(event) => onPageSizeChange(Number(event.target.value))}
            className="h-8 rounded-md border border-[#1a1a1a] bg-[#0e0e0e] px-2 text-[12px] text-zinc-200 focus:border-emerald-500/40 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          >
            {PAGE_SIZE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(pageIndex - 1)}
          disabled={!canPrev}
          aria-label="Poprzednia strona"
          className={cn(
            'inline-flex h-8 w-8 items-center justify-center rounded-md border border-[#1a1a1a] bg-[#0e0e0e] text-zinc-300 transition',
            'hover:border-emerald-500/40 hover:text-emerald-300',
            'disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-[#1a1a1a] disabled:hover:text-zinc-300',
          )}
        >
          <ChevronLeft className="h-4 w-4" aria-hidden />
        </button>

        <span className="px-2 text-[12px] tabular-nums text-zinc-400">
          {pageIndex + 1} / {pageCount}
        </span>

        <button
          type="button"
          onClick={() => onPageChange(pageIndex + 1)}
          disabled={!canNext}
          aria-label="Następna strona"
          className={cn(
            'inline-flex h-8 w-8 items-center justify-center rounded-md border border-[#1a1a1a] bg-[#0e0e0e] text-zinc-300 transition',
            'hover:border-emerald-500/40 hover:text-emerald-300',
            'disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-[#1a1a1a] disabled:hover:text-zinc-300',
          )}
        >
          <ChevronRight className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </div>
  )
}
