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
// Abordagem honesta: não fazemos scraping do Facebook/WhatsApp (viola os
// termos dessas plataformas e não retorna dados confiáveis). Em vez disso, a
// IA gera palavras-chave certeiras do nicho e montamos links de busca oficiais
// das próprias plataformas — o usuário abre, escolhe os grupos reais e entra.
// Por isso memberCount fica null: não inventamos número de membros.
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

  const prompt = `Liste palavras-chave para encontrar comunidades online (grupos de Facebook e WhatsApp) sobre o nicho "${structure.niche}"${structure.subNiche ? ` / "${structure.subNiche}"` : ''}, público de ${COUNTRY_LABELS[country]}, em ${lang}.

Responda APENAS com JSON válido:
{ "keywords": ["6 a 8 termos curtos de busca que pessoas usam para nomear grupos desse nicho"] }`

  try {
    const raw = await geminiGenerate(prompt, { fast: true, maxOutputTokens: 1024, temperature: 0.7, json: true })
    let keywords: string[] = []
    try {
      keywords = parseJsonLoose<{ keywords: string[] }>(raw)?.keywords ?? []
    } catch { /* cai no fallback abaixo */ }
    if (!keywords.length) keywords = [structure.niche, structure.subNiche ?? structure.title]
    keywords = keywords.filter(Boolean).slice(0, 8)

    // Regenerar substitui a lista anterior (mesmo país ou não — mantém a tela limpa)
    await prisma.outreachGroup.deleteMany({ where: { structureId: structure.id } })

    const groups = await prisma.$transaction(
      keywords.flatMap((kw) => {
        const q = encodeURIComponent(kw)
        return [
          prisma.outreachGroup.create({
            data: {
              structureId: structure.id,
              platform: 'facebook',
              groupName: `Grupos de Facebook: "${kw}"`,
              groupUrl: `https://www.facebook.com/search/groups/?q=${q}`,
              country,
            },
          }),
          prisma.outreachGroup.create({
            data: {
              structureId: structure.id,
              platform: 'whatsapp',
              groupName: `Grupos de WhatsApp: "${kw}"`,
              groupUrl: `https://www.google.com/search?q=${encodeURIComponent(`"chat.whatsapp.com" ${kw}`)}`,
              country,
            },
          }),
        ]
      })
    )

    return NextResponse.json({ groups })
  } catch (e: any) {
    console.error('Erro ao descobrir grupos:', e)
    return NextResponse.json({ error: `Falha ao buscar comunidades: ${e?.message ?? 'erro na IA'}` }, { status: 502 })
  }
}
