// Conversor de markdown → HTML minimalista e seguro (escapa HTML antes de
// aplicar a formatação). Cobre o subconjunto que a IA gera nos e-books:
// títulos, negrito/itálico, listas, citações, separadores e parágrafos.

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function inline(s: string): string {
  return s
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>')
    .replace(/`([^`\n]+)`/g, '<code>$1</code>')
}

export function markdownToHtml(md: string): string {
  const lines = escapeHtml(md.replace(/\r\n/g, '\n')).split('\n')
  const out: string[] = []
  let list: 'ul' | 'ol' | null = null
  let para: string[] = []

  const flushPara = () => {
    if (para.length) {
      out.push(`<p>${inline(para.join(' '))}</p>`)
      para = []
    }
  }
  const closeList = () => {
    if (list) {
      out.push(`</${list}>`)
      list = null
    }
  }

  for (const raw of lines) {
    const line = raw.trimEnd()
    const trimmed = line.trim()

    if (!trimmed) { flushPara(); closeList(); continue }

    const h = trimmed.match(/^(#{1,4})\s+(.*)$/)
    if (h) {
      flushPara(); closeList()
      const level = h[1].length
      out.push(`<h${level}>${inline(h[2])}</h${level}>`)
      continue
    }
    if (/^(---|\*\*\*|___)\s*$/.test(trimmed)) {
      flushPara(); closeList()
      out.push('<hr/>')
      continue
    }
    const quote = trimmed.match(/^&gt;\s?(.*)$/)
    if (quote) {
      flushPara(); closeList()
      out.push(`<blockquote>${inline(quote[1])}</blockquote>`)
      continue
    }
    const ul = trimmed.match(/^[-*]\s+(.*)$/)
    if (ul) {
      flushPara()
      if (list !== 'ul') { closeList(); out.push('<ul>'); list = 'ul' }
      out.push(`<li>${inline(ul[1])}</li>`)
      continue
    }
    const ol = trimmed.match(/^\d+[.)]\s+(.*)$/)
    if (ol) {
      flushPara()
      if (list !== 'ol') { closeList(); out.push('<ol>'); list = 'ol' }
      out.push(`<li>${inline(ol[1])}</li>`)
      continue
    }

    closeList()
    para.push(trimmed)
  }
  flushPara(); closeList()
  return out.join('\n')
}
