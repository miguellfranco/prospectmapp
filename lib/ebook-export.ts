// Monta o e-book "designado" (estilo Gamma): capa + páginas com layout
// profissional, animações de entrada e CSS de impressão (Imprimir → PDF quebra
// certinho página por página). HTML 100% autossuficiente — funciona no preview
// embutido do wizard e no arquivo baixado pelo usuário.

export interface EbookStep { title: string; text: string }

export interface EbookPage {
  kind: 'intro' | 'chapter' | 'steps' | 'checklist' | 'bonus' | 'conclusion'
  title: string
  subtitle?: string
  intro?: string
  paragraphs?: string[]
  bullets?: string[]
  steps?: EbookStep[]
  items?: string[]
  highlight?: string
}

export interface EbookDesign {
  title: string
  subtitle?: string
  pages: EbookPage[]
}

const KIND_LABELS: Record<string, string> = {
  intro: 'Introdução',
  chapter: 'Capítulo',
  steps: 'Passo a passo',
  checklist: 'Plano de ação',
  bonus: 'Bônus',
  conclusion: 'Conclusão',
}

function esc(s: string): string {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

export function isValidEbookDesign(d: any): d is EbookDesign {
  return Boolean(d?.title && Array.isArray(d?.pages) && d.pages.length >= 4 && d.pages.every((p: any) => p?.title))
}

// Versão texto (markdown) derivada do design — usada como referência/fallback
export function ebookDesignToMarkdown(d: EbookDesign): string {
  const out: string[] = [`# ${d.title}`]
  if (d.subtitle) out.push(`_${d.subtitle}_`)
  for (const p of d.pages) {
    out.push(`\n## ${p.title}`)
    if (p.intro) out.push(p.intro)
    for (const par of p.paragraphs ?? []) out.push(par)
    for (const b of p.bullets ?? []) out.push(`- ${b}`)
    ;(p.steps ?? []).forEach((s, i) => out.push(`${i + 1}. **${s.title}** — ${s.text}`))
    for (const it of p.items ?? []) out.push(`- [ ] ${it}`)
    if (p.highlight) out.push(`> ${p.highlight}`)
  }
  return out.join('\n\n')
}

export function buildEbookHtml(design: EbookDesign, accent = '#7c3aed'): string {
  let chapterCount = 0
  const totalPages = design.pages.length + 1 // + capa

  const pagesHtml = design.pages.map((p, idx) => {
    const pageNum = idx + 2
    const label = p.kind === 'chapter' ? `Capítulo ${++chapterCount}` : (KIND_LABELS[p.kind] ?? '')

    const paragraphs = (p.paragraphs ?? []).map((t) => `<p class="para rv">${esc(t)}</p>`).join('\n')

    const bullets = (p.bullets ?? []).length
      ? `<div class="cards">${(p.bullets ?? []).map((b) => `<div class="card rv"><span class="tick">✦</span><span>${esc(b)}</span></div>`).join('')}</div>`
      : ''

    const steps = (p.steps ?? []).length
      ? `<div class="steps">${(p.steps ?? []).map((s, i) => `
          <div class="step rv">
            <div class="step-n">${i + 1}</div>
            <div><p class="step-t">${esc(s.title)}</p><p class="step-x">${esc(s.text)}</p></div>
          </div>`).join('')}</div>`
      : ''

    const items = (p.items ?? []).length
      ? `<div class="checks">${(p.items ?? []).map((it) => `<label class="check rv"><span class="box"></span><span>${esc(it)}</span></label>`).join('')}</div>`
      : ''

    const highlight = p.highlight ? `<div class="quote rv">${esc(p.highlight)}</div>` : ''

    return `
  <section class="page">
    ${label ? `<div class="chip rv">${esc(label)}</div>` : ''}
    <h2 class="rv">${esc(p.title)}</h2>
    ${p.subtitle ? `<p class="sub rv">${esc(p.subtitle)}</p>` : ''}
    ${p.intro ? `<p class="para lead rv">${esc(p.intro)}</p>` : ''}
    ${paragraphs}
    ${bullets}
    ${steps}
    ${items}
    ${highlight}
    <footer class="pfoot"><span>${esc(design.title)}</span><span>${pageNum} / ${totalPages}</span></footer>
  </section>`
  }).join('\n')

  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(design.title)}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: linear-gradient(180deg, #edeaf6 0%, #f7f5fc 100%); font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
    color: #27272e; line-height: 1.7; padding: 32px 16px; }
  .page { max-width: 760px; margin: 0 auto 36px; background: #fff; border-radius: 24px;
    padding: 64px 60px 80px; box-shadow: 0 12px 44px rgba(40, 20, 90, 0.10); position: relative; overflow: hidden; min-height: 640px; }

  /* ===== CAPA ===== */
  .cover { background: radial-gradient(120% 90% at 80% -10%, ${accent}55, transparent 55%),
    radial-gradient(100% 80% at -10% 110%, ${accent}40, transparent 50%), linear-gradient(150deg, #14101f, #201535 70%, #191026);
    color: #fff; display: flex; flex-direction: column; justify-content: center; min-height: 760px; }
  .cover .brand { display: inline-flex; align-self: flex-start; padding: 7px 20px; border-radius: 999px; font-size: 12px;
    letter-spacing: 3px; text-transform: uppercase; font-weight: 700; border: 1px solid ${accent}88; color: #e6ddff;
    background: ${accent}26; margin-bottom: 48px; }
  .cover h1 { font-size: clamp(2.1rem, 5vw, 3.3rem); line-height: 1.12; font-weight: 800; letter-spacing: -1px; margin-bottom: 22px; }
  .cover .tag { font-size: 1.1rem; color: #cfc6e8; max-width: 520px; line-height: 1.65; }
  .cover .rule { width: 84px; height: 5px; border-radius: 99px; background: linear-gradient(90deg, ${accent}, #c4b5fd); margin: 36px 0; }
  .cover .foot { margin-top: auto; padding-top: 48px; font-size: 12px; letter-spacing: 2px; text-transform: uppercase; color: #9d92be; }

  /* ===== PÁGINAS ===== */
  .chip { display: inline-flex; padding: 6px 18px; border-radius: 999px; background: ${accent}14; color: ${accent};
    font-size: 12px; font-weight: 800; letter-spacing: 2.5px; text-transform: uppercase; margin-bottom: 22px; }
  h2 { font-size: 2rem; font-weight: 800; letter-spacing: -0.6px; line-height: 1.2; margin-bottom: 12px; color: #1c1826; }
  .sub { color: #6d6786; font-size: 1.02rem; margin-bottom: 18px; }
  .para { color: #4b4560; font-size: 1.02rem; margin-bottom: 16px; }
  .lead { font-size: 1.1rem; color: #37324a; }
  .cards { display: grid; gap: 12px; margin: 22px 0; }
  .card { display: flex; gap: 14px; align-items: flex-start; background: linear-gradient(135deg, ${accent}0d, ${accent}05);
    border: 1px solid ${accent}26; border-radius: 16px; padding: 16px 20px; color: #3d3752; font-size: .98rem; }
  .tick { color: ${accent}; font-size: 1.05rem; line-height: 1.6; }
  .steps { display: grid; gap: 14px; margin: 24px 0; counter-reset: st; }
  .step { display: flex; gap: 18px; align-items: flex-start; background: #faf9fd; border: 1px solid #eceafa;
    border-radius: 18px; padding: 18px 22px; }
  .step-n { width: 40px; height: 40px; border-radius: 13px; flex-shrink: 0; display: flex; align-items: center; justify-content: center;
    background: linear-gradient(135deg, ${accent}, #9d6bff); color: #fff; font-weight: 800; font-size: 1.05rem;
    box-shadow: 0 6px 16px ${accent}55; }
  .step-t { font-weight: 700; color: #241f33; margin-bottom: 3px; }
  .step-x { color: #57506e; font-size: .95rem; }
  .checks { display: grid; gap: 10px; margin: 22px 0; }
  .check { display: flex; gap: 14px; align-items: flex-start; padding: 13px 18px; border-radius: 14px;
    background: #faf9fd; border: 1px dashed ${accent}40; color: #3d3752; font-size: .97rem; }
  .box { width: 20px; height: 20px; border-radius: 6px; border: 2px solid ${accent}; flex-shrink: 0; margin-top: 2px; }
  .quote { margin: 26px 0 8px; padding: 20px 26px; border-left: 5px solid ${accent}; border-radius: 6px 18px 18px 6px;
    background: ${accent}0d; color: #37324a; font-size: 1.05rem; font-style: italic; }
  .pfoot { position: absolute; bottom: 26px; left: 60px; right: 60px; display: flex; justify-content: space-between;
    font-size: 11px; letter-spacing: 1.5px; text-transform: uppercase; color: #b3aecb; }

  /* ===== ANIMAÇÕES (entram conforme a rolagem; sem JS tudo fica visível) ===== */
  .anim .rv { opacity: 0; transform: translateY(22px); transition: opacity .6s ease, transform .6s ease; }
  .anim .rv.in { opacity: 1; transform: none; }

  @media (max-width: 640px) { .page { padding: 44px 26px 72px; } .pfoot { left: 26px; right: 26px; } h2 { font-size: 1.6rem; } }
  @media print {
    body { background: #fff; padding: 0; }
    .page { box-shadow: none; border-radius: 0; margin: 0; max-width: none; min-height: auto; page-break-after: always; }
    .anim .rv { opacity: 1 !important; transform: none !important; }
  }
</style>
</head>
<body>

<section class="page cover">
  <span class="brand">E-book exclusivo</span>
  <h1>${esc(design.title)}</h1>
  <div class="rule"></div>
  ${design.subtitle ? `<p class="tag">${esc(design.subtitle)}</p>` : ''}
  <p class="foot">${totalPages} páginas · leitura prática</p>
</section>

${pagesHtml}

<script>
  // Animação de entrada dos blocos conforme a rolagem (com fallback sem JS)
  document.body.classList.add('anim');
  var els = document.querySelectorAll('.rv');
  els.forEach(function (el, i) { el.style.transitionDelay = (i % 8) * 60 + 'ms'; });
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.12 });
    els.forEach(function (el) { io.observe(el); });
  } else {
    els.forEach(function (el) { el.classList.add('in'); });
  }
</script>
</body>
</html>`
}
