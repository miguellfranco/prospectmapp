export const dynamic = 'force-dynamic'
export const maxDuration = 60

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/session'
import { hasActiveAccess, NO_ACCESS_MSG } from '@/lib/plan'
import { prisma } from '@/lib/db'
import { geminiGenerate, parseJsonLoose } from '@/lib/gemini'
import { isRateLimited } from '@/lib/rate-limit'

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48)
}

const HEX_RE = /^#[0-9a-fA-F]{6}$/

interface LandingCopy {
  headline: string
  subheadline: string
  bullets: string[]
  why_title: string
  why_paragraphs: string[]
  audience: string[]
  cta: string
  guarantee: string
}

// Passo 3 do wizard — gera a copy da landing page com IA e publica em /p/[slug].
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  if (!hasActiveAccess(user)) return NextResponse.json({ error: NO_ACCESS_MSG }, { status: 403 })

  if (isRateLimited(`landing-gen:${user.id}`, 5, 60_000)) {
    return NextResponse.json({ error: 'Muitas gerações em pouco tempo. Aguarde um instante.' }, { status: 429 })
  }

  const body = await req.json().catch(() => ({}))
  const pain = String(body?.pain ?? '').trim()
  const primaryColor = HEX_RE.test(String(body?.primaryColor ?? '')) ? body.primaryColor : '#7c3aed'
  const secondaryColor = HEX_RE.test(String(body?.secondaryColor ?? '')) ? body.secondaryColor : '#05050b'

  const structure = await prisma.structure.findFirst({
    where: { id: params.id, userId: user.id },
    include: { product: true, landingPage: true },
  })
  if (!structure) return NextResponse.json({ error: 'Estrutura não encontrada' }, { status: 404 })
  if (!structure.product?.price) {
    return NextResponse.json({ error: 'Defina o preço do produto (Passo 2) antes de gerar a página.' }, { status: 400 })
  }

  const product = structure.product
  const dor = pain || structure.title

  const prompt = `Você é um copywriter sênior de páginas de vendas de infoprodutos no Brasil.

Gere a copy de uma landing page para este produto:
- Produto (e-book): "${product.name}"
- Nicho: "${structure.niche}"${structure.subNiche ? ` / "${structure.subNiche}"` : ''}
- Dor principal que resolve: "${dor}"
- Preço: R$ ${product.price!.toFixed(2).replace('.', ',')}

REGRAS DE HONESTIDADE (obrigatórias):
- Copy persuasiva mas honesta: foque nos benefícios reais do conteúdo do e-book.
- NÃO invente depoimentos, nomes de clientes, números de vendas ou resultados fabricados.
- NÃO prometa resultados garantidos nem prazos irreais.

Responda APENAS com JSON válido neste formato exato:
{
  "headline": "título principal forte, máx 90 caracteres, focado na transformação",
  "subheadline": "1-2 frases expandindo a promessa de forma concreta",
  "bullets": ["6 benefícios específicos do que a pessoa vai aprender/receber, começando com verbo"],
  "why_title": "título da seção que explica por que esse método funciona",
  "why_paragraphs": ["2-3 parágrafos explicando o mecanismo/lógica do método, sem depoimentos inventados"],
  "audience": ["4 frases 'Para você que...' descrevendo o público ideal"],
  "cta": "texto curto do botão de compra, máx 40 caracteres",
  "guarantee": "1 frase honesta de redução de risco (ex: acesso imediato após o pagamento)"
}`

  try {
    // Até 2 tentativas: se a IA devolver JSON quebrado/incompleto, gera de novo
    let copy: LandingCopy | null = null
    for (let attempt = 0; attempt < 2 && !copy; attempt++) {
      const raw = await geminiGenerate(prompt, { maxOutputTokens: 8192, temperature: 0.8, json: true })
      try {
        const parsed = parseJsonLoose<LandingCopy>(raw)
        if (parsed?.headline && Array.isArray(parsed?.bullets) && parsed.bullets.length > 0) {
          copy = parsed
        } else {
          console.error('Copy incompleta da IA (tentativa', attempt + 1, '):', raw.slice(0, 300))
        }
      } catch {
        console.error('Copy JSON inválido da IA (tentativa', attempt + 1, '):', raw.slice(0, 300))
      }
    }
    if (!copy) {
      return NextResponse.json({ error: 'A IA retornou um formato inesperado duas vezes seguidas. Tente gerar novamente.' }, { status: 502 })
    }

    const priceDisplay = `R$ ${product.price!.toFixed(2).replace('.', ',')}`

    let landing = structure.landingPage
    if (landing) {
      landing = await prisma.landingPage.update({
        where: { id: landing.id },
        data: {
          primaryColor,
          secondaryColor,
          headline: copy.headline.slice(0, 200),
          subheadline: (copy.subheadline ?? '').slice(0, 400),
          copyJson: JSON.stringify(copy),
          priceDisplay,
          // publishedAt não é mais definido: a página é hospedada pelo próprio
          // usuário (download ou 1 clique na Netlify dele), não no nosso Vercel
        },
      })
    } else {
      // Slug único: base no nome do produto + sufixo aleatório
      let slug = ''
      for (let i = 0; i < 5; i++) {
        const candidate = `${slugify(product.name) || 'produto'}-${Math.random().toString(36).slice(2, 7)}`
        const taken = await prisma.landingPage.findUnique({ where: { slug: candidate } })
        if (!taken) { slug = candidate; break }
      }
      if (!slug) return NextResponse.json({ error: 'Não foi possível gerar uma URL única. Tente novamente.' }, { status: 500 })

      landing = await prisma.landingPage.create({
        data: {
          structureId: structure.id,
          slug,
          primaryColor,
          secondaryColor,
          headline: copy.headline.slice(0, 200),
          subheadline: (copy.subheadline ?? '').slice(0, 400),
          copyJson: JSON.stringify(copy),
          priceDisplay,
        },
      })
    }

    if (structure.status === 'precificado' || structure.status === 'conteudo_gerado') {
      await prisma.structure.update({ where: { id: structure.id }, data: { status: 'landing_gerada' } })
    }

    return NextResponse.json({ landingPage: { slug: landing.slug, url: `/p/${landing.slug}` } })
  } catch (e: any) {
    console.error('Erro ao gerar landing page:', e)
    return NextResponse.json({ error: `Falha ao gerar a página: ${e?.message ?? 'erro na IA'}` }, { status: 502 })
  }
}
