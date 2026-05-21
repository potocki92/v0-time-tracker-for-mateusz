import fs from 'node:fs'

const path = '.next/analyze/client.json'

if (!fs.existsSync(path)) {
  console.warn('[perf:budget] Missing .next/analyze/client.json. Run bundle analyzer first.')
  process.exit(0)
}

const raw = JSON.parse(fs.readFileSync(path, 'utf8'))
const maxKb = 250
const chunks = Array.isArray(raw?.chunks) ? raw.chunks : []

const offenders = chunks
  .map((chunk) => ({
    name: chunk.names?.join(',') || chunk.id,
    kb: (chunk.size || 0) / 1024,
  }))
  .filter((chunk) => chunk.kb > maxKb)

if (offenders.length === 0) {
  console.log(`[perf:budget] OK. No client chunk is bigger than ${maxKb}KB.`)
  process.exit(0)
}

console.error(`[perf:budget] FAIL. ${offenders.length} chunk(s) exceed ${maxKb}KB:`)
for (const offender of offenders) {
  console.error(` - ${offender.name}: ${offender.kb.toFixed(1)}KB`)
}
process.exit(1)
