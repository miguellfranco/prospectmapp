export const dynamic = 'force-dynamic'
export const maxDuration = 60

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/session'
import { hasActiveAccess, NO_ACCESS_MSG } from '@/lib/plan'
import { prisma } from '@/lib/db'
import { geminiGenerate, parseJsonLoose } from '@/lib/gemini'
import { isRateLimited } from '@/lib/rate-limit'

const COUNTRY_LABELS: Record<string, string> = { BR: 'Brasil', PT: 'Portugal', US: 'Estados Unidos' }
const COUNTRY_CODES: Record<string, string> = { BR: 'br', PT: 'pt', US: 'us' }
const LANG_CODES: Record<string, string> = { BR: 'pt-BR', PT: 'pt-PT', US: 'en' }

type QueryPlan = { platform: 'facebook' | 'whatsapp'; kw: string; term: string }

function buildQueries(keywords: string[]): QueryPlan[] {
  const queries: QueryPlan[] = []
  for (const kw of keywords) {
    queries.push({ platform: 'facebook', kw, term: `site:facebook.com/groups ${kw}` })
    // "chat.whatsapp.com" entre aspas como frase de texto raramente aparece na
    // página (o link fica só na URL) — por isso a busca antiga quase nunca
    // trazia resultado. inurl: casa com o próprio endereço do convite, que É
    // indexado; a segunda variante pega páginas/diretórios que listam vários
    // convites reais de uma vez (mais fácil de o Google indexar que o convite avulso).
    queries.push({ platform: 'whatsapp', kw, term: `inurl:chat.whatsapp.com grupo ${kw}` })
    queries.push({ platform: 'whatsapp', kw, term: `"grupos de whatsapp" ${kw} entrar lista` })
  }
  return queries
}

function fallbackUrl(q: QueryPlan) {
  return `https://www.google.com/search?q=${encodeURIComponent(q.term)}`
}

// Passo 4 do wizard — descoberta de comunidades do nicho.
//
// Abordagem honesta: não fazemos scraping do Facebook/WhatsApp (viola os
// termos dessas plataformas e não retorna dados confiáveis). Em vez disso, a
// IA gera palavras-chave certeiras do nicho e rodamos buscas reais no Google
// (via Apify) para cada uma — cada resultado salvo é uma página real que a
// busca retornou (grupo, convite ou diretório de convites), nunca inventada.
// Se uma busca específica não trouxer nenhum resultado, caímos para um link
// de busca manual só para aquele caso (marcado isFallbackLink, mostrado
// diferente na tela) em vez de deixar a lista vazia.
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
{ "keywords": ["4 a 5 termos curtos de busca que pessoas usam para nomear grupos desse nicho"] }`

  try {
    const raw = await geminiGenerate(prompt, { fast: true, maxOutputTokens: 1024, temperature: 0.7, json: true })
    let keywords: string[] = []
    try {
      keywords = parseJsonLoose<{ keywords: string[] }>(raw)?.keywords ?? []
    } catch { /* cai no fallback abaixo */ }
    if (!keywords.length) keywords = [structure.niche, structure.subNiche ?? structure.title]
    keywords = keywords.filter(Boolean).slice(0, 5)

    const queries = buildQueries(keywords)

    // Resultados reais por busca: query -> lista de {title, url}. Preenchido
    // via Apify quando disponível; queries que não vierem aqui (token ausente,
    // erro, ou zero resultados) caem no fallback de link manual.
    const resultsByTerm = new Map<string, { title: string; url: string }[]>()

    const apifyToken = process.env.APIFY_API_TOKEN
    if (apifyToken) {
      try {
        const response = await fetch(`https://api.apify.com/v2/acts/apify~google-search-scraper/run-sync-get-dataset-items?token=${apifyToken}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            queries: queries.map((q) => q.term).join('\n'),
            maxPagesPerQuery: 1,
            resultsPerPage: 10,
            countryCode: COUNTRY_CODES[country],
            languageCode: LANG_CODES[country],
            mobileResults: false,
          }),
          signal: AbortSignal.timeout(55000),
        })

        if (response.ok) {
          const items = await response.json()
          if (Array.isArray(items)) {
            for (const item of items) {
              const term = item?.searchQuery?.term
              if (!term) continue
              const organic = Array.isArray(item?.organicResults) ? item.organicResults : []
              resultsByTerm.set(
                term,
                organic
                  .filter((r: any) => r?.url && r?.title)
                  .slice(0, 3)
                  .map((r: any) => ({ title: r.title, url: r.url }))
              )
            }
          }
        } else {
          console.error('Apify google-search-scraper falhou:', response.status, await response.text().catch(() => ''))
        }
      } catch (apifyError) {
        console.error('Erro ao chamar Apify google-search-scraper:', apifyError)
      }
    }

    // Regenerar substitui a lista anterior (mesmo país ou não — mantém a tela limpa)
    await prisma.outreachGroup.deleteMany({ where: { structureId: structure.id } })

    const seenUrls = new Set<string>()
    const rows: { structureId: string; platform: string; groupName: string; groupUrl: string; country: string; isFallbackLink: boolean }[] = []

    for (const q of queries) {
      const found = resultsByTerm.get(q.term) ?? []
      const fresh = found.filter((r) => !seenUrls.has(r.url))
      if (fresh.length > 0) {
        for (const r of fresh) {
          seenUrls.add(r.url)
          rows.push({
            structureId: structure.id,
            platform: q.platform,
            groupName: r.title.slice(0, 200),
            groupUrl: r.url,
            country,
            isFallbackLink: false,
          })
        }
      } else {
        // nenhum resultado real para esta busca — link manual como último recurso
        const url = fallbackUrl(q)
        if (!seenUrls.has(url)) {
          seenUrls.add(url)
          rows.push({
            structureId: structure.id,
            platform: q.platform,
            groupName: q.platform === 'facebook' ? `Buscar grupos de Facebook sobre "${q.kw}"` : `Buscar grupos de WhatsApp sobre "${q.kw}"`,
            groupUrl: url,
            country,
            isFallbackLink: true,
          })
        }
      }
    }

    const groups = rows.length ? await prisma.$transaction(rows.map((data) => prisma.outreachGroup.create({ data }))) : []

    return NextResponse.json({ groups })
  } catch (e: any) {
    console.error('Erro ao descobrir grupos:', e)
    return NextResponse.json({ error: `Falha ao buscar comunidades: ${e?.message ?? 'erro na IA'}` }, { status: 502 })
  }
}
