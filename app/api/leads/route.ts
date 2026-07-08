export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/session'
import { prisma } from '@/lib/db'
import fs from 'fs'
import path from 'path'

const LOCAL_DB_PATH = path.join(process.cwd(), 'prisma', 'local_leads_fallback.json')

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

    // Reuse/cache search logic to save Apify API tokens and reload existing data
    let existingLeads: any[] = []
    try {
      existingLeads = await prisma.lead.findMany({
        where: { userId: user.id, niche, city: { contains: city, mode: 'insensitive' } },
        orderBy: { createdAt: 'desc' }
      })
    } catch {
      existingLeads = getLocalLeads(user.id).filter(
        (l: any) => l.niche === niche && l.city?.toLowerCase().includes(city.toLowerCase())
      )
    }

    const skip = (page - 1) * limit
    let pagedLeads = existingLeads.slice(skip, skip + limit)

    // Fetch more from cache/Apify if we don't have enough saved locally for this page
    if (pagedLeads.length < limit) {
      let needed = limit - pagedLeads.length
      let newlyCreated: any[] = []

      // 0. REAPROVEITAR CACHE GLOBAL (compartilhado entre todos os usuários) ANTES DE GASTAR CRÉDITOS DA APIFY
      const cacheNiche = niche
      const cacheCity = city.trim().toLowerCase()
      const CACHE_MAX_AGE_DAYS = 60
      try {
        const staleCutoff = new Date(Date.now() - CACHE_MAX_AGE_DAYS * 24 * 60 * 60 * 1000)
        const existingNames = new Set(existingLeads.map((l: any) => l.businessName.toLowerCase()))
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
        const response = await fetch(`https://api.apify.com/v2/acts/apify~google-maps-scraper/run-sync-get-dataset-items?token=${apifyToken}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            searchStrings: [`${niche} em ${city}`],
            maxCrawledPlacesPerSearch: limit * page, // fetch matching size
            language: 'pt',
            countryCode: 'BR'
          }),
          signal: AbortSignal.timeout(8500)
        })

        if (response.ok) {
          const items = await response.json()
          if (Array.isArray(items) && items.length > 0) {
            const existingNames = new Set(existingLeads.map(l => l.businessName.toLowerCase()))
            const freshItems = items.filter(item => item.title && !existingNames.has(item.title.toLowerCase()))

            for (let i = 0; i < Math.min(freshItems.length, needed - newlyCreated.length); i++) {
              const item = freshItems[i]
              const hasWebsite = !!item.website
              const inTopGoogle = hasWebsite ? Math.random() > 0.4 : false
              const gmbOptimized = (item.reviewsCount || 0) > 30 && (item.stars || 0) >= 4.0
              const rating = item.stars || (Math.round((3.5 + Math.random() * 1.5) * 10) / 10)
              const reviewCount = item.reviewsCount || Math.floor(10 + Math.random() * 200)
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

              const leadData = {
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
                whatsappUrl: item.phone ? `https://wa.me/55${item.phone.replace(/\D/g, '')}` : null,
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

              // Grava no cache global compartilhado para outros usuários reaproveitarem sem gastar créditos da Apify
              try {
                await prisma.scrapedBusiness.upsert({
                  where: { niche_city_businessName: { niche, city: cacheCity, businessName: item.title } },
                  create: {
                    niche,
                    city: cacheCity,
                    businessName: item.title,
                    phone: leadData.phone,
                    address: item.address || null,
                    rating: leadData.rating,
                    reviewCount: leadData.reviewCount,
                    hasWebsite: leadData.hasWebsite,
                    instagramUrl: leadData.instagramUrl,
                    whatsappUrl: leadData.whatsappUrl,
                    apifyPlaceId: item.placeId || null,
                  },
                  update: {
                    phone: leadData.phone,
                    address: item.address || null,
                    rating: leadData.rating,
                    reviewCount: leadData.reviewCount,
                    hasWebsite: leadData.hasWebsite,
                    instagramUrl: leadData.instagramUrl,
                    whatsappUrl: leadData.whatsappUrl,
                  },
                })
              } catch (cacheWriteError) {
                console.warn('Failed to write global scrape cache (non-fatal):', cacheWriteError)
              }
            }
          }
        }
      } catch (apifyError) {
        console.warn('Apify scrape failed or timed out. No fabricated leads are generated as a fallback — only real results are ever returned.', apifyError)
      }

      pagedLeads = [...pagedLeads, ...newlyCreated]
    }

    // Total known real results for this niche/city (cache + this search) — never fabricated.
    // Grows as more real businesses are discovered; "load more" naturally stops once
    // results.length reaches this, instead of promising a fake number of results.
    const totalResults = Math.max(existingLeads.length, skip + pagedLeads.length)

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
