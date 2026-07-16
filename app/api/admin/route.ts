export const dynamic = 'force-dynamic'
export const maxDuration = 30

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/session'
import { prisma } from '@/lib/db'

// Painel Super Admin (dev/QA) — exclusivo do MASTER_EMAIL.
//
// Regras de integridade (histórico do projeto exige!):
// - Dados de demonstração entram SOMENTE na conta do próprio admin.
// - Vendas seed levam gatewayTransactionId com prefixo "seed_" e estruturas
//   demo levam subNiche "DEMO" — identificáveis e removíveis com um clique.
// - Usuários finais recebem 404 (a rota nem "existe" para eles).

const DEMO_NICHES = [
  { niche: 'Emagrecimento', title: 'Secar barriga em casa com treinos curtos', product: 'Barriga Zero em 21 Dias', price: 27.9, status: 'concluida' },
  { niche: 'Finanças', title: 'Sair das dívidas ganhando pouco', product: 'Dívida Zero: O Método do Envelope Digital', price: 29.9, status: 'landing_gerada' },
  { niche: 'Air Fryer Gourmet', title: 'Jantares completos só na air fryer', product: '50 Jantares de Air Fryer em 20 Minutos', price: 24.9, status: 'precificado' },
  { niche: 'Adestramento de Pets', title: 'Adestrar o cão em casa em 15 minutos por dia', product: 'Cão Obediente: 15 Minutos por Dia', price: 27.9, status: 'conteudo_gerado' },
  { niche: 'Idiomas', title: 'Inglês para viagem em 90 dias', product: 'Inglês de Bolso para Viajantes', price: 29.9, status: 'concluida' },
]

async function requireAdmin() {
  const master = process.env.MASTER_EMAIL?.trim().toLowerCase()
  if (!master) return null
  const user = await getCurrentUser()
  if (!user?.email || user.email.toLowerCase() !== master) return null
  return user
}

async function getStatus(userId: string) {
  const [seedSales, demoStructures, totals] = await Promise.all([
    prisma.infoproductSale.aggregate({
      where: { userId, gatewayTransactionId: { startsWith: 'seed_' } },
      _count: true,
      _sum: { amount: true },
    }),
    prisma.structure.count({ where: { userId, subNiche: 'DEMO' } }),
    prisma.$transaction([
      prisma.user.count(),
      prisma.structure.count(),
      prisma.infoproductSale.count(),
      prisma.paymentIntegration.count(),
    ]),
  ])
  return {
    seedSalesCount: seedSales._count,
    seedSalesTotal: seedSales._sum.amount ?? 0,
    demoStructuresCount: demoStructures,
    app: { users: totals[0], structures: totals[1], sales: totals[2], integrations: totals[3] },
  }
}

export async function GET() {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })
  try {
    return NextResponse.json({ ok: true, status: await getStatus(admin.id) })
  } catch (e) {
    console.error('Erro no status admin:', e)
    return NextResponse.json({ error: 'Erro ao carregar o status.' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })

  const body = await req.json().catch(() => ({}))
  const action = String(body?.action ?? '')

  try {
    if (action === 'seed-sales') {
      const count = Math.min(300, Math.max(1, Number(body?.count) || 40))
      const days = Math.min(30, Math.max(1, Number(body?.days) || 30))
      const avg = Math.min(500, Math.max(5, Number(body?.avgAmount) || 29.9))

      // Vincula às estruturas do admin quando existirem (gráfico + funil coerentes)
      const products = await prisma.ebookProduct.findMany({
        where: { structure: { userId: admin.id } },
        select: { id: true },
        take: 20,
      })

      const now = Date.now()
      const data = Array.from({ length: count }, (_, i) => {
        // Distribuição enviesada para os dias recentes (curva de crescimento bonita)
        const bias = Math.pow(Math.random(), 1.6)
        const paidAt = new Date(now - bias * days * 24 * 60 * 60 * 1000)
        const amount = Math.round(avg * (0.6 + Math.random() * 0.9) * 100) / 100
        return {
          userId: admin.id,
          productId: products.length ? products[Math.floor(Math.random() * products.length)].id : null,
          amount,
          gateway: Math.random() < 0.65 ? 'kiwify' : 'hotmart',
          gatewayTransactionId: `seed_${now.toString(36)}_${i}_${Math.random().toString(36).slice(2, 8)}`,
          buyerEmail: `comprador${i + 1}@demo.local`,
          paidAt,
        }
      })
      await prisma.infoproductSale.createMany({ data })
      return NextResponse.json({ ok: true, created: count, status: await getStatus(admin.id) })
    }

    if (action === 'seed-structures') {
      const existing = await prisma.structure.count({ where: { userId: admin.id, subNiche: 'DEMO' } })
      let created = 0
      for (const d of DEMO_NICHES.slice(0, Math.max(0, 5 - existing))) {
        const structure = await prisma.structure.create({
          data: { userId: admin.id, niche: d.niche, subNiche: 'DEMO', title: d.title, status: d.status },
        })
        await prisma.ebookProduct.create({
          data: {
            structureId: structure.id,
            name: d.product,
            price: d.price,
            content: `# ${d.product}\n\nConteúdo de demonstração (QA) — gere pelo wizard para conteúdo real.`,
          },
        })
        created++
      }
      return NextResponse.json({ ok: true, created, status: await getStatus(admin.id) })
    }

    if (action === 'clear') {
      const [sales, structures] = await prisma.$transaction([
        prisma.infoproductSale.deleteMany({
          where: { userId: admin.id, gatewayTransactionId: { startsWith: 'seed_' } },
        }),
        prisma.structure.deleteMany({ where: { userId: admin.id, subNiche: 'DEMO' } }),
      ])
      return NextResponse.json({
        ok: true,
        removed: { sales: sales.count, structures: structures.count },
        status: await getStatus(admin.id),
      })
    }

    return NextResponse.json({ error: 'Ação inválida.' }, { status: 400 })
  } catch (e) {
    console.error('Erro na ação admin:', e)
    return NextResponse.json({ error: 'Erro ao executar a ação.' }, { status: 500 })
  }
}
