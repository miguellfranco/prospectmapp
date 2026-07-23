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

export function buildLandingHtml(input: ExportLandingInput): string {
  const { productName, priceDisplay, checkoutUrl, primaryColor: primary, secondaryColor: bg, copy, niche, coverImageDataUri, price } = input
  const isLight = bg.toLowerCase() === '#ffffff'
  const text = isLight ? '#18181b' : '#f4f4f7'
  const soft = isLight ? '#52525b' : '#a1a1aa'
  const cardBg = isLight ? '#f8f8fb' : 'rgba(255,255,255,0.04)'
  const cardBorder = isLight ? '#e4e4ee' : 'rgba(255,255,255,0.09)'
  const nicheIcon = nicheIconSvg(niche ?? '', 14)
  const mockup = coverImageDataUri ? `<div class="mockup"><img src="${coverImageDataUri}" alt="" /></div>` : ''

  const cta = checkoutUrl
    ? `<a class="cta" href="${esc(checkoutUrl)}">${esc(copy.cta ?? 'QUERO O MEU AGORA')}</a>`
    : `<span class="cta cta-off">Em breve disponível para compra</span>`

  const bullets = (copy.bullets ?? [])
    .map((b) => `<div class="bullet"><span class="tick">✓</span><span>${esc(b)}</span></div>`)
    .join('\n')

  const why = (copy.why_paragraphs ?? []).map((p) => `<p class="why-p">${esc(p)}</p>`).join('\n')

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
  body { background: ${bg}; color: ${text}; font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; line-height: 1.6; }
  section { padding: 56px 24px; }
  .wrap { max-width: 780px; margin: 0 auto; }
  .hero { position: relative; overflow: hidden; padding: 88px 24px 72px; text-align: center; }
  .glow { position: absolute; top: -160px; left: 50%; transform: translateX(-50%); width: 720px; height: 420px;
    background: ${hexToRgba(primary, 0.22)}; filter: blur(130px); border-radius: 50%; pointer-events: none; }
  .badge { display: inline-flex; align-items: center; gap: 8px; padding: 6px 18px; border-radius: 999px; border: 1px solid ${hexToRgba(primary, 0.5)};
    background: ${hexToRgba(primary, 0.12)}; color: ${primary}; font-size: 12px; font-weight: 700;
    letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 28px; }
  .mockup { width: min(260px, 60%); aspect-ratio: 1; margin: 0 auto 32px; border-radius: 20px; overflow: hidden;
    box-shadow: 0 24px 60px ${hexToRgba(primary, 0.3)}; border: 1px solid ${cardBorder}; }
  .mockup img { width: 100%; height: 100%; object-fit: cover; display: block; }
  h1 { font-size: clamp(2rem, 5vw, 3.4rem); line-height: 1.15; font-weight: 800; margin-bottom: 22px; }
  .sub { font-size: 19px; line-height: 1.65; color: ${soft}; max-width: 640px; margin: 0 auto 36px; }
  .cta { display: inline-block; background: linear-gradient(135deg, ${primary}, ${hexToRgba(primary, 0.75)});
    color: #fff; font-weight: 800; border-radius: 14px; padding: 20px 48px; font-size: 19px;
    text-decoration: none; box-shadow: 0 8px 30px ${hexToRgba(primary, 0.45)}; letter-spacing: .3px; }
  .cta-off { background: ${cardBg}; border: 1px solid ${cardBorder}; color: ${soft}; box-shadow: none; font-size: 14px; font-weight: 400; }
  .price-note { margin-top: 18px; font-size: 14px; color: ${soft}; }
  .price-note strong { color: ${primary}; font-size: 18px; }
  .installment { display: block; margin-top: 4px; font-size: 13px; color: ${soft}; opacity: .85; }
  h2 { text-align: center; font-size: 28px; font-weight: 800; margin-bottom: 36px; }
  .sect { border-top: 1px solid ${cardBorder}; }
  .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 16px; max-width: 860px; margin: 0 auto; }
  .bullet { display: flex; gap: 14px; align-items: flex-start; background: ${cardBg};
    border: 1px solid ${cardBorder}; border-radius: 16px; padding: 20px; font-size: 15px; color: ${soft}; }
  .tick { width: 26px; height: 26px; border-radius: 50%; flex-shrink: 0; display: flex; align-items: center;
    justify-content: center; background: ${hexToRgba(primary, 0.15)}; color: ${primary}; font-weight: 800; font-size: 14px; }
  .why-p { font-size: 16px; line-height: 1.8; color: ${soft}; margin-bottom: 18px; max-width: 700px; margin-left: auto; margin-right: auto; }
  .aud { background: ${cardBg}; border: 1px solid ${cardBorder}; border-left: 4px solid ${primary};
    border-radius: 12px; padding: 16px 20px; font-size: 15px; color: ${soft}; margin-bottom: 12px; max-width: 700px; margin-left: auto; margin-right: auto; }
  .offer { text-align: center; padding: 72px 24px 80px; }
  .offer-card { max-width: 560px; margin: 0 auto; background: ${cardBg}; border: 1px solid ${hexToRgba(primary, 0.4)};
    border-radius: 24px; padding: 48px 32px; box-shadow: 0 20px 60px ${hexToRgba(primary, 0.18)}; }
  .offer h2 { margin-bottom: 10px; font-size: 26px; }
  .big-price { font-size: 44px; font-weight: 900; color: ${primary}; }
  .price-sub { font-size: 14px; color: ${soft}; display: block; margin-top: 4px; margin-bottom: 28px; }
  .guarantee { margin-top: 22px; font-size: 13px; color: ${soft}; }
  footer { padding: 28px 24px; border-top: 1px solid ${cardBorder}; text-align: center; font-size: 12px; color: ${soft}; opacity: .7; }
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
    ${copy.guarantee ? `<p class="guarantee">🔒 ${esc(copy.guarantee)}</p>` : ''}
  </div>
</section>

<footer>Os resultados podem variar de pessoa para pessoa.</footer>

</body>
</html>`
}
