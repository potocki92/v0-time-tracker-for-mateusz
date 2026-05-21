import fs from 'node:fs'

const REPORT_PATH = '.next/analyze/client.json'
const MAX_KB = 250

if (!fs.existsSync(REPORT_PATH)) {
  const msg = `[perf:budget] Missing ${REPORT_PATH}. Run bundle analyzer first.`
  if (process.env.CI === 'true') {
    console.error(msg)
    process.exit(1)
  }

  console.warn(msg)
  process.exit(0)
}

let raw
try {
  raw = JSON.parse(fs.readFileSync(REPORT_PATH, 'utf8'))
} catch (error) {
  console.error('[perf:budget] Invalid analyzer report JSON.', error)
  process.exit(1)
}

const chunks = Array.isArray(raw?.chunks) ? raw.chunks : []

const offenders = chunks
  .map((chunk) => ({
    name: chunk.names?.join(',') || String(chunk.id),
    kb: Number(chunk.size || 0) / 1024,
  }))
  .filter((chunk) => chunk.kb > MAX_KB)

if (offenders.length === 0) {
  console.log(`[perf:budget] OK. No client chunk is bigger than ${MAX_KB}KB.`)
  process.exit(0)
}

console.error(`[perf:budget] FAIL. ${offenders.length} chunk(s) exceed ${MAX_KB}KB:`)
for (const offender of offenders) {
  console.error(` - ${offender.name}: ${offender.kb.toFixed(1)}KB`)
}
process.exit(1)
