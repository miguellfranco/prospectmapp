export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/session'
import { prisma } from '@/lib/db'

// Alimenta o sino de notificações do topo do app — só vendas reais recebidas
// via webhook dos gateways (nunca fabricadas; se não houver integração
// conectada, InfoproductSale nunca tem linha nenhuma e isso aqui sempre
// devolve vazio). "after" é um cursor ISO (createdAt da última venda que o
// cliente já viu); sem "after", devolve só as mais recentes, pra popular o
// sino na primeira carga sem disparar toast de vendas antigas.
export async function GET(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const after = req.nextUrl.searchParams.get('after')
  const afterDate = after ? new Date(after) : null
  const hasValidAfter = afterDate !== null && !isNaN(afterDate.getTime())

  const sales = await prisma.infoproductSale.findMany({
    where: {
      userId: user.id,
      ...(hasValidAfter ? { createdAt: { gt: afterDate! } } : {}),
    },
    orderBy: { createdAt: hasValidAfter ? 'asc' : 'desc' },
    take: 20,
    include: { product: { select: { name: true } } },
  })

  // Sempre devolve em ordem cronológica crescente (mais antiga → mais nova)
  const ordered = hasValidAfter ? sales : sales.slice().reverse()

  return NextResponse.json({
    sales: ordered.map((s) => ({
      id: s.id,
      amount: s.amount,
      productName: s.product?.name ?? null,
      buyerEmail: s.buyerEmail,
      gateway: s.gateway,
      createdAt: s.createdAt,
    })),
  })
}
