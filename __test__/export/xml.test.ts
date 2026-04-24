import { describe, it, expect } from 'vitest'
import { escapeXml, openTag, selfClosing, tag } from '@/lib/export/xml'

describe('escapeXml', () => {
  it('escapes all five special characters', () => {
    expect(escapeXml(`<a href="x&y">'test'</a>`)).toBe(
      '&lt;a href=&quot;x&amp;y&quot;&gt;&apos;test&apos;&lt;/a&gt;',
    )
  })

  it('returns empty string for null/undefined', () => {
    expect(escapeXml(null)).toBe('')
    expect(escapeXml(undefined)).toBe('')
  })

  it('stringifies numbers', () => {
    expect(escapeXml(42)).toBe('42')
  })
})

describe('tag', () => {
  it('returns empty string for null/undefined/empty', () => {
    expect(tag('X', null)).toBe('')
    expect(tag('X', undefined)).toBe('')
    expect(tag('X', '')).toBe('')
  })

  it('wraps escaped value in open+close tags', () => {
    expect(tag('Nazwa', 'A&B')).toBe('<Nazwa>A&amp;B</Nazwa>')
  })
})

describe('openTag / selfClosing', () => {
  it('emits attributes in escaped form', () => {
    expect(openTag('Kod', { nazwa: 'A&B' })).toBe('<Kod nazwa="A&amp;B">')
  })

  it('self-closes tags without attributes', () => {
    expect(selfClosing('X')).toBe('<X/>')
  })

  it('omits null/undefined attributes', () => {
    expect(openTag('X', { a: '1', b: null, c: undefined })).toBe('<X a="1">')
  })
})
