// Gera o HTML autossuficiente da página de vendas para o usuário hospedar
// onde quiser (Netlify Drop, Vercel, Hostinger...) — zero dependência da
// nossa infraestrutura. Mesmo design da pré-visualização /p/[slug].

import { nicheIconSvg } from './niche-icons'

export interface ExportLandingInput {
  productName: string
  priceDisplay: string | null
  checkoutUrl: string | null
  primaryColor: string
  secondaryColor: string
  niche?: string // usado só para escolher o ícone decorativo do nicho
  coverImageDataUri?: string | null // capa do e-book gerada por IA — usada como mockup do produto
  price?: number | null // preço numérico — usado só para calcular o valor da parcela em até 12x
  copy: {
    headline: string
    subheadline?: string
    bullets?: string[]
    why_title?: string
    why_paragraphs?: string[]
    audience?: string[]
    cta?: string
    guarantee?: string
  }
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function hexToRgba(hex: string, alpha: number): string {
  const m = hex.match(/^#([0-9a-f]{6})$/i)
  if (!m) return `rgba(124,58,237,${alpha})`
  const n = parseInt(m[1], 16)
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`
}

const CHECK_SVG = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>'
const LOCK_SVG = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>'
const BOLT_SVG = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>'
const DEVICE_SVG = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>'

export function buildLandingHtml(input: ExportLandingInput): string {
  const { productName, priceDisplay, checkoutUrl, primaryColor: primary, secondaryColor: bg, copy, niche, coverImageDataUri, price } = input
  const isLight = bg.toLowerCase() === '#ffffff'
  const text = isLight ? '#18181b' : '#f4f4f7'
  const soft = isLight ? '#52525b' : '#a1a1aa'
  const cardBg = isLight ? '#f8f8fb' : 'rgba(255,255,255,0.045)'
  const cardBorder = isLight ? '#e4e4ee' : 'rgba(255,255,255,0.1)'
  const dot = isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)'
  const nicheIcon = nicheIconSvg(niche ?? '', 14)
  const mockup = coverImageDataUri ? `<div class="mockup"><img src="${coverImageDataUri}" alt="" /></div>` : ''

  const cta = checkoutUrl
    ? `<a class="cta" href="${esc(checkoutUrl)}">${esc(copy.cta ?? 'QUERO O MEU AGORA')}</a>`
    : `<span class="cta cta-off">Link de compra ainda não configurado</span>`

  const bullets = (copy.bullets ?? [])
    .map((b) => `<div class="bullet"><span class="tick">${CHECK_SVG}</span><span>${esc(b)}</span></div>`)
    .join('\n')

  const why = (copy.why_paragraphs ?? [])
    .map((p, i) => `<div class="why-card"><span class="why-n">${i + 1}</span><p>${esc(p)}</p></div>`)
    .join('\n')

  const audience = (copy.audience ?? []).map((a) => `<div class="aud">${esc(a)}</div>`).join('\n')

  // "Em até 12x" é só uma indicação pro visitante — o parcelamento real (e o
  // número de parcelas disponível pra esse valor) é decidido no checkout do
  // gateway de pagamento, não aqui.
  const installmentDisplay = price && price > 0 ? `R$ ${(price / 12).toFixed(2).replace('.', ',')}` : null

  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(productName)}</title>
<meta name="description" content="${esc(copy.subheadline ?? copy.headline)}">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: ${bg}; color: ${text}; font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; line-height: 1.6; -webkit-font-smoothing: antialiased; }
  section { padding: 64px 24px; }
  .wrap { max-width: 780px; margin: 0 auto; }
  .hero { position: relative; overflow: hidden; padding: 96px 24px 76px; text-align: center;
    background-image: radial-gradient(${dot} 1.5px, transparent 1.5px); background-size: 26px 26px;
    background-position: center -10px; }
  .glow { position: absolute; top: -160px; left: 50%; transform: translateX(-50%); width: 720px; height: 420px;
    background: ${hexToRgba(primary, 0.24)}; filter: blur(130px); border-radius: 50%; pointer-events: none; }
  .badge { display: inline-flex; align-items: center; gap: 8px; padding: 6px 18px; border-radius: 999px; border: 1px solid ${hexToRgba(primary, 0.5)};
    background: ${hexToRgba(primary, 0.12)}; color: ${primary}; font-size: 12px; font-weight: 700;
    letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 28px; position: relative; }
  .mockup { width: min(260px, 60%); aspect-ratio: 1; margin: 0 auto 32px; border-radius: 20px; overflow: hidden;
    box-shadow: 0 24px 60px ${hexToRgba(primary, 0.3)}; border: 1px solid ${cardBorder}; position: relative; }
  .mockup img { width: 100%; height: 100%; object-fit: cover; display: block; }
  h1 { font-size: clamp(2rem, 5vw, 3.4rem); line-height: 1.15; font-weight: 800; letter-spacing: -0.5px; margin-bottom: 22px; position: relative; }
  .sub { font-size: 19px; line-height: 1.65; color: ${soft}; max-width: 640px; margin: 0 auto 36px; position: relative; }
  .cta { display: inline-block; background: linear-gradient(135deg, ${primary}, ${hexToRgba(primary, 0.75)});
    color: #fff; font-weight: 800; border-radius: 14px; padding: 20px 48px; font-size: 19px;
    text-decoration: none; box-shadow: 0 8px 30px ${hexToRgba(primary, 0.45)}; letter-spacing: .3px;
    position: relative; transition: transform .15s ease, box-shadow .15s ease; }
  .cta:hover { transform: translateY(-2px); box-shadow: 0 12px 38px ${hexToRgba(primary, 0.55)}; }
  .cta-off { background: ${cardBg}; border: 1px dashed ${cardBorder}; color: ${soft}; box-shadow: none; font-size: 14px; font-weight: 500; }
  .price-note { margin-top: 18px; font-size: 14px; color: ${soft}; position: relative; }
  .price-note strong { color: ${primary}; font-size: 18px; }
  .installment { display: block; margin-top: 4px; font-size: 13px; color: ${soft}; opacity: .85; }
  .trust { display: flex; flex-wrap: wrap; justify-content: center; gap: 10px 22px; margin-top: 30px; position: relative; }
  .trust span { display: inline-flex; align-items: center; gap: 6px; font-size: 12.5px; color: ${soft}; }
  .trust svg { color: ${primary}; flex-shrink: 0; }
  h2 { text-align: center; font-size: 28px; font-weight: 800; letter-spacing: -0.3px; margin-bottom: 36px; }
  .sect { border-top: 1px solid ${cardBorder}; }
  .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 16px; max-width: 860px; margin: 0 auto; }
  .bullet { display: flex; gap: 14px; align-items: flex-start; background: ${cardBg};
    border: 1px solid ${cardBorder}; border-radius: 16px; padding: 20px; font-size: 15px; color: ${soft};
    transition: border-color .15s ease, transform .15s ease; }
  .bullet:hover { border-color: ${hexToRgba(primary, 0.4)}; transform: translateY(-2px); }
  .tick { width: 26px; height: 26px; border-radius: 50%; flex-shrink: 0; display: flex; align-items: center;
    justify-content: center; background: ${hexToRgba(primary, 0.15)}; color: ${primary}; }
  .why-card { display: flex; gap: 18px; align-items: flex-start; max-width: 700px; margin: 0 auto 16px;
    background: ${cardBg}; border: 1px solid ${cardBorder}; border-radius: 16px; padding: 22px 24px; }
  .why-card p { font-size: 15.5px; line-height: 1.75; color: ${soft}; }
  .why-n { flex-shrink: 0; width: 30px; height: 30px; border-radius: 9px; display: flex; align-items: center; justify-content: center;
    background: linear-gradient(135deg, ${primary}, ${hexToRgba(primary, 0.7)}); color: #fff; font-weight: 800; font-size: 13px; }
  .aud { background: ${cardBg}; border: 1px solid ${cardBorder}; border-left: 4px solid ${primary};
    border-radius: 12px; padding: 16px 20px; font-size: 15px; color: ${soft}; margin-bottom: 12px; max-width: 700px; margin-left: auto; margin-right: auto; }
  .offer { text-align: center; padding: 76px 24px 84px; position: relative; overflow: hidden; }
  .offer-card { max-width: 560px; margin: 0 auto; background: ${cardBg}; border: 1px solid ${hexToRgba(primary, 0.4)};
    border-radius: 24px; padding: 52px 32px; box-shadow: 0 24px 70px ${hexToRgba(primary, 0.2)}; position: relative; }
  .offer h2 { margin-bottom: 10px; font-size: 26px; }
  .big-price { font-size: 44px; font-weight: 900; color: ${primary}; }
  .price-sub { font-size: 14px; color: ${soft}; display: block; margin-top: 4px; margin-bottom: 28px; }
  .guarantee { margin-top: 22px; font-size: 13px; color: ${soft}; display: flex; align-items: center; justify-content: center; gap: 6px; }
  .guarantee svg { color: ${primary}; flex-shrink: 0; }
  footer { padding: 28px 24px; border-top: 1px solid ${cardBorder}; text-align: center; font-size: 12px; color: ${soft}; opacity: .7; }
  @media (max-width: 640px) { section { padding: 48px 20px; } .hero { padding: 72px 20px 56px; } }
</style>
</head>
<body>

<section class="hero">
  <div class="glow"></div>
  <div class="wrap" style="position:relative">
    <span class="badge">${nicheIcon}E-book digital · acesso imediato</span>
    ${mockup}
    <h1>${esc(copy.headline)}</h1>
    ${copy.subheadline ? `<p class="sub">${esc(copy.subheadline)}</p>` : ''}
    ${cta}
    ${priceDisplay ? `<p class="price-note">por apenas <strong>${esc(priceDisplay)}</strong>${installmentDisplay ? ` <span class="installment">ou em até 12x de ${esc(installmentDisplay)}</span>` : ''}</p>` : ''}
    <div class="trust">
      <span>${BOLT_SVG} Acesso imediato após o pagamento</span>
      <span>${LOCK_SVG} Pagamento seguro</span>
      <span>${DEVICE_SVG} Leia em qualquer dispositivo</span>
    </div>
  </div>
</section>

${bullets ? `<section class="sect"><h2>O que você vai encontrar</h2><div class="grid">${bullets}</div></section>` : ''}

${why ? `<section class="sect"><h2>${esc(copy.why_title ?? 'Por que esse método funciona')}</h2>${why}</section>` : ''}

${audience ? `<section class="sect"><h2>Esse material é para você que...</h2>${audience}</section>` : ''}

<section class="sect offer">
  <div class="offer-card">
    <h2>${esc(productName)}</h2>
    ${priceDisplay ? `<div><span class="big-price">${esc(priceDisplay)}</span><span class="price-sub">pagamento único${installmentDisplay ? ` · ou em até 12x de ${esc(installmentDisplay)}` : ''}</span></div>` : ''}
    ${cta}
    ${copy.guarantee ? `<p class="guarantee">${LOCK_SVG} ${esc(copy.guarantee)}</p>` : ''}
  </div>
</section>

<footer>Os resultados podem variar de pessoa para pessoa.</footer>

</body>
</html>`
}
