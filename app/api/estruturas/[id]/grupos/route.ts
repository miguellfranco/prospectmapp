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
// Abordagem honesta e sem depender de nenhuma API paga/terceira: para
// Facebook, o link vai direto pra busca NATIVA de grupos do próprio Facebook
// (facebook.com/search/groups/?q=...) já com o termo do nicho preenchido —
// mesma lógica usada por concorrentes (clica e cai numa busca dentro do
// Facebook já filtrada por "grupos", em vez de uma busca genérica no Google,
// que o Facebook não deixa mais indexar direito desde 2018). WhatsApp não tem
// um "buscador de grupos" nativo equivalente, então usamos uma busca do
// Google já otimizada (inurl:chat.whatsapp.com casa com o próprio endereço do
// convite, que é o que de fato aparece indexado). Nenhum resultado é
// pré-buscado/inventado — cada link leva a uma busca real que o próprio
// usuário navega e escolhe os grupos que quiser entrar.
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
        groupUrl: `https://www.facebook.com/search/groups/?q=${encodeURIComponent(kw)}`,
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
