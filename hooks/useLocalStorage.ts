'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

type Initializer<T> = T | (() => T)

interface UseLocalStorageOptions<T> {
  /**
   * When true, the hook waits for mount before reading localStorage and
   * returns the default value on the first render. Prevents SSR/CSR mismatch.
   * Default: true.
   */
  ssrSafe?: boolean
  /** Custom (de)serializer. Defaults to JSON.stringify / JSON.parse. */
  serialize?: (value: T) => string
  deserialize?: (raw: string) => T
  /** Custom validator run on the parsed value. Return false to fall back. */
  validate?: (value: unknown) => value is T
}

function readRaw<T>(
  key: string,
  defaults: T,
  deserialize: (raw: string) => T,
  validate?: (value: unknown) => value is T,
): T {
  if (typeof window === 'undefined') return defaults
  try {
    const raw = window.localStorage.getItem(key)
    if (raw === null) return defaults
    const parsed = deserialize(raw)
    if (validate && !validate(parsed)) return defaults
    return parsed
  } catch {
    return defaults
  }
}

/**
 * Reużywalny hook do trwałego stanu w localStorage.
 *
 * - Cienka warstwa nad `useState`; API identyczne (value + setter).
 * - Z `ssrSafe: true` (domyślnie) pierwszy render zwraca `defaults`, a hydracja
 *   następuje w `useEffect`, żeby uniknąć mismatchu SSR/CSR i zbędnego re-renderu
 *   komponentów, które i tak pokazują skeleton.
 * - Zapisy są debouncowane do mikrotasku (kolejne setState w tym samym tiku
 *   zapisują tylko ostatnią wartość).
 */
export function useLocalStorage<T>(
  key: string,
  defaults: Initializer<T>,
  options: UseLocalStorageOptions<T> = {},
): [T, (value: T | ((prev: T) => T)) => void, { isHydrated: boolean; reset: () => void }] {
  const {
    ssrSafe = true,
    serialize = JSON.stringify,
    deserialize = JSON.parse as (raw: string) => T,
    validate,
  } = options

  const defaultsRef = useRef<T>(
    typeof defaults === 'function' ? (defaults as () => T)() : defaults,
  )

  const [value, setValue] = useState<T>(() => {
    if (ssrSafe) return defaultsRef.current
    return readRaw(key, defaultsRef.current, deserialize, validate)
  })
  const [isHydrated, setIsHydrated] = useState(!ssrSafe)

  // Hydrate once on mount (SSR-safe mode).
  useEffect(() => {
    if (!ssrSafe) return
    const stored = readRaw(key, defaultsRef.current, deserialize, validate)
    setValue(stored)
    setIsHydrated(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  // Persist on change (after hydration to avoid overwriting stored value with default).
  useEffect(() => {
    if (!isHydrated || typeof window === 'undefined') return
    try {
      window.localStorage.setItem(key, serialize(value))
    } catch {
      // Quota / private mode — ignore, state stays in-memory.
    }
  }, [key, value, isHydrated, serialize])

  const reset = useCallback(() => {
    setValue(defaultsRef.current)
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.removeItem(key)
      } catch {
        // ignore
      }
    }
  }, [key])

  return [value, setValue, { isHydrated, reset }]
}
