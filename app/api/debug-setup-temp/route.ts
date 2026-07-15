export const dynamic = 'force-dynamic'
export const maxDuration = 60

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// TEMPORARY — times the full Apify fetch + bulk-save path for a test niche,
// to confirm the timeout fix works end to end. Cleans up its own test leads.
// Delete after use.
export async function GET(req: NextRequest) {
  const debugToken = process.env.DEBUG_TEST_TOKEN
  if (!debugToken) return NextResponse.json({ error: 'Not configured' }, { status: 400 })
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${debugToken}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const city = searchParams.get('city') || 'Osasco, SP'
  const searchTerm = searchParams.get('term') || 'suplementos'
  const testNiche = 'debug-timeout-test-2'

  const adminUser = await prisma.user.findFirst({ where: { referralCode: 'ADMINPM' }, select: { id: true } })
  if (!adminUser) return NextResponse.json({ error: 'Admin user not found for test' }, { status: 400 })
  const testUserId = adminUser.id

  const apifyToken = process.env.APIFY_API_TOKEN
  if (!apifyToken) return NextResponse.json({ error: 'Missing APIFY_API_TOKEN' }, { status: 400 })

  const overallStart = Date.now()
  const apifyStart = Date.now()
  const response = await fetch(
    `https://api.apify.com/v2/acts/compass~crawler-google-places/run-sync-get-dataset-items?token=${apifyToken}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        searchStringsArray: [searchTerm],
        locationQuery: `${city}, Brasil`,
        maxCrawledPlacesPerSearch: 70,
        language: 'pt-BR',
      }),
      signal: AbortSignal.timeout(55000),
    }
  )
  const apifyMs = Date.now() - apifyStart
  const items = await response.json()
  if (!Array.isArray(items)) {
    return NextResponse.json({ error: 'Apify did not return an array', items })
  }

  const cacheCity = city.trim().toLowerCase()
  const toProcess = items.filter((i) => i.title)
  const leadData = toProcess.map((item) => ({
    userId: testUserId,
    businessName: item.title,
    phone: item.phone || null,
    city: item.address || city,
    niche: testNiche,
    rating: item.totalScore ?? null,
    reviewCount: item.reviewsCount ?? 0,
    hasWebsite: !!item.website,
    score: 5,
    tier: 'cold',
    status: 'novo',
  }))

  const saveStart = Date.now()
  await prisma.lead.createMany({ data: leadData })
  const savedLeads = await prisma.lead.findMany({ where: { userId: testUserId, niche: testNiche } })
  await prisma.scrapedBusiness.createMany({
    data: toProcess.map((item) => ({
      niche: 'suplementos',
      city: cacheCity,
      businessName: item.title,
      phone: item.phone || null,
      address: item.address || null,
      rating: item.totalScore ?? null,
      reviewCount: item.reviewsCount ?? 0,
      hasWebsite: !!item.website,
    })),
    skipDuplicates: true,
  })
  const saveMs = Date.now() - saveStart
  const totalMs = Date.now() - overallStart

  // Clean up the test leads (keep the ScrapedBusiness cache — that's real, reusable data)
  await prisma.lead.deleteMany({ where: { userId: testUserId, niche: testNiche } })

  return NextResponse.json({
    city,
    searchTerm,
    apifyItemCount: items.length,
    apifyMs,
    saveMs,
    totalMs,
    successCount: savedLeads.length,
    wouldHaveTimedOutAt60s: totalMs > 60000,
  })
}
