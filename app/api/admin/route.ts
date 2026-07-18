export const dynamic = 'force-dynamic'
export const maxDuration = 30

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/session'
import { isAdminUser } from '@/lib/plan'
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
  const user = await getCurrentUser()
  if (!user?.email || !isAdminUser(user)) return null
  return user
}

function periodStarts() {
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const DAY = 24 * 60 * 60 * 1000
  return {
    now,
    startOfToday,
    start7: new Date(startOfToday.getTime() - 6 * DAY),
    start30: new Date(startOfToday.getTime() - 29 * DAY),
    DAY,
  }
}

async function getStatus(userId: string) {
  const { startOfToday, start7, start30 } = periodStarts()
  const seedWhere = { userId, gatewayTransactionId: { startsWith: 'seed_' } }
  const [seedSales, seedToday, seed7, seed30, demoStructures, totals] = await Promise.all([
    prisma.infoproductSale.aggregate({ where: seedWhere, _count: true, _sum: { amount: true } }),
    prisma.infoproductSale.aggregate({ where: { ...seedWhere, paidAt: { gte: startOfToday } }, _sum: { amount: true } }),
    prisma.infoproductSale.aggregate({ where: { ...seedWhere, paidAt: { gte: start7 } }, _sum: { amount: true } }),
    prisma.infoproductSale.aggregate({ where: { ...seedWhere, paidAt: { gte: start30 } }, _sum: { amount: true } }),
    prisma.structure.count({ where: { userId, subNiche: 'DEMO' } }),
    prisma.$transaction([
      prisma.user.count(),
      prisma.structure.count(),
      prisma.infoproductSale.count(),
      prisma.paymentIntegration.count(),
    ]),
  ])
  const admins = await prisma.user.findMany({
    where: { isAdmin: true },
    select: { email: true, name: true },
    orderBy: { createdAt: 'asc' },
  })
  return {
    admins,
    masterEmail: process.env.MASTER_EMAIL?.trim().toLowerCase() ?? null,
    seedSalesCount: seedSales._count,
    seedSalesTotal: seedSales._sum.amount ?? 0,
    seedRevenue: {
      today: seedToday._sum.amount ?? 0,
      last7: seed7._sum.amount ?? 0,
      last30: seed30._sum.amount ?? 0,
      allTime: seedSales._sum.amount ?? 0,
    },
    demoStructuresCount: demoStructures,
    app: { users: totals[0], structures: totals[1], sales: totals[2], integrations: totals[3] },
  }
}

// Divide um valor em "vendas" de tamanhos realistas (R$9,90–R$59,90) que somam
// EXATAMENTE o total pedido (matemática em centavos)
function splitAmount(total: number): number[] {
  let remaining = Math.round(total * 100)
  const out: number[] = []
  while (remaining > 0) {
    let piece = remaining <= 5990 ? remaining : 990 + Math.floor(Math.random() * 5000)
    if (remaining - piece > 0 && remaining - piece < 100) piece = remaining
    out.push(piece)
    remaining -= piece
  }
  return out.map((c) => c / 100)
}

