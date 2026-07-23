export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db'

// Landing page pública gerada pelo InfoBook (Passo 3 do wizard).
// Renderizada no servidor com as cores escolhidas pelo usuário.

interface LandingCopy {
  headline: string
  subheadline?: string
  bullets?: string[]
  why_title?: string
  why_paragraphs?: string[]
  audience?: string[]
  cta?: string
  guarantee?: string
}

async function getLanding(slug: string) {
  try {
    return await prisma.landingPage.findUnique({
      where: { slug },
      include: {
        structure: {
          include: { product: { select: { name: true, price: true, checkoutUrl: true } } },
        },
      },
    })
  } catch {
    return null
  }
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const landing = await getLanding(params.slug)
  if (!landing) return { title: 'Página não encontrada' }
  return {
    title: landing.structure.product?.name ?? landing.headline,
    description: landing.subheadline ?? landing.headline,
  }
}

function hexToRgba(hex: string, alpha: number): string {
  const m = hex.match(/^#([0-9a-f]{6})$/i)
  if (!m) return `rgba(124,58,237,${alpha})`
  const n = parseInt(m[1], 16)
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`
}

export default async function PublicLandingPage({ params }: { params: { slug: string } }) {
  const landing = await getLanding(params.slug)
  if (!landing || !landing.publishedAt) notFound()

  let copy: LandingCopy = { headline: landing.headline }
  try {
    copy = { ...copy, ...JSON.parse(landing.copyJson) }
  } catch { /* usa somente headline/subheadline salvos */ }

  const product = landing.structure.product
  const primary = landing.primaryColor
  const bg = landing.secondaryColor
  const isLightBg = bg.toLowerCase() === '#ffffff'
  const text = isLightBg ? '#18181b' : '#f4f4f7'
  const textSoft = isLightBg ? '#52525b' : '#a1a1aa'
  const cardBg = isLightBg ? '#f8f8fb' : 'rgba(255,255,255,0.04)'
  const cardBorder = isLightBg ? '#e4e4ee' : 'rgba(255,255,255,0.09)'
  const checkoutUrl = product?.checkoutUrl ?? null

  const CtaButton = ({ big }: { big?: boolean }) => (
    checkoutUrl ? (
      <a
        href={checkoutUrl}
        style={{
          display: 'inline-block',
          background: `linear-gradient(135deg, ${primary}, ${hexToRgba(primary, 0.75)})`,
          color: '#fff',
          fontWeight: 800,
          borderRadius: 14,
          padding: big ? '20px 48px' : '16px 36px',
          fontSize: big ? 19 : 16,
          textDecoration: 'none',
          boxShadow: `0 8px 30px ${hexToRgba(primary, 0.45)}`,
          letterSpacing: 0.3,
        }}
      >
        {copy.cta ?? 'QUERO O MEU AGORA'}
      </a>
    ) : (
      <span style={{
        display: 'inline-block', background: cardBg, border: `1px solid ${cardBorder}`,
        color: textSoft, borderRadius: 14, padding: '16px 36px', fontSize: 14,
      }}>
        Link de compra ainda não configurado
      </span>
    )
  )

  return (
    <div style={{ background: bg, color: text, minHeight: '100vh', fontFamily: 'var(--font-space-grotesk), system-ui, sans-serif' }}>
      {/* HERO */}
      <section style={{ position: 'relative', overflow: 'hidden', padding: '88px 24px 72px', textAlign: 'center' }}>
        <div style={{
          position: 'absolute', top: -160, left: '50%', transform: 'translateX(-50%)',
          width: 720, height: 420, background: hexToRgba(primary, 0.22), filter: 'blur(130px)',
          borderRadius: '50%', pointerEvents: 'none',
        }} />
        <div style={{ position: 'relative', maxWidth: 780, margin: '0 auto' }}>
          <span style={{
            display: 'inline-block', padding: '6px 18px', borderRadius: 999,
            border: `1px solid ${hexToRgba(primary, 0.5)}`, background: hexToRgba(primary, 0.12),
            color: primary, fontSize: 12, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 28,
          }}>
            E-book digital · acesso imediato
          </span>
          <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.4rem)', lineHeight: 1.15, fontWeight: 800, margin: '0 0 22px' }}>
            {copy.headline}
          </h1>
          {copy.subheadline && (
            <p style={{ fontSize: 19, lineHeight: 1.65, color: textSoft, maxWidth: 640, margin: '0 auto 36px' }}>
              {copy.subheadline}
            </p>
          )}
          <CtaButton big />
          {landing.priceDisplay && (
            <p style={{ marginTop: 18, fontSize: 14, color: textSoft }}>
              por apenas <strong style={{ color: primary, fontSize: 18 }}>{landing.priceDisplay}</strong>
            </p>
          )}
        </div>
      </section>

      {/* BENEFÍCIOS */}
      {copy.bullets && copy.bullets.length > 0 && (
        <section style={{ padding: '56px 24px', borderTop: `1px solid ${cardBorder}` }}>
          <div style={{ maxWidth: 860, margin: '0 auto' }}>
            <h2 style={{ textAlign: 'center', fontSize: 28, fontWeight: 800, marginBottom: 40 }}>
              O que você vai encontrar
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
              {copy.bullets.map((b, i) => (
                <div key={i} style={{
                  display: 'flex', gap: 14, alignItems: 'flex-start',
                  background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: 16, padding: 20,
                }}>
                  <span style={{
                    width: 26, height: 26, borderRadius: '50%', flexShrink: 0, display: 'flex',
                    alignItems: 'center', justifyContent: 'center', background: hexToRgba(primary, 0.15),
                    color: primary, fontWeight: 800, fontSize: 14,
                  }}>✓</span>
                  <span style={{ fontSize: 15, lineHeight: 1.6, color: textSoft }}>{b}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* POR QUE FUNCIONA */}
      {copy.why_paragraphs && copy.why_paragraphs.length > 0 && (
        <section style={{ padding: '56px 24px', borderTop: `1px solid ${cardBorder}` }}>
          <div style={{ maxWidth: 700, margin: '0 auto' }}>
            <h2 style={{ textAlign: 'center', fontSize: 28, fontWeight: 800, marginBottom: 28 }}>
              {copy.why_title ?? 'Por que esse método funciona'}
            </h2>
            {copy.why_paragraphs.map((p, i) => (
              <p key={i} style={{ fontSize: 16, lineHeight: 1.8, color: textSoft, marginBottom: 18 }}>{p}</p>
            ))}
          </div>
        </section>
      )}

      {/* PARA QUEM É */}
      {copy.audience && copy.audience.length > 0 && (
        <section style={{ padding: '56px 24px', borderTop: `1px solid ${cardBorder}` }}>
          <div style={{ maxWidth: 700, margin: '0 auto' }}>
            <h2 style={{ textAlign: 'center', fontSize: 28, fontWeight: 800, marginBottom: 32 }}>
              Esse material é para você que...
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {copy.audience.map((a, i) => (
                <div key={i} style={{
                  background: cardBg, border: `1px solid ${cardBorder}`, borderLeft: `4px solid ${primary}`,
                  borderRadius: 12, padding: '16px 20px', fontSize: 15, lineHeight: 1.6, color: textSoft,
                }}>
                  {a}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* OFERTA FINAL */}
      <section style={{ padding: '72px 24px 80px', borderTop: `1px solid ${cardBorder}`, textAlign: 'center' }}>
        <div style={{
          maxWidth: 560, margin: '0 auto', background: cardBg,
          border: `1px solid ${hexToRgba(primary, 0.4)}`, borderRadius: 24, padding: '48px 32px',
          boxShadow: `0 20px 60px ${hexToRgba(primary, 0.18)}`,
        }}>
          <h2 style={{ fontSize: 26, fontWeight: 800, marginBottom: 10 }}>
            {product?.name ?? copy.headline}
          </h2>
          {landing.priceDisplay && (
            <div style={{ margin: '18px 0 28px' }}>
              <span style={{ fontSize: 44, fontWeight: 900, color: primary }}>{landing.priceDisplay}</span>
              <span style={{ fontSize: 14, color: textSoft, display: 'block', marginTop: 4 }}>pagamento único</span>
            </div>
          )}
          <CtaButton big />
          {copy.guarantee && (
            <p style={{ marginTop: 22, fontSize: 13, color: textSoft }}>🔒 {copy.guarantee}</p>
          )}
        </div>
      </section>

      <footer style={{ padding: '28px 24px', borderTop: `1px solid ${cardBorder}`, textAlign: 'center' }}>
        <p style={{ fontSize: 12, color: textSoft, opacity: 0.7 }}>
          Página criada com InfoBook · Os resultados podem variar de pessoa para pessoa.
        </p>
      </footer>
    </div>
  )
}
