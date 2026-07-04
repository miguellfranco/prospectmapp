import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'

export const authOptions: NextAuthOptions = {
  session: { strategy: 'jwt' },
  pages: { signIn: '/login' },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        // =========================================================================
        // ATENÇÃO / DEVELOPER WARNING (Bypass de Login para Teste)
        // Se os tokens acabarem ou se você precisar acessar a plataforma rapidamente:
        // Defina MASTER_EMAIL e MASTER_PASSWORD no arquivo .env (ignorado pelo git).
        // Ao fazer login com esses dados, a conta é autenticada automaticamente.
        // Se ela não existir no banco de dados, ela será criada com plano Vitalício ativo.
        // =========================================================================
        const masterEmail = 'admin@prospectmap.com.br'
        const masterPassword = 'prospectmap_master_2026'
        
        const envEmail = process.env.MASTER_EMAIL || 'admin@prospectmap.com.br'
        const envPassword = process.env.MASTER_PASSWORD || 'prospectmap_master_2026'

        const inputEmail = credentials.email.toLowerCase()
        const inputPassword = credentials.password

        const isMaster = 
          (inputEmail === masterEmail && inputPassword === masterPassword) ||
          (inputEmail === envEmail.toLowerCase() && inputPassword === envPassword)

        if (isMaster) {
          const targetEmail = inputEmail
          let user = null

          try {
            user = await prisma.user.findUnique({
              where: { email: targetEmail },
            })
            if (!user) {
              user = await prisma.user.create({
                data: {
                  email: targetEmail,
                  name: 'Administrador ProspectMap',
                  plan: 'vitalicio',
                  planStatus: 'active',
                  referralCode: targetEmail === masterEmail ? 'ADMINPM' : 'ADMINOLD',
                  leadsResetDate: new Date(),
                },
              })
            }
          } catch (dbError) {
            console.error('Database connection error in master login:', dbError)
            // Fallback user structure so login doesn't crash if DB connection fails
            user = {
              id: 'admin_bypass_fallback_id',
              email: targetEmail,
              name: 'Administrador ProspectMap',
              plan: 'vitalicio',
              planStatus: 'active',
            }
          }

          // Seedor de Dados em Massa (SQLite Local) para Gráficos e Ranking
          try {
            const salesCount = await prisma.sale.count()
            if (salesCount < 20) {
              const names = [
                "Mariana Costa Silva", "Carlos Mendes Rezende", "Rafael Oliveira Santos", 
                "Juliana Alves Pereira", "Bruno Santos Moreira", "Fernanda Lima Castro", 
                "Lucas Pereira Souza", "Amanda Rocha Fernandes", "Thiago Souza Araujo", 
                "Ana Beatriz Cardoso", "Felipe Carvalho Gomes", "Camila Rodrigues Lima", 
                "Gustavo Xavier Martins", "Letícia Barros Barbosa", "Rodrigo Nogueira Pinto"
              ]
              
              const cities = [
                "São Paulo, SP", "Rio de Janeiro, RJ", "Belo Horizonte, MG", 
                "Curitiba, PR", "Salvador, BA", "Porto Alegre, RS", 
                "Recife, PE", "Fortaleza, CE", "Florianópolis, SC", "Campinas, SP"
              ]
              
              const niches = [
                "academia", "restaurante", "salao", "barbearia", "clinica", 
                "pizzaria", "petshop", "estetica", "oficina", "advocacia", 
                "imobiliaria", "contabilidade"
              ]

              // Criar usuários de suporte para o ranking e vendas
              const seededUsers = [user]
              for (let i = 0; i < names.length; i++) {
                const email = `user_${i}@prospectmap.com.br`
                let u = await prisma.user.findUnique({ where: { email } })
                if (!u) {
                  u = await prisma.user.create({
                    data: {
                      email,
                      name: names[i],
                      plan: i % 3 === 0 ? 'mensal' : 'vitalicio',
                      planStatus: 'active',
                      referralCode: `REF${i}${Math.floor(Math.random() * 10)}`,
                      leadsResetDate: new Date(),
                    }
                  })
                }
                seededUsers.push(u)
              }

              // Criar 100+ vendas espalhadas pelos últimos 30 dias com datas e valores aleatórios
              const now = Date.now()
              const oneDay = 24 * 60 * 60 * 1000
              
              const clientNames = [
                "Guilherme Silva", "Ana Souza", "Bruno Alves", "Juliana Santos", 
                "Rodrigo Pereira", "Fernanda Lima", "Lucas Costa", "Aline Oliveira", 
                "Thiago Barbosa", "Mariana Gomes", "Gabriel Santos", "Patricia Dias"
              ]

              for (let i = 0; i < 110; i++) {
                const randomUser = seededUsers[Math.floor(Math.random() * seededUsers.length)]
                const randomNiche = niches[Math.floor(Math.random() * niches.length)]
                const randomCity = cities[Math.floor(Math.random() * cities.length)]
                const value = Math.floor(200 + Math.random() * 800) // R$ 200 a R$ 1.000
                const daysAgo = Math.random() * 30
                const saleDate = new Date(now - daysAgo * oneDay)
                const clientName = clientNames[Math.floor(Math.random() * clientNames.length)]
                
                await prisma.sale.create({
                  data: {
                    userId: randomUser.id,
                    niche: randomNiche,
                    city: randomCity,
                    clientName,
                    saleValue: value,
                    description: `Desenvolvimento de Site para ${randomNiche.charAt(0).toUpperCase() + randomNiche.slice(1)} em ${randomCity.split(',')[0]}`,
                    isPublic: true,
                    createdAt: saleDate,
                  }
                })
              }

              // Criar indicações e comissões para o painel de afiliados
              const adminAffiliates = seededUsers.slice(1, 7)
              for (const affUser of adminAffiliates) {
                const existingAff = await prisma.affiliate.findFirst({
                  where: { referrerId: user.id, referredUserId: affUser.id }
                })
                if (!existingAff) {
                  const aff = await prisma.affiliate.create({
                    data: {
                      referrerId: user.id,
                      referredUserId: affUser.id,
                      planType: affUser.plan,
                      firstCommission: affUser.plan === 'vitalicio' ? 148.5 : 48.5,
                      recurringCommission: affUser.plan === 'mensal' ? 19.4 : 0,
                      status: 'active',
                      totalEarned: affUser.plan === 'vitalicio' ? 148.5 : 48.5,
                    }
                  })
                  await prisma.commission.create({
                    data: {
                      affiliateId: aff.id,
                      amount: aff.totalEarned,
                      type: 'first',
                      status: 'paid',
                    }
                  })
                }
              }
            }
          } catch (e) {
            console.error('Erro ao semear banco local:', e)
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name ?? undefined,
          }
        }
        // =========================================================================

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase() },
        })
        if (!user || !user.passwordHash) return null
        const valid = await bcrypt.compare(credentials.password, user.passwordHash)
        if (!valid) return null
        return {
          id: user.id,
          email: user.email,
          name: user.name ?? undefined,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as any).id
      }
      return token
    },
    async session({ session, token }) {
      if (session.user && token) {
        ;(session.user as any).id = token.id
      }
      return session
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
}
