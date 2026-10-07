import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { renderIcon } from './icon.mjs'

const here = dirname(fileURLToPath(import.meta.url))

const targets = [
  ['public/pwa-192.png', 192],
  ['public/pwa-512.png', 512],
  ['public/apple-touch-icon.png', 180],
]

for (const [rel, size] of targets) {
  const out = resolve(here, '..', rel)
  mkdirSync(dirname(out), { recursive: true })
  writeFileSync(out, renderIcon(size))
  console.log('gerado', rel)
}
