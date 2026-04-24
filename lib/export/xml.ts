/**
 * Minimal XML helpers. Not a general XML library — just enough to produce the
 * deterministic, deeply-nested, namespaced output that JPK_FA requires.
 */

export function escapeXml(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return ''
  const str = String(value)
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export type XmlAttributes = Record<string, string | number | null | undefined>

export function openTag(name: string, attrs: XmlAttributes = {}): string {
  const entries = Object.entries(attrs).filter(([, v]) => v !== null && v !== undefined)
  if (entries.length === 0) return `<${name}>`
  const pairs = entries.map(([k, v]) => `${k}="${escapeXml(v as string | number)}"`)
  return `<${name} ${pairs.join(' ')}>`
}

export function closeTag(name: string): string {
  return `</${name}>`
}

export function selfClosing(name: string, attrs: XmlAttributes = {}): string {
  const entries = Object.entries(attrs).filter(([, v]) => v !== null && v !== undefined)
  if (entries.length === 0) return `<${name}/>`
  const pairs = entries.map(([k, v]) => `${k}="${escapeXml(v as string | number)}"`)
  return `<${name} ${pairs.join(' ')}/>`
}

export function tag(name: string, value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === '') return ''
  return `<${name}>${escapeXml(value)}</${name}>`
}

export function xmlDeclaration(encoding = 'UTF-8'): string {
  return `<?xml version="1.0" encoding="${encoding}"?>`
}
