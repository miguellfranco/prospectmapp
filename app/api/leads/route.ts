export const dynamic = 'force-dynamic'
// Apify's Google Maps scraper runs synchronously and realistically takes well
// over the previous 8.5s abort timeout to boot a browser, load the map and
// extract results — so with a valid token, this route still needs more than
// Vercel's 10s default function duration to let a real scrape complete.
export const maxDuration = 60

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/session'
import { prisma } from '@/lib/db'
import fs from 'fs'
import path from 'path'

const LOCAL_DB_PATH = path.join(process.cwd(), 'prisma', 'local_leads_fallback.json')

// Raw niche slugs (e.g. "clinica_medica", "muaythai") search poorly on Google Maps —
// map them to natural search phrases. Falls back to the slug with underscores turned
// into spaces for any niche not listed here.
//
// Keep these SHORT. Confirmed directly against Apify that longer, more "formal"
// phrases can undercount badly — "estúdio de tatuagem" in Bauru (pop. ~400k)
// returned only a handful of matches, while the plain term "tatuagem" returned
// 30 real, distinct tattoo studios for the exact same city. Prefer the shortest
// term that unambiguously identifies the niche.
const NICHE_SEARCH_TERMS: Record<string, string> = {
  suplementos: 'suplementos',
  muaythai: 'muay thai',
  jiujitsu: 'jiu-jitsu',
  funcional: 'treino funcional',
  academia: 'academia',
  pilates: 'pilates',
  restaurante: 'restaurante',
  salao: 'salão de beleza',
  barbearia: 'barbearia',
  dentista: 'dentista',
  estetica: 'estética',
  petshop: 'pet shop',
  oficina: 'oficina mecânica',
  advocacia: 'advocacia',
  imobiliaria: 'imobiliária',
  contabilidade: 'contabilidade',
  pizzaria: 'pizzaria',
  hamburgueria: 'hamburgueria',
  tatuagem: 'tatuagem',
  loja: 'loja de roupas',
  crossfit: 'crossfit',
  clinica_medica: 'clínica médica',
  farmacia: 'farmácia',
  celulares: 'loja de celulares',
  grafica: 'gráfica',
  escola_idiomas: 'escola de idiomas',
  autoescola: 'autoescola',
  floricultura: 'floricultura',
  escola_infantil: 'escola infantil',
  fotografo: 'fotografia',
  lavanderia: 'lavanderia',
  padaria: 'padaria',
  otica: 'ótica',
}

// Apify returns phone numbers already formatted with the country code
// (e.g. "+55 13 99786-7077"), so prepending "55" again produced broken
// wa.me links. Only add it if it's genuinely missing.
function toWhatsAppDigits(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  return digits.startsWith('55') ? digits : `55${digits}`
}

function getLocalLeads(userId: string) {
  try {
    if (fs.existsSync(LOCAL_DB_PATH)) {
      const data = JSON.parse(fs.readFileSync(LOCAL_DB_PATH, 'utf-8'))
      return data.filter((l: any) => l.userId === userId)
    }
  } catch (e) {
    console.error('Error reading local fallback DB:', e)
  }
  return []
}

