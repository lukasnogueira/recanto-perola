// Gerador de PDF mínimo (sem dependências) para o comprovante.
// Suporta apenas Helvetica/Helvetica-Bold e texto Latin-1 (acentos do pt-BR).

function latin1(str) {
  const arr = new Uint8Array(str.length)
  for (let i = 0; i < str.length; i++) arr[i] = str.charCodeAt(i) & 0xff
  return arr
}

function escapar(texto) {
  return String(texto)
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    .replace(/[\r\n]+/g, ' ')
}

function pad10(n) {
  return String(n).padStart(10, '0')
}

/**
 * linhas: array de itens. Cada item pode ser:
 *  - { texto, tamanho?, negrito?, x? }  -> linha de texto
 *  - { regua: true }                    -> linha divisória
 */
export function criarPDF(linhas, { largura = 595, altura = 842, margem = 40 } = {}) {
  let y = altura - margem
  const comandos = []

  for (const item of linhas) {
    if (item.regua) {
      comandos.push(`0.7 w 0.6 G ${margem} ${(y + 2).toFixed(1)} m ${largura - margem} ${(y + 2).toFixed(1)} l S 0 G`)
      y -= 10
      continue
    }
    const tamanho = item.tamanho ?? 11
    const fonte = item.negrito ? '/F2' : '/F1'
    const x = item.x ?? margem
    comandos.push(`BT ${fonte} ${tamanho} Tf 1 0 0 1 ${x} ${y.toFixed(1)} Tm (${escapar(item.texto)}) Tj ET`)
    y -= tamanho * 1.5
  }

  const conteudo = comandos.join('\n')

  const objetos = {
    1: '<< /Type /Catalog /Pages 2 0 R >>',
    2: '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    3: `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${largura} ${altura}] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>`,
    4: '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>',
    5: '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>',
    6: `<< /Length ${latin1(conteudo).length} >>\nstream\n${conteudo}\nendstream`,
  }

  let pdf = '%PDF-1.4\n'
  const offsets = {}
  for (let i = 1; i <= 6; i++) {
    offsets[i] = pdf.length
    pdf += `${i} 0 obj\n${objetos[i]}\nendobj\n`
  }
  const xref = pdf.length
  pdf += 'xref\n0 7\n0000000000 65535 f \n'
  for (let i = 1; i <= 6; i++) pdf += `${pad10(offsets[i])} 00000 n \n`
  pdf += `trailer\n<< /Size 7 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`

  return new Blob([latin1(pdf)], { type: 'application/pdf' })
}
