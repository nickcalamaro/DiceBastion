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
  const flush = () => {
    if (!page.length) return
    pages.push(page)
    page = []
    y = 800
  }
  for (const item of items) {
    if (item.pageBreak) {
      flush()
      continue
    }
    const h = item.gap || 15
    if (page.length && y - h < 56) flush()
    page.push(item)
    y -= h
  }
  flush()
  if (!pages.length) pages.push([{ text: 'Dice Bastion accounts', size: 16, gap: 22 }])
  return pages.map((page, index) => ([
    { text: `Page ${index + 1} of ${pages.length}`, size: 9, gap: 18 },
    ...page
  ]))
}

function textWidth(text, size) {
  return String(text || '').length * size * 0.52
}

function pageStream(lines) {
  const parts = ['0.4 w', '0.15 0.15 0.15 RG']
  let y = 800
  lines.forEach((line, index) => {
    if (index > 0) y -= line.gap || 15
    const size = line.size || 11
    const font = line.bold ? 'F2' : 'F1'
    const x = 48 + (line.indent || 0)
    if (line.rule) parts.push(`${x} ${(y + size + 3).toFixed(1)} m 547 ${(y + size + 3).toFixed(1)} l S`)
    if (line.amount != null && line.amount !== '') {
      const amount = String(line.amount)
      const amountX = 547 - textWidth(amount, size)
      parts.push('BT')
      parts.push(`/${font} ${size} Tf`)
      parts.push(`1 0 0 1 ${x} ${y.toFixed(1)} Tm`)
      parts.push(`(${pdfEscape(line.label || line.text || '')}) Tj`)
      parts.push(`1 0 0 1 ${amountX.toFixed(1)} ${y.toFixed(1)} Tm`)
      parts.push(`(${pdfEscape(amount)}) Tj`)
      parts.push('ET')
      return
    }
    parts.push('BT')
    parts.push(`/${font} ${size} Tf`)
    parts.push(`1 0 0 1 ${x} ${y.toFixed(1)} Tm`)
    parts.push(`(${pdfEscape(line.text || '')}) Tj`)
    parts.push('ET')
  })
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
  objects[3] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'
  objects[4] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>'
  const pageIds = []
  pages.forEach((stream, i) => {
    const pageId = 5 + i * 2
    pageIds.push(pageId)
    objects[pageId] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents ${pageId + 1} 0 R /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> >>`
    objects[pageId + 1] = { stream }
  })
  objects[2] = `<< /Type /Pages /Count ${pages.length} /Kids [${pageIds.map(id => `${id} 0 R`).join(' ')}] >>`
  const maxId = 4 + pages.length * 2
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