// Divide um valor em EXATAMENTE k vendas (para bater também a contagem)
function splitExactCount(totalCents: number, k: number): number[] {
  if (totalCents <= 0) return []
  k = Math.max(1, Math.min(k, totalCents))
  const out: number[] = []
  let remaining = totalCents
  for (let j = 0; j < k - 1; j++) {
    const slotsLeft = k - j - 1
    const avg = remaining / (slotsLeft + 1)
    const piece = Math.max(1, Math.min(Math.round(avg * (0.5 + Math.random())), remaining - slotsLeft))
    out.push(piece)
    remaining -= piece
  }
  out.push(remaining)
  return out
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
      const count = Math.min(30000, Math.max(1, Number(body?.count) || 40))
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
      // Em lotes de 5000 para não estourar o limite de payload do Postgres
      for (let i = 0; i < data.length; i += 5000) {
        await prisma.infoproductSale.createMany({ data: data.slice(i, i + 5000) })
      }
      return NextResponse.json({ ok: true, created: count, status: await getStatus(admin.id) })
    }

    // Define o faturamento de demonstração período por período, com valores
    // EXATOS: Hoje ⊆ 7 dias ⊆ 30 dias ⊆ Total (ajustados automaticamente se
    // vierem incoerentes). Substitui as vendas seed atuais.
    if (action === 'set-revenue') {
      const parse = (v: unknown) => {
        const n = Number(v)
        return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) / 100 : 0
      }
      const today = parse(body?.today)
      const last7 = Math.max(parse(body?.last7), today)
      const last30 = Math.max(parse(body?.last30), last7)
      const allTime = Math.max(parse(body?.allTime), last30)

      const { now, startOfToday, DAY } = periodStarts()
      const products = await prisma.ebookProduct.findMany({
        where: { structure: { userId: admin.id } },
        select: { id: true },
        take: 20,
      })

      const buckets = [
        { amount: today, fromMs: startOfToday.getTime(), toMs: Math.max(now.getTime(), startOfToday.getTime() + 1000) },
        { amount: last7 - today, fromMs: startOfToday.getTime() - 6 * DAY, toMs: startOfToday.getTime() - 1 },
        { amount: last30 - last7, fromMs: startOfToday.getTime() - 29 * DAY, toMs: startOfToday.getTime() - 6 * DAY - 1 },
        { amount: allTime - last30, fromMs: startOfToday.getTime() - 119 * DAY, toMs: startOfToday.getTime() - 29 * DAY - 1 },
      ]

      // Quantidade exata de vendas (opcional): distribui proporcionalmente
      // entre os períodos; sem ela, usa tickets realistas automáticos
      const salesCountRaw = Number(body?.salesCount)
      const salesCount = Number.isFinite(salesCountRaw) && salesCountRaw >= 1 ? Math.min(30000, Math.floor(salesCountRaw)) : null
      let bucketCounts: number[] | null = null
      if (salesCount && allTime > 0) {
        bucketCounts = buckets.map((b) => (b.amount > 0 ? Math.max(1, Math.round(salesCount * (b.amount / allTime))) : 0))
        // Ajusta a soma para bater exatamente salesCount (mexe no maior bucket)
        let diff = salesCount - bucketCounts.reduce((a, c) => a + c, 0)
        const biggest = bucketCounts.indexOf(Math.max(...bucketCounts))
        bucketCounts[biggest] = Math.max(1, bucketCounts[biggest] + diff)
      }

      const stamp = Date.now().toString(36)
      let i = 0
      const data = buckets.flatMap((b, bi) =>
        (bucketCounts
          ? splitExactCount(Math.round(b.amount * 100), bucketCounts[bi]).map((c) => c / 100)
          : splitAmount(b.amount)
        ).map((amount) => ({
          userId: admin.id,
          productId: products.length ? products[Math.floor(Math.random() * products.length)].id : null,
          amount,
          gateway: Math.random() < 0.65 ? 'kiwify' : 'hotmart',
          gatewayTransactionId: `seed_rev_${stamp}_${i++}_${Math.random().toString(36).slice(2, 8)}`,
          buyerEmail: `comprador${i}@demo.local`,
          paidAt: new Date(b.fromMs + Math.random() * (b.toMs - b.fromMs)),
        }))
      )

      await prisma.infoproductSale.deleteMany({
        where: { userId: admin.id, gatewayTransactionId: { startsWith: 'seed_' } },
      })
      for (let j = 0; j < data.length; j += 5000) {
        await prisma.infoproductSale.createMany({ data: data.slice(j, j + 5000) })
      }
      return NextResponse.json({ ok: true, created: data.length, status: await getStatus(admin.id) })
    }

    // Estruturas demo configuráveis: total, quantas têm e-book e quantas têm
    // página no ar — para bater exatamente os números do funil no painel.
    // Substitui as estruturas DEMO existentes (números exatos, sem empilhar).
    if (action === 'seed-structures') {
      const count = Math.min(100, Math.max(1, Number(body?.count) || 5))
      const withEbook = Math.min(count, Math.max(0, Number(body?.withEbook ?? count)))
      const withLanding = Math.min(count, Math.max(0, Number(body?.withLanding ?? 0)))

      await prisma.structure.deleteMany({ where: { userId: admin.id, subNiche: 'DEMO' } })

      const stamp = Date.now().toString(36)
      for (let i = 0; i < count; i++) {
        const d = DEMO_NICHES[i % DEMO_NICHES.length]
        const hasEbook = i < withEbook
        const hasLanding = i < withLanding
        const status = hasLanding ? (i % 2 === 0 ? 'concluida' : 'landing_gerada') : hasEbook ? 'conteudo_gerado' : 'rascunho'

        const structure = await prisma.structure.create({
          data: { userId: admin.id, niche: d.niche, subNiche: 'DEMO', title: d.title, status },
        })
        if (hasEbook) {
          await prisma.ebookProduct.create({
            data: {
              structureId: structure.id,
              name: d.product,
              price: d.price,
              content: `# ${d.product}\n\nConteúdo de demonstração (QA) — gere pelo wizard para conteúdo real.`,
            },
          })
        }
        if (hasLanding) {
          await prisma.landingPage.create({
            data: {
              structureId: structure.id,
              slug: `demo-${stamp}-${i}`,
              headline: d.title,
              copyJson: '{}',
              priceDisplay: `R$ ${d.price.toFixed(2).replace('.', ',')}`,
              userHostedUrl: 'https://exemplo-demo.netlify.app',
            },
          })
        }
      }
      return NextResponse.json({ ok: true, created: count, status: await getStatus(admin.id) })
    }

    // Concede acesso de Super Admin a uma conta já registrada (para o sócio)
    if (action === 'grant-admin') {
      const email = String(body?.email ?? '').trim().toLowerCase()
      if (!email) return NextResponse.json({ error: 'Informe o e-mail da conta.' }, { status: 400 })
      const target = await prisma.user.findUnique({ where: { email } })
      if (!target) {
        return NextResponse.json(
          { error: `Nenhuma conta com o e-mail ${email}. Peça para a pessoa criar a conta em /cadastro primeiro (leva 1 minuto).` },
          { status: 404 },
        )
      }
      await prisma.user.update({ where: { id: target.id }, data: { isAdmin: true } })
      return NextResponse.json({ ok: true, granted: email, status: await getStatus(admin.id) })
    }

    if (action === 'revoke-admin') {
      const email = String(body?.email ?? '').trim().toLowerCase()
      const master = process.env.MASTER_EMAIL?.trim().toLowerCase()
      if (email === master) return NextResponse.json({ error: 'O dono (MASTER_EMAIL) não pode ser removido.' }, { status: 400 })
      if (email === admin.email?.toLowerCase()) return NextResponse.json({ error: 'Você não pode remover a si mesmo.' }, { status: 400 })
      await prisma.user.updateMany({ where: { email }, data: { isAdmin: false } })
      return NextResponse.json({ ok: true, revoked: email, status: await getStatus(admin.id) })
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
