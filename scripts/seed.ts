import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

function code(len = 8) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let s = ''
  for (let i = 0; i < len; i++) s += chars[Math.floor(Math.random() * chars.length)]
  return s
}

async function main() {
  const hash = await bcrypt.hash('johndoe123', 10)

  // Primary test account (vitalicio plan)
  const main = await prisma.user.upsert({
    where: { email: 'john@doe.com' },
    update: {},
    create: {
      email: 'john@doe.com',
      name: 'Carlos Mendes',
      passwordHash: hash,
      plan: 'vitalicio',
      planStatus: 'active',
      referralCode: 'CARLOS01',
      leadsUsedToday: 12,
      leadsResetDate: new Date(),
    },
  })

  // Other users for public feed + ranking
  const otherUsersData = [
    { email: 'mariana@exemplo.com', name: 'Mariana Costa', plan: 'vitalicio', city: 'São Paulo, SP', sales: 9 },
    { email: 'rafael@exemplo.com', name: 'Rafael Oliveira', plan: 'mensal', city: 'Rio de Janeiro, RJ', sales: 7 },
    { email: 'juliana@exemplo.com', name: 'Juliana Alves', plan: 'vitalicio', city: 'Belo Horizonte, MG', sales: 6 },
    { email: 'bruno@exemplo.com', name: 'Bruno Santos', plan: 'mensal', city: 'Curitiba, PR', sales: 5 },
    { email: 'fernanda@exemplo.com', name: 'Fernanda Lima', plan: 'vitalicio', city: 'Porto Alegre, RS', sales: 4 },
    { email: 'lucas@exemplo.com', name: 'Lucas Pereira', plan: 'mensal', city: 'Salvador, BA', sales: 3 },
    { email: 'amanda@exemplo.com', name: 'Amanda Rocha', plan: 'vitalicio', city: 'Recife, PE', sales: 8 },
    { email: 'thiago@exemplo.com', name: 'Thiago Souza', plan: 'mensal', city: 'Fortaleza, CE', sales: 2 },
  ]

  const otherUsers: { id: string; name: string; city: string; sales: number }[] = []
  for (const u of otherUsersData) {
    const created = await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        email: u.email,
        name: u.name,
        passwordHash: hash,
        plan: u.plan,
        planStatus: 'active',
        referralCode: code(),
        leadsResetDate: new Date(),
      },
    })
    otherUsers.push({ id: created.id, name: u.name, city: u.city, sales: u.sales })
  }

  // Leads for the main user
  const existingLeads = await prisma.lead.count({ where: { userId: main.id } })
  if (existingLeads === 0) {
    const leadsData = [
      { businessName: 'Academia FitLife', phone: '(11) 98765-4321', city: 'São Paulo, SP', niche: 'academia', rating: 4.7, reviewCount: 213, hasWebsite: false, yearsWithoutSite: 4, score: 9, tier: 'hot', status: 'novo' },
      { businessName: 'Salão Beleza Total', phone: '(11) 97654-3210', city: 'Guarulhos, SP', niche: 'salao', rating: 4.9, reviewCount: 158, hasWebsite: false, yearsWithoutSite: 6, score: 10, tier: 'hot', status: 'mensagem_gerada' },
      { businessName: 'Pizzaria do Zé', phone: '(21) 96543-2109', city: 'Rio de Janeiro, RJ', niche: 'pizzaria', rating: 4.5, reviewCount: 421, hasWebsite: false, yearsWithoutSite: 3, score: 8, tier: 'hot', status: 'enviado' },
      { businessName: 'Clínica Sorriso Perfeito', phone: '(31) 95432-1098', city: 'Belo Horizonte, MG', niche: 'clinica', rating: 4.8, reviewCount: 97, hasWebsite: true, yearsWithoutSite: 0, score: 6, tier: 'warm', status: 'novo' },
      { businessName: 'Barbearia Navalha de Ouro', phone: '(41) 94321-0987', city: 'Curitiba, PR', niche: 'barbearia', rating: 4.6, reviewCount: 312, hasWebsite: false, yearsWithoutSite: 5, score: 9, tier: 'hot', status: 'respondeu' },
      { businessName: 'Restaurante Sabor Caseiro', phone: '(51) 93210-9876', city: 'Porto Alegre, RS', niche: 'restaurante', rating: 4.3, reviewCount: 188, hasWebsite: false, yearsWithoutSite: 2, score: 7, tier: 'warm', status: 'novo' },
      { businessName: 'Pet Shop Amigo Fiel', phone: '(71) 92109-8765', city: 'Salvador, BA', niche: 'petshop', rating: 4.4, reviewCount: 76, hasWebsite: false, yearsWithoutSite: 4, score: 7, tier: 'warm', status: 'venda_fechada' },
      { businessName: 'Estética Bella Pele', phone: '(81) 91098-7654', city: 'Recife, PE', niche: 'estetica', rating: 5.0, reviewCount: 44, hasWebsite: false, yearsWithoutSite: 1, score: 8, tier: 'hot', status: 'novo' },
      { businessName: 'Oficina Mecânica Turbo', phone: '(85) 90987-6543', city: 'Fortaleza, CE', niche: 'oficina', rating: 4.1, reviewCount: 129, hasWebsite: false, yearsWithoutSite: 7, score: 6, tier: 'warm', status: 'novo' },
      { businessName: 'Hamburgueria Brasa & Fogo', phone: '(11) 98888-1122', city: 'Campinas, SP', niche: 'restaurante', rating: 4.2, reviewCount: 256, hasWebsite: true, yearsWithoutSite: 0, score: 4, tier: 'cold', status: 'ignorado' },
    ]
    let i = 0
    for (const l of leadsData) {
      const created = await prisma.lead.create({
        data: {
          userId: main.id,
          ...l,
          createdAt: new Date(Date.now() - i * 3600 * 1000),
        },
      })
      // generated messages for some
      if (['mensagem_gerada', 'enviado', 'respondeu', 'venda_fechada'].includes(l.status)) {
        await prisma.message.create({
          data: {
            userId: main.id,
            leadId: created.id,
            messageText: `Olá! Sou especialista em sites para negócios como a ${l.businessName}. Notei que vocês têm ótimas avaliações (${l.rating}⭐) mas ainda não têm um site profissional. Posso criar uma página que vai atrair ainda mais clientes em ${l.city?.split(',')[0]}. Podemos conversar?`,
            generatedAt: new Date(Date.now() - i * 3600 * 1000),
            sentAt: ['enviado', 'respondeu', 'venda_fechada'].includes(l.status) ? new Date() : null,
          },
        })
      }
      i++
    }

    // A closed sale for the main user
    await prisma.sale.create({
      data: {
        userId: main.id,
        niche: 'petshop',
        city: 'Salvador, BA',
        saleValue: 1500,
        description: 'Site institucional + Google Meu Negócio para Pet Shop Amigo Fiel',
        isPublic: true,
      },
    })
  }

  // Public sales feed from other users
  const salesCount = await prisma.sale.count()
  if (salesCount < 6) {
    const niches = ['academia', 'restaurante', 'salao', 'barbearia', 'clinica', 'pizzaria', 'estetica', 'petshop']
    let s = 0
    for (const u of otherUsers) {
      for (let k = 0; k < u.sales; k++) {
        await prisma.sale.create({
          data: {
            userId: u.id,
            niche: niches[(s + k) % niches.length],
            city: u.city,
            saleValue: [800, 1200, 1500, 2000, 2500][(s + k) % 5],
            description: 'Venda de site profissional',
            isPublic: true,
            createdAt: new Date(Date.now() - (s * 1800 + k * 600) * 1000),
          },
        })
      }
      s++
    }
  }

  // Affiliates + commissions for the main user
  const affCount = await prisma.affiliate.count({ where: { referrerId: main.id } })
  if (affCount === 0) {
    const referred = otherUsers.slice(0, 3)
    for (const r of referred) {
      const planType = Math.random() > 0.5 ? 'vitalicio' : 'mensal'
      const first = planType === 'vitalicio' ? 98.5 : 48.5
      const aff = await prisma.affiliate.create({
        data: {
          referrerId: main.id,
          referredUserId: r.id,
          planType,
          firstCommission: first,
          recurringCommission: 0,
          status: 'active',
          totalEarned: first,
        },
      })
      await prisma.commission.create({
        data: {
          affiliateId: aff.id,
          amount: first,
          type: 'first',
          status: 'paid',
        },
      })
    }
  }

  console.log('Seed concluído com sucesso!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
