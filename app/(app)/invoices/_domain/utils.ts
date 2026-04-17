/**
 * Wyciąga inicjały z nazwy (np. "Rafał Gawlik" → "RG", "Rafał" → "RA").
 */
export function getInitials(name: string | null | undefined): string {
  if (!name) return '??'

  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '??'

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase()
  }

  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

/**
 * Deterministyczny kolor z nazwy klienta — spójny z modułem kalendarza.
 */
export function stringToColor(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  const h = Math.abs(hash) % 360
  return `hsl(${h}, 55%, 48%)`
}
