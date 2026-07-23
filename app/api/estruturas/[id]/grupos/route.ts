export const dynamic = 'force-dynamic'
export const maxDuration = 30

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/session'
import { hasActiveAccess, NO_ACCESS_MSG } from '@/lib/plan'
import { prisma } from '@/lib/db'
import { geminiGenerate, parseJsonLoose } from '@/lib/gemini'
import { isRateLimited } from '@/lib/rate-limit'

const COUNTRY_LABELS: Record<string, string> = { BR: 'Brasil', PT: 'Portugal', US: 'Estados Unidos' }

// Passo 4 do wizard — descoberta de comunidades do nicho.
//
// IMPORTANTE (2026-07-23): a versão anterior usava
// "facebook.com/search/groups/?q=..." — testado direto e confirmado que dá
// 404 (a Facebook removeu essa URL de busca por tipo pra quem não está
// logado, se é que um dia funcionou assim). NÃO reintroduzir esse link sem
// testar de novo primeiro. Voltamos pro formato comprovadamente confiável:
// busca no Google (carrega sempre, sem exigir login, sem 404) restrita ao
// domínio certo — não é um resultado "perfeito" (o usuário ainda precisa
// escolher o grupo na lista de resultados), mas é um link que NUNCA quebra,
// o que importa mais do que um link "inteligente" que não abre.
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  if (!hasActiveAccess(user)) return NextResponse.json({ error: NO_ACCESS_MSG }, { status: 403 })

  if (isRateLimited(`grupos-gen:${user.id}`, 8, 60_000)) {
    return NextResponse.json({ error: 'Muitas buscas em pouco tempo. Aguarde um instante.' }, { status: 429 })
  }

  const body = await req.json().catch(() => ({}))
  const country = ['BR', 'PT', 'US'].includes(String(body?.country)) ? String(body.country) : 'BR'

  const structure = await prisma.structure.findFirst({ where: { id: params.id, userId: user.id } })
  if (!structure) return NextResponse.json({ error: 'Estrutura não encontrada' }, { status: 404 })

  const lang = country === 'US' ? 'inglês' : 'português'

  // Busca pelo nicho GRANDE ("Emagrecimento", "Finanças"...), não pela dor
  // específica ("secar barriga em casa com treinos curtos") — comunidades
  // reais existem e são achadas pelo tema amplo; uma dor tão específica quase
  // nunca tem grupo dedicado, e a busca só volta vazia.
  const prompt = `Liste palavras-chave AMPLAS para encontrar comunidades online (grupos de Facebook e WhatsApp) sobre o nicho "${structure.niche}", público de ${COUNTRY_LABELS[country]}, em ${lang}.

O foco do produto dentro desse nicho é "${structure.subNiche ?? structure.title}", mas isso é só contexto — NÃO gere palavras-chave restritas a essa dor específica, pois dificilmente existe grupo dedicado a algo tão nichado. Gere termos genéricos e populares do nicho amplo (ex: para o nicho "Emagrecimento", termos como "emagrecimento", "dieta e exercício", "vida saudável", "perder peso" — nunca algo como "secar barriga em casa com treinos curtos").

Responda APENAS com JSON válido:
{ "keywords": ["4 a 5 termos curtos e amplos que pessoas realmente usam para nomear grupos desse nicho"] }`

  try {
    const raw = await geminiGenerate(prompt, { fast: true, maxOutputTokens: 1024, temperature: 0.7, json: true })
    let keywords: string[] = []
    try {
      keywords = parseJsonLoose<{ keywords: string[] }>(raw)?.keywords ?? []
    } catch { /* cai no fallback abaixo */ }
    if (!keywords.length) keywords = [structure.niche] // fallback também amplo, nunca a dor específica
    keywords = keywords.filter(Boolean).slice(0, 5)

    // Regenerar substitui a lista anterior (mesmo país ou não — mantém a tela limpa)
    await prisma.outreachGroup.deleteMany({ where: { structureId: structure.id } })

    const rows = keywords.flatMap((kw) => [
      {
        structureId: structure.id,
        platform: 'facebook',
        groupName: `Grupos de Facebook sobre "${kw}"`,
        groupUrl: `https://www.google.com/search?q=${encodeURIComponent(`site:facebook.com/groups ${kw}`)}`,
        country,
      },
      {
        structureId: structure.id,
        platform: 'whatsapp',
        groupName: `Grupos de WhatsApp sobre "${kw}"`,
        groupUrl: `https://www.google.com/search?q=${encodeURIComponent(`inurl:chat.whatsapp.com grupo ${kw}`)}`,
        country,
      },
    ])

    const groups = rows.length ? await prisma.$transaction(rows.map((data) => prisma.outreachGroup.create({ data }))) : []

    return NextResponse.json({ groups })
  } catch (e: any) {
    console.error('Erro ao descobrir grupos:', e)
    return NextResponse.json({ error: `Falha ao buscar comunidades: ${e?.message ?? 'erro na IA'}` }, { status: 502 })
  }
}
