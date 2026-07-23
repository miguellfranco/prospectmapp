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

type QueryPlan = { platform: 'facebook' | 'whatsapp'; kw: string; term: string; strict: 'facebook-group' | 'whatsapp-invite' | null }

// Só aceita como "resultado real" uma URL que É a página do grupo em si —
// descarta post/foto/evento/about dentro do grupo, que apareciam nos testes
// como resultado de "site:facebook.com/groups" mas não são o grupo (são
// conteúdo de dentro dele, não dá pra "entrar no grupo" por ali).
function isRealFacebookGroupUrl(url: string): boolean {
  try {
    const u = new URL(url)
    if (!/(^|\.)facebook\.com$/i.test(u.hostname)) return false
    return /^\/groups\/[^/]+\/?$/.test(u.pathname)
  } catch {
    return false
  }
}

// Só aceita um link de convite de WhatsApp de verdade (chat.whatsapp.com/CODIGO) —
// descarta qualquer outra coisa que a busca tenha trazido por engano.
function isRealWhatsappInviteUrl(url: string): boolean {
  try {
    const u = new URL(url)
    return u.hostname === 'chat.whatsapp.com' && /^\/[A-Za-z0-9]+\/?$/.test(u.pathname)
  } catch {
    return false
  }
}

function buildQueries(keywords: string[]): QueryPlan[] {
  const queries: QueryPlan[] = []
  for (const kw of keywords) {
    // site:facebook.com/groups ainda é a única busca no Google que tem chance
    // de achar a página do GRUPO em si (não um post/página/vídeo qualquer que
    // apenas cite o termo) — por isso é a única mantida para Facebook, e o
    // resultado passa por isRealFacebookGroupUrl antes de contar como real.
    // Testes anteriores com intext:/linguagem natural traziam posts, páginas
    // de empresa e vídeos — removidos por trazerem só ruído.
    queries.push({ platform: 'facebook', kw, term: `site:facebook.com/groups ${kw}`, strict: 'facebook-group' })
    // "chat.whatsapp.com" entre aspas como frase de texto raramente aparece na
    // página (o link fica só na URL) — por isso a busca antiga quase nunca
    // trazia resultado. inurl: casa com o próprio endereço do convite.
    queries.push({ platform: 'whatsapp', kw, term: `inurl:chat.whatsapp.com grupo ${kw}`, strict: 'whatsapp-invite' })
    // Diretórios/posts de "lista de grupos" continuam válidos mesmo não sendo
    // um convite direto — por isso essa variante não passa pelo filtro estrito.
    queries.push({ platform: 'whatsapp', kw, term: `"grupos de whatsapp" ${kw} entrar lista`, strict: null })
  }
  return queries
}

function fallbackUrl(q: QueryPlan): string {
  if (q.platform === 'facebook') {
    // Busca nativa do próprio Facebook filtrada por "grupos" — sempre mostra
    // grupos de verdade (nunca posts/páginas/vídeos soltos), diferente de uma
    // busca genérica no Google que o Facebook não deixa mais indexar direito.
    return `https://www.facebook.com/search/groups/?q=${encodeURIComponent(q.kw)}`
  }
  return `https://www.google.com/search?q=${encodeURIComponent(q.term)}`
}

// Passo 4 do wizard — descoberta de comunidades do nicho.
//
// Abordagem honesta: não fazemos scraping do Facebook/WhatsApp (viola os
// termos dessas plataformas e não retorna dados confiáveis). Em vez disso, a
// IA gera palavras-chave certeiras do nicho e rodamos buscas reais no Google
// (via Apify) para cada uma — cada resultado salvo passa por um filtro de URL
// que garante que é a página do GRUPO em si (nunca um post/página/vídeo
// avulso), nunca inventado. Se uma busca específica não passar no filtro,
// caímos para um link de busca (marcado isFallbackLink, mostrado diferente na
// tela): busca nativa "grupos" do próprio Facebook, ou busca no Google para
// WhatsApp — nunca deixamos a lista vazia, mas também nunca fingimos que um
// resultado ruim é um grupo de verdade.
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

    const queries = buildQueries(keywords)

    // Resultados reais por busca: query -> lista de {title, url}, já filtrados
    // pelo isReal*Url quando a busca é "strict". Preenchido via Apify quando
    // disponível; queries que não vierem aqui (token ausente/inválido, erro,
    // timeout, ou zero resultados aprovados no filtro) caem no link de busca.
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
              const q = queries.find((x) => x.term === term)
              const organic = Array.isArray(item?.organicResults) ? item.organicResults : []
              const validator = q?.strict === 'facebook-group' ? isRealFacebookGroupUrl
                : q?.strict === 'whatsapp-invite' ? isRealWhatsappInviteUrl
                : null
              const filtered = organic.filter((r: any) => r?.url && r?.title && (!validator || validator(r.url)))
              resultsByTerm.set(term, filtered.slice(0, 3).map((r: any) => ({ title: r.title, url: r.url })))
            }
          }
        } else {
          console.error('Apify google-search-scraper falhou:', response.status, await response.text().catch(() => ''))
        }
      } catch (apifyError) {
        console.error('Erro ao chamar Apify google-search-scraper:', apifyError)
      }
    } else {
      console.error('APIFY_API_TOKEN ausente — descoberta de grupos vai cair 100% no link de busca manual.')
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
        // nenhum resultado aprovado no filtro para esta busca — link de busca como último recurso
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

    // Prioriza resultado real (já filtrado) sobre link de busca manual e corta
    // em 10 por plataforma pra manter a lista útil.
    const capped: typeof rows = []
    for (const platform of ['facebook', 'whatsapp'] as const) {
      const forPlatform = rows
        .filter((r) => r.platform === platform)
        .sort((a, b) => Number(a.isFallbackLink) - Number(b.isFallbackLink))
        .slice(0, 10)
      capped.push(...forPlatform)
    }

    const groups = capped.length ? await prisma.$transaction(capped.map((data) => prisma.outreachGroup.create({ data }))) : []

    return NextResponse.json({ groups })
  } catch (e: any) {
    console.error('Erro ao descobrir grupos:', e)
    return NextResponse.json({ error: `Falha ao buscar comunidades: ${e?.message ?? 'erro na IA'}` }, { status: 502 })
  }
}
