import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import { renderIcon, buildIco } from './icon.mjs'

const destino = process.argv[2]
if (!destino) {
  console.error('Uso: node tools/gen-ico.mjs <caminho-de-saida.ico>')
  process.exit(1)
}

const sizes = [16, 32, 48, 64, 128, 256]
const ico = buildIco(sizes.map((size) => ({ size, png: renderIcon(size) })))

mkdirSync(dirname(destino), { recursive: true })
writeFileSync(destino, ico)
console.log('gerado', destino, `(${ico.length} bytes)`)
