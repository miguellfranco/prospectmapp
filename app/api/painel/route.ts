export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/session'
import { prisma } from '@/lib/db'

// Métricas do painel EbookAI: faturamento real (vendas recebidas via webhook
// dos gateways) + estruturas. Sem vendas registradas, os números ficam em
// zero — estado vazio honesto, nada de dados fabricados.
export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  try {
    const now = new Date()
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const start7d = new Date(startOfToday.getTime() - 6 * 24 * 60 * 60 * 1000)
    const start30d = new Date(startOfToday.getTime() - 29 * 24 * 60 * 60 * 1000)

    const [sales30d, structures] = await Promise.all([
      prisma.infoproductSale.findMany({
        where: { userId: user.id, paidAt: { gte: start30d } },
        select: { amount: true, paidAt: true, gateway: true },
        orderBy: { paidAt: 'asc' },
      }),
      prisma.structure.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        take: 12,
        include: {
          product: { select: { name: true, price: true, checkoutUrl: true } },
          landingPage: { select: { slug: true } },
        },
      }),
    ])

    let today = 0
    let last7 = 0
    let last30 = 0
    const byGateway: Record<string, number> = {}
    const dailyMap: Record<string, number> = {}

    // Série diária dos últimos 30 dias (zerada por padrão)
    for (let i = 0; i < 30; i++) {
      const d = new Date(start30d.getTime() + i * 24 * 60 * 60 * 1000)
      dailyMap[d.toISOString().slice(0, 10)] = 0
    }

    for (const s of sales30d) {
      const amount = s.amount
      last30 += amount
      if (s.paidAt >= start7d) last7 += amount
      if (s.paidAt >= startOfToday) today += amount
      const gw = s.gateway ?? 'outro'
      byGateway[gw] = (byGateway[gw] ?? 0) + amount
      const key = s.paidAt.toISOString().slice(0, 10)
      if (key in dailyMap) dailyMap[key] += amount
    }

    const daily = Object.entries(dailyMap).map(([date, total]) => ({ date, total }))

    return NextResponse.json({
      revenue: { today, last7, last30 },
      byGateway,
      daily,
      salesCount30d: sales30d.length,
      structures: structures.map((s) => ({
        id: s.id,
        niche: s.niche,
        subNiche: s.subNiche,
        title: s.title,
        status: s.status,
        createdAt: s.createdAt,
        productName: s.product?.name ?? null,
        price: s.product?.price ?? null,
        checkoutUrl: s.product?.checkoutUrl ?? null,
        landingSlug: s.landingPage?.slug ?? null,
      })),
    })
  } catch (e) {
    console.error('Erro no painel:', e)
    return NextResponse.json({ error: 'Erro ao carregar o painel.' }, { status: 500 })
  }
}
