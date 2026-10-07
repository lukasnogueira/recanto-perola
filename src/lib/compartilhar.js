export function baixarBlob(blob, nome) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nome
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export async function compartilharArquivo(blob, nome, { title, text } = {}) {
  const file = new File([blob], nome, { type: blob.type || 'application/octet-stream' })
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title, text })
      return true
    } catch (erro) {
      if (erro?.name === 'AbortError') return true
    }
  }
  return false
}
