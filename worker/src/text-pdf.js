/**
 * Short text PDFs. Helvetica, A4, no extra library. Sterling is WinAnsi character 243.
 */

function pdfEscape(value) {
  return String(value ?? '')
    .replace(/[^\x20-\x7E£]/g, '?')
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    .replace(/£/g, '\\243')
}

function wrapPdf(text, width) {
  const words = String(text || '').replace(/\s+/g, ' ').trim().split(' ').filter(Boolean)
  if (!words.length) return ['']
  const lines = []
  let current = ''
  for (const word of words) {
    const next = current ? `${current} ${word}` : word
    if (next.length > width && current) {
      lines.push(current)
      current = word
    } else {
      current = next
    }
  }
  if (current) lines.push(current)
  return lines
}

export function pushWrapped(items, text, { size = 11, gap = 15, width = 88 } = {}) {
  for (const line of wrapPdf(text, width)) items.push({ text: line, size, gap })
}

function paginate(items) {
  const pages = []
  let page = []
  let y = 800
  for (const item of items) {
    const h = item.gap || 15
    if (page.length && y - h < 56) {
      pages.push(page)
      page = []
      y = 800
    }
    page.push(item)
    y -= h
  }
  if (page.length) pages.push(page)
  if (!pages.length) pages.push([{ text: 'Dice Bastion accounts', size: 16, gap: 22 }])
  return pages.map((page, index) => ([
    { text: `Page ${index + 1} of ${pages.length}`, size: 9, gap: 16 },
    ...page
  ]))
}

function pageStream(lines) {
  const parts = ['BT', '/F1 11 Tf', '48 800 Td']
  lines.forEach((line, index) => {
    const size = line.size || 11
    if (index > 0) parts.push(`0 -${line.gap || 15} Td`)
    parts.push(`/F1 ${size} Tf`)
    parts.push(`(${pdfEscape(line.text)}) Tj`)
  })
  parts.push('ET')
  return parts.join('\n')
}

/** @param {{ text: string, size?: number, gap?: number }[]} items */
export function buildTextPdf(items) {
  const pages = paginate(items).map(pageStream)
  const enc = new TextEncoder()
  const chunks = []
  let offset = 0
  const push = (s) => {
    const bytes = enc.encode(s)
    chunks.push(bytes)
    offset += bytes.length
  }
  push('%PDF-1.4\n')
  const offsets = [0]
  const objects = []
  objects[1] = '<< /Type /Catalog /Pages 2 0 R >>'
  const pageIds = pages.map((_, i) => 4 + i * 2)
  objects[2] = `<< /Type /Pages /Count ${pages.length} /Kids [${pageIds.map(id => `${id} 0 R`).join(' ')}] >>`
  objects[3] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'
  pages.forEach((stream, i) => {
    const pageId = 4 + i * 2
    objects[pageId] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents ${pageId + 1} 0 R /Resources << /Font << /F1 3 0 R >> >> >>`
    objects[pageId + 1] = { stream }
  })
  const maxId = 3 + pages.length * 2
  for (let id = 1; id <= maxId; id++) {
    offsets[id] = offset
    const obj = objects[id]
    if (obj && obj.stream != null) {
      const len = enc.encode(obj.stream).length
      push(`${id} 0 obj\n<< /Length ${len} >>\nstream\n${obj.stream}\nendstream\nendobj\n`)
    } else {
      push(`${id} 0 obj\n${obj}\nendobj\n`)
    }
  }
  const xref = offset
  let table = `xref\n0 ${maxId + 1}\n0000000000 65535 f \n`
  for (let id = 1; id <= maxId; id++) {
    table += `${String(offsets[id]).padStart(10, '0')} 00000 n \n`
  }
  push(table)
  push(`trailer\n<< /Size ${maxId + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`)
  const total = chunks.reduce((sum, part) => sum + part.length, 0)
  const out = new Uint8Array(total)
  let pos = 0
  for (const part of chunks) {
    out.set(part, pos)
    pos += part.length
  }
  return out
}
