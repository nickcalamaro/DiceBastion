/**
 * Stored (uncompressed) zip. Receipts are already compressed, and this stays inside the Worker.
 */

const CRC_TABLE = (() => {
  const table = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1)
    table[n] = c >>> 0
  }
  return table
})()

export function crc32(bytes) {
  let c = 0xffffffff
  for (let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function u16(view, offset, value) {
  view.setUint16(offset, value, true)
}

function u32(view, offset, value) {
  view.setUint32(offset, value, true)
}

/**
 * @param {{ name: string, data: Uint8Array }[]} files
 * @returns {Uint8Array}
 */
export function zipStore(files) {
  const encoder = new TextEncoder()
  const locals = []
  const centrals = []
  let offset = 0
  for (const file of files) {
    const name = encoder.encode(String(file.name).replace(/\\/g, '/'))
    const data = file.data instanceof Uint8Array ? file.data : new Uint8Array(file.data)
    const crc = crc32(data)
    const local = new Uint8Array(30 + name.length)
    const lv = new DataView(local.buffer)
    u32(lv, 0, 0x04034b50)
    u16(lv, 4, 20)
    u16(lv, 6, 0)
    u16(lv, 8, 0)
    u16(lv, 10, 0)
    u16(lv, 12, 0)
    u32(lv, 14, crc)
    u32(lv, 18, data.length)
    u32(lv, 22, data.length)
    u16(lv, 26, name.length)
    u16(lv, 28, 0)
    local.set(name, 30)
    locals.push(local, data)

    const central = new Uint8Array(46 + name.length)
    const cv = new DataView(central.buffer)
    u32(cv, 0, 0x02014b50)
    u16(cv, 4, 20)
    u16(cv, 6, 20)
    u32(cv, 16, crc)
    u32(cv, 20, data.length)
    u32(cv, 24, data.length)
    u16(cv, 28, name.length)
    u32(cv, 42, offset)
    central.set(name, 46)
    centrals.push(central)
    offset += local.length + data.length
  }
  const centralSize = centrals.reduce((sum, part) => sum + part.length, 0)
  const end = new Uint8Array(22)
  const ev = new DataView(end.buffer)
  u32(ev, 0, 0x06054b50)
  u16(ev, 8, files.length)
  u16(ev, 10, files.length)
  u32(ev, 12, centralSize)
  u32(ev, 16, offset)
  const chunks = [...locals, ...centrals, end]
  const out = new Uint8Array(chunks.reduce((sum, part) => sum + part.length, 0))
  let at = 0
  for (const part of chunks) {
    out.set(part, at)
    at += part.length
  }
  return out
}

/** Reads stored entries back. Used to check the pack. */
export function unzipStore(bytes) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  const out = []
  let offset = 0
  while (offset + 30 <= bytes.length && view.getUint32(offset, true) === 0x04034b50) {
    const nameLen = view.getUint16(offset + 26, true)
    const extraLen = view.getUint16(offset + 28, true)
    const size = view.getUint32(offset + 22, true)
    const nameStart = offset + 30
    const dataStart = nameStart + nameLen + extraLen
    const name = new TextDecoder().decode(bytes.subarray(nameStart, nameStart + nameLen))
    out.push({ name, data: bytes.subarray(dataStart, dataStart + size) })
    offset = dataStart + size
  }
  return out
}
