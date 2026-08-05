export const dynamic = 'force-dynamic'
export const maxDuration = 30

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/session'
import { hasActiveAccess, NO_ACCESS_MSG } from '@/lib/plan'
import { prisma } from '@/lib/db'
import { geminiGenerate, parseJsonLoose } from '@/lib/gemini'
import { isRateLimited } from '@/lib/rate-limit'
import { whatsappDirectoryUrl } from '@/lib/whatsapp-directory'

const COUNTRY_LABELS: Record<string, string> = { BR: 'Brasil', PT: 'Portugal', US: 'Estados Unidos' }

// Passo 4 do wizard — descoberta de comunidades do nicho.
//
// IMPORTANTE (retestado em 2026-08-05, dessa vez com headers de navegador de
// verdade pra isolar bot-block de 404 real): "facebook.com/search/groups/?q=..."
// continua dando 404 pra quem NÃO está logado no Facebook (testado via curl
// com headers completos — a home carrega 200 normal, só esse path específico
// 404). Ou seja, não é bloqueio genérico de bot — é a própria Facebook que
// exige sessão logada pra essa busca. Como não dá pra saber de antemão se
// quem vai clicar está logado, NÃO usamos isso como único link (quebraria
// pra quem não estiver logado, sem aviso) — mas oferecemos como opção EXTRA,
// além do link de busca no Google que SEMPRE abre (esse continua sendo o
// principal/confiável). NÃO trocar o link do Google pelo direto sem testar
// nada disso de novo primeiro.
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

    // A pedido do usuário (2026-08-05): priorizar os links diretos do
    // Facebook (1 por palavra-chave — maioria da lista) e deixar o Google só
    // como reserva única (1 só, pelo nicho amplo) — antes era o contrário.
    // O direto só funciona pra quem já está logado no Facebook nesse
    // navegador (ver nota no topo do arquivo); se der "not found", a pessoa
    // usa a linha via Google, que sempre abre.
    const facebookRows = keywords.map((kw) => ({
      structureId: structure.id,
      platform: 'facebook',
      groupName: `Grupos de Facebook sobre "${kw}"`,
      groupUrl: `https://www.facebook.com/search/groups/?q=${encodeURIComponent(kw)}`,
      country,
    }))

    const facebookDirectRow = {
      structureId: structure.id,
      platform: 'facebook',
      groupName: `Busca no Google (reserva, se o link acima der "not found") — ${structure.niche}`,
      groupUrl: `https://www.google.com/search?q=${encodeURIComponent(`site:facebook.com/groups ${structure.niche}`)}`,
      country,
    }

    // gruposwhats.app é um diretório real de convites de WhatsApp (indicado
    // pelo usuário, slugs conferidos direto no sitemap oficial do site — ver
    // lib/whatsapp-directory.ts). Nichos com categoria real lá ganham 1 link
    // direto e confiável em vez de N buscas fracas no Google; nichos sem
    // categoria correspondente caem no fallback de busca de sempre.
    const directoryUrl = whatsappDirectoryUrl(structure.niche)
    const whatsappRows = directoryUrl
      ? [{
          structureId: structure.id,
          platform: 'whatsapp',
          groupName: `Diretório de grupos de WhatsApp — ${structure.niche}`,
          groupUrl: directoryUrl,
          country,
        }]
      : keywords.map((kw) => ({
          structureId: structure.id,
          platform: 'whatsapp',
          groupName: `Grupos de WhatsApp sobre "${kw}"`,
          groupUrl: `https://www.google.com/search?q=${encodeURIComponent(`inurl:chat.whatsapp.com grupo ${kw}`)}`,
          country,
        }))

    const rows = [...facebookRows, facebookDirectRow, ...whatsappRows]

    const groups = rows.length ? await prisma.$transaction(rows.map((data) => prisma.outreachGroup.create({ data }))) : []

    return NextResponse.json({ groups })
  } catch (e: any) {
    console.error('Erro ao descobrir grupos:', e)
    return NextResponse.json({ error: `Falha ao buscar comunidades: ${e?.message ?? 'erro na IA'}` }, { status: 502 })
  }
}