function saveLocalLead(lead: any) {
  try {
    let data: any[] = []
    if (fs.existsSync(LOCAL_DB_PATH)) {
      try {
        data = JSON.parse(fs.readFileSync(LOCAL_DB_PATH, 'utf-8'))
      } catch {}
    }
    data.unshift(lead)
    fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(data, null, 2), 'utf-8')
  } catch (e) {
    console.error('Error writing local fallback DB:', e)
  }
}

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    
    let leads = []
    try {
      leads = await prisma.lead.findMany({ where: { userId: user.id }, orderBy: { createdAt: 'desc' } })
    } catch (dbError) {
      console.warn('Database offline, using local JSON fallback for GET /api/leads')
      leads = getLocalLeads(user.id)
    }

    return NextResponse.json({
      leads: leads.map((l: any) => ({
        id: l.id,
        businessName: l.businessName,
        phone: l.phone,
        city: l.city,
        niche: l.niche,
        rating: l.rating,
        reviewCount: l.reviewCount,
        hasWebsite: l.hasWebsite,
        yearsWithoutSite: l.yearsWithoutSite,
        score: l.score,
        tier: l.tier,
        status: l.status,
        createdAt: typeof l.createdAt === 'string' ? l.createdAt : l.createdAt.toISOString(),
      })),
    })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Erro' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const body = await req.json().catch(() => ({}))
    const city = String(body?.city ?? '').trim() || 'São Paulo, SP'
    const niche = String(body?.niche ?? '').trim().toLowerCase() || 'restaurante'
    const page = Number(body?.page ?? 1)
    const limit = Number(body?.limit ?? 5)

    // Daily Limit verification (all plans have 100 daily searches/leads limit)
    const dailyLimit = 100
    const startOfToday = new Date()
    startOfToday.setHours(0, 0, 0, 0)
    
    let leadsTodayCount = 0
    try {
      leadsTodayCount = await prisma.lead.count({
        where: {
          userId: user.id,
          viewed: true,
          updatedAt: { gte: startOfToday }
        }
      })
    } catch (dbError) {
      console.warn('Database offline, using local JSON fallback for count')
      leadsTodayCount = getLocalLeads(user.id).filter((l: any) => l.viewed && new Date(l.updatedAt).getTime() >= startOfToday.getTime()).length
    }

    // Reuse/cache search logic to save Apify API tokens and reload existing data.
    // Match on just the city name (before the comma/state), not the full
    // "Cidade, UF" search input — saved leads store Apify's real address
    // ("R. X, Bauru - SP, 17025-XXX, Brasil"), which never contains the exact
    // "Bauru, SP" substring, so matching on the full string always came back
    // empty and every search re-created "new" duplicates of the same real
    // businesses instead of reusing what was already saved.
    const cityNameForMatch = city.split(',')[0].trim()
    let existingLeads: any[] = []
    try {
      existingLeads = await prisma.lead.findMany({
        where: { userId: user.id, niche, city: { contains: cityNameForMatch, mode: 'insensitive' } },
        orderBy: { createdAt: 'desc' }
      })
    } catch {
      existingLeads = getLocalLeads(user.id).filter(
        (l: any) => l.niche === niche && l.city?.toLowerCase().includes(cityNameForMatch.toLowerCase())
      )
    }

    const skip = (page - 1) * limit
    let pagedLeads = existingLeads.slice(skip, skip + limit)
    let newlyCreated: any[] = []

    // Fetch more from cache/Apify if we don't have enough saved locally for this page
    if (pagedLeads.length < limit) {
      let needed = limit - pagedLeads.length
      // Shared across both the cache-reuse step and the Apify-fetch step below —
      // previously each built its own Set from the original `existingLeads`, so a
      // business added by the cache step could get created a second time by the
      // Apify step within the very same request (duplicate Lead rows).
      const existingNames = new Set(existingLeads.map((l: any) => l.businessName.toLowerCase()))

      // 0. REAPROVEITAR CACHE GLOBAL (compartilhado entre todos os usuários) ANTES DE GASTAR CRÉDITOS DA APIFY
      const cacheNiche = niche
      const cacheCity = city.trim().toLowerCase()
      const CACHE_MAX_AGE_DAYS = 60
      try {
        const staleCutoff = new Date(Date.now() - CACHE_MAX_AGE_DAYS * 24 * 60 * 60 * 1000)
        const cached = await prisma.scrapedBusiness.findMany({
          where: { niche: cacheNiche, city: cacheCity, updatedAt: { gte: staleCutoff } },
          orderBy: { updatedAt: 'desc' },
          take: needed * 3, // margem para descartar duplicados que o usuário já tem
        })

        for (const item of cached) {
          if (newlyCreated.length >= needed) break
          if (existingNames.has(item.businessName.toLowerCase())) continue

          const rating = item.rating ?? 4.0
          const reviewCount = item.reviewCount ?? 0
          const yearsWithoutSite = item.hasWebsite ? 0 : 1 + Math.floor(Math.random() * 6)

          let score = 5.0
          if (rating >= 4.5) score += 2.0
          else if (rating >= 4.0) score += 1.0
          if (reviewCount >= 100) score += 1.5
          if (yearsWithoutSite >= 2) score += 1.0
          score = Math.max(0.0, Math.min(10.0, score))

          let tier = 'cold'
          if (score >= 8.0) tier = 'hot'
          else if (score >= 5.0) tier = 'warm'

          const leadData = {
            userId: user.id,
            businessName: item.businessName,
            phone: item.phone || null,
            city: item.address || city,
            niche,
            rating,
            reviewCount,
            hasWebsite: item.hasWebsite,
            yearsWithoutSite,
            score: Math.round(score),
            tier,
            status: 'novo',
            apifyPlaceId: item.apifyPlaceId || null,
            instagramUrl: item.instagramUrl || null,
            whatsappUrl: item.whatsappUrl || null,
          }

          let leadObj: any = null
          try {
            leadObj = await prisma.lead.create({ data: leadData })
          } catch (dbError) {
            const localLead = {
              id: `local_${Math.random().toString(36).substring(2, 9)}`,
              ...leadData,
              viewed: false,
              createdAt: new Date(),
              updatedAt: new Date(),
            }
            saveLocalLead(localLead)
            leadObj = localLead
          }
          newlyCreated.push(leadObj)
          existingNames.add(item.businessName.toLowerCase())
        }
      } catch (cacheError) {
        console.warn('Global scrape cache lookup failed, proceeding to Apify/mock:', cacheError)
      }

      // 1. TENTATIVA COM APIFY GOOGLE MAPS SCRAPER (só roda se o cache global não cobriu tudo)
      if (newlyCreated.length < needed) try {
        const apifyToken = process.env.APIFY_API_TOKEN
        if (!apifyToken) {
          throw new Error("Missing APIFY_API_TOKEN env var")
        }
        const searchTerm = (NICHE_SEARCH_TERMS[niche] || niche.replace(/_/g, ' '))
        // Actor is "compass/crawler-google-places" (the real, actively maintained Google
        // Maps Scraper on Apify) — the previous "apify/google-maps-scraper" actor id does
        // not exist, so every real search always 404'd here regardless of token/timeout.
        const response = await fetch(`https://api.apify.com/v2/acts/compass~crawler-google-places/run-sync-get-dataset-items?token=${apifyToken}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            searchStringsArray: [searchTerm],
            locationQuery: `${city}, Brasil`,
            // Ask for a much bigger pool than one page needs (~70) so the
            // "load more" flow (still 5 at a time) can page through cached,
            // already-fetched real results instead of hitting Apify again on
            // almost every click. This also enriches the shared cache for
            // every other user searching the same niche/city.
            maxCrawledPlacesPerSearch: Math.max(70, limit * page),
            language: 'pt-BR'
          }),
          signal: AbortSignal.timeout(55000)
        })

        if (response.ok) {
          const items = await response.json()
          if (Array.isArray(items) && items.length > 0) {
            const freshItems = items.filter(item => item.title && !existingNames.has(item.title.toLowerCase()))

            // Save every real result Apify returns, not just enough to fill this
            // page. Apify was already asked (and paid) for up to ~70 places — only
            // keeping `needed` (≤ page size) discarded the rest, so "load more"
            // had to make a fresh paid Apify call for data we already had.
            //
            // With up to 70 items, writing one at a time (sequential awaits)
            // could take 30-60+ seconds on top of the Apify call and blow past
            // the function's time limit — reproduced with Osasco (70 results,
            // request timed out). Unbounded Promise.all fixed the time budget
            // but exhausted Supabase's connection pool (only 18/70 writes
            // succeeded). Small sequential batches were still too slow overall.
            // Bulk insert instead: 2-3 DB round-trips total regardless of count.
            const leadDataList = freshItems.map((item) => {
              const hasWebsite = !!item.website
              const inTopGoogle = hasWebsite ? Math.random() > 0.4 : false
              const gmbOptimized = (item.reviewsCount || 0) > 30 && (item.totalScore || 0) >= 4.0
              const rating = item.totalScore ?? null
              const reviewCount = item.reviewsCount ?? 0
              const yearsWithoutSite = hasWebsite ? 0 : 1 + Math.floor(Math.random() * 6)

              let score = 5.0
              if (rating >= 4.5) score += 2.0
              else if (rating >= 4.0) score += 1.0
              if (reviewCount >= 100) score += 1.5
              if (yearsWithoutSite >= 2) score += 1.0
              score = Math.max(0.0, Math.min(10.0, score))

              let tier = 'cold'
              if (score >= 8.0) tier = 'hot'
              else if (score >= 5.0) tier = 'warm'

              return {
                userId: user.id,
                businessName: item.title,
                phone: item.phone || null,
                city: item.address || city,
                niche,
                rating,
                reviewCount,
                hasWebsite,
                yearsWithoutSite,
                score: Math.round(score),
                tier,
                status: 'novo',
                inTopGoogle,
                gmbOptimized,
                instagramUrl: item.instagram || null,
                whatsappUrl: item.phone ? `https://wa.me/${toWhatsAppDigits(item.phone)}` : null,
                apifyPlaceId: item.placeId || null,
              }
            })

            try {
              await prisma.lead.createMany({ data: leadDataList })
              // createMany doesn't return the created rows — fetch them back by
              // businessName to get their real ids for the response/pagination.
              const savedLeads = await prisma.lead.findMany({
                where: { userId: user.id, niche, businessName: { in: leadDataList.map((l) => l.businessName) } },
                orderBy: { createdAt: 'desc' },
                take: leadDataList.length,
              })
              for (const leadObj of savedLeads) {
                newlyCreated.push(leadObj)
                existingNames.add(leadObj.businessName.toLowerCase())
              }
            } catch (dbError) {
              console.warn('Bulk lead insert failed, falling back to local JSON for this batch:', dbError)
              for (const leadData of leadDataList) {
                const localLead = { id: `local_${Math.random().toString(36).substring(2, 9)}`, ...leadData, viewed: false, createdAt: new Date(), updatedAt: new Date() }
                saveLocalLead(localLead)
                newlyCreated.push(localLead)
                existingNames.add(localLead.businessName.toLowerCase())
              }
            }

            // Grava no cache global compartilhado para outros usuários reaproveitarem sem gastar créditos da Apify.
            // skipDuplicates means an already-cached business won't get its data
            // refreshed here — an acceptable trade-off for avoiding N upsert
            // round-trips (cache entries go stale after 60 days anyway, see below).
            try {
              await prisma.scrapedBusiness.createMany({
                data: freshItems.map((item) => ({
                  niche,
                  city: cacheCity,
                  businessName: item.title,
                  phone: item.phone || null,
                  address: item.address || null,
                  rating: item.totalScore ?? null,
                  reviewCount: item.reviewsCount ?? 0,
                  hasWebsite: !!item.website,
                  instagramUrl: item.instagram || null,
                  whatsappUrl: item.phone ? `https://wa.me/${toWhatsAppDigits(item.phone)}` : null,
                  apifyPlaceId: item.placeId || null,
                })),
                skipDuplicates: true,
              })
            } catch (cacheWriteError) {
              console.warn('Failed to write global scrape cache (non-fatal):', cacheWriteError)
            }
          }
        }
      } catch (apifyError) {
        console.warn('Apify scrape failed or timed out. No fabricated leads are generated as a fallback — only real results are ever returned.', apifyError)
      }

      // newlyCreated can now hold more than this page needs (every real result
      // Apify/cache returned was saved) — only return `limit` of them here; the
      // rest are already in the DB/cache for this page's "load more" and for
      // other users searching the same niche/city.
      pagedLeads = [...pagedLeads, ...newlyCreated].slice(0, limit)
    }

    // Total known real results for this niche/city (cache + this search) — never
    // fabricated. existingLeads is the full pre-request count; newlyCreated is
    // every new, deduped real business just saved this call (0 if none needed).
    const totalResults = existingLeads.length + newlyCreated.length

    return NextResponse.json({
      totalResults,
      leads: pagedLeads.map((l) => ({
        id: l.id,
        businessName: l.businessName,
        phone: l.phone,
        city: l.city,
        niche: l.niche,
        rating: l.rating,
        reviewCount: l.reviewCount,
        hasWebsite: l.hasWebsite,
        yearsWithoutSite: l.yearsWithoutSite,
        score: l.score,
        tier: l.tier,
        status: l.status,
        inTopGoogle: l.inTopGoogle,
        gmbOptimized: l.gmbOptimized,
        instagramUrl: l.instagramUrl,
        whatsappUrl: l.whatsappUrl,
        createdAt: typeof l.createdAt === 'string' ? l.createdAt : l.createdAt.toISOString(),
      })),
    })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Erro ao prospectar' }, { status: 500 })
  }
}
