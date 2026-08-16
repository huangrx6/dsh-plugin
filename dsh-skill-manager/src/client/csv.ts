/**
 * Minimal RFC-4180-ish CSV/TSV parser for the preview's table mode: handles
 * quoted fields, escaped quotes and CRLF, no external dependency. Returns
 * undefined when the text has no rows at all.
 */
export interface ParsedCsv {
  readonly headers: readonly string[]
  readonly rows: readonly (readonly string[])[]
  readonly truncated: boolean
}

const ROW_LIMIT = 500
const CELL_LIMIT = 256

export function parseCsv(text: string, delimiter: ',' | '\t' = ','): ParsedCsv | undefined {
  const rows: string[][] = []
  let row: string[] = []
  let cell = ''
  let quoted = false

  const pushCell = () => { row.push(cell); cell = '' }
  const pushRow = () => {
    pushCell()
    rows.push(row)
    row = []
  }

  let stoppedEarly = false
  for (let index = 0; index < text.length; index += 1) {
    if (rows.length > ROW_LIMIT) { stoppedEarly = true; break }
    const char = text[index] ?? ''
    if (quoted) {
      if (char === '"') {
        const next = text[index + 1]
        if (next === '"') { cell += '"'; index += 1 } else quoted = false
      } else {
        cell += char
      }
      continue
    }
    if (char === '"' && cell === '') { quoted = true; continue }
    if (char === delimiter) { pushCell(); continue }
    if (char === '\n' || char === '\r') {
      if (char === '\r' && text[index + 1] === '\n') index += 1
      pushRow()
      continue
    }
    cell += char
  }
  if (quoted || cell !== '' || row.length > 0) pushRow()
  if (rows.length === 0) return undefined

  const [headers = [], ...body] = rows
  const width = headers.length
  return {
    headers: headers.map(h => (h.length > CELL_LIMIT ? `${h.slice(0, CELL_LIMIT)}…` : h)),
    rows: body.map(cells => {
      const padded = cells.map(c => (c.length > CELL_LIMIT ? `${c.slice(0, CELL_LIMIT)}…` : c))
      while (padded.length < width) padded.push('')
      return padded.slice(0, width)
    }),
    truncated: stoppedEarly,
  }
}
