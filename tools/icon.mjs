// Geração dos ícones do app (PNG) e empacotamento em .ico, sem dependências.
import { deflateSync } from 'node:zlib'

const CRC_TABLE = (() => {
  const t = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c >>> 0
  }
  return t
})()

function crc32(buf) {
  let c = 0xffffffff
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length, 0)
  const typeBuf = Buffer.from(type, 'ascii')
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0)
  return Buffer.concat([len, typeBuf, data, crc])
}

export function encodePng(width, height, rgba) {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8
  ihdr[9] = 6
  const raw = Buffer.alloc((width * 4 + 1) * height)
  for (let y = 0; y < height; y++) {
    raw[y * (width * 4 + 1)] = 0
    rgba.copy(raw, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4)
  }
  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

const TEAL = [14, 124, 102]
const CREAM = [247, 245, 240]
const GOLD = [224, 164, 88]
const clamp = (v) => Math.max(0, Math.min(255, Math.round(v)))
const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]

export function renderIcon(size) {
  const buf = Buffer.alloc(size * size * 4)
  const cx = size * 0.5
  const cy = size * 0.47
  const pearl = size * 0.25
  const gold = size * 0.085
  const radius = size * 0.22
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4
      const dx = Math.max(radius - x, x - (size - radius), 0)
      const dy = Math.max(radius - y, y - (size - radius), 0)
      const edge = Math.hypot(dx, dy) - radius
      let color = TEAL
      let alpha = 255
      if (edge > 0.5) alpha = 0
      else if (edge > -1) alpha = clamp((0.5 - edge) * 255)

      const dPearl = Math.hypot(x - cx, y - cy)
      if (dPearl < pearl) {
        const pearlT = Math.max(0, Math.min(1, (dPearl / pearl) ** 2))
        const shine = Math.hypot(x - (cx - pearl * 0.35), y - (cy - pearl * 0.4)) / (pearl * 0.9)
        let pc = mix(CREAM, GOLD, Math.min(0.35, pearlT * 0.4))
        pc = mix(pc, [255, 255, 255], Math.max(0, 0.5 - shine))
        color = pc
      } else if (dPearl < pearl + 1) {
        color = mix(TEAL, CREAM, clamp((1 - (dPearl - pearl)) * 255) / 255)
      }

      const dGold = Math.hypot(x - (cx - pearl * 0.35), y - (cy - pearl * 0.4))
      if (dGold < gold) color = mix(GOLD, [255, 255, 255], (1 - dGold / gold) * 0.25)

      buf[i] = clamp(color[0])
      buf[i + 1] = clamp(color[1])
      buf[i + 2] = clamp(color[2])
      buf[i + 3] = alpha
    }
  }
  return encodePng(size, size, buf)
}

// ICO contendo PNGs (suportado no Windows Vista+).
export function buildIco(entries) {
  const count = entries.length
  const header = Buffer.alloc(6)
  header.writeUInt16LE(0, 0)
  header.writeUInt16LE(1, 2)
  header.writeUInt16LE(count, 4)
  const dir = Buffer.alloc(16 * count)
  let offset = 6 + 16 * count
  const datas = []
  entries.forEach((e, i) => {
    const b = i * 16
    const dim = e.size >= 256 ? 0 : e.size
    dir[b] = dim
    dir[b + 1] = dim
    dir[b + 2] = 0
    dir[b + 3] = 0
    dir.writeUInt16LE(1, b + 4)
    dir.writeUInt16LE(32, b + 6)
    dir.writeUInt32LE(e.png.length, b + 8)
    dir.writeUInt32LE(offset, b + 12)
    offset += e.png.length
    datas.push(e.png)
  })
  return Buffer.concat([header, dir, ...datas])
}
