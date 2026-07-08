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
        // Login de Administrador
        // MASTER_EMAIL e MASTER_PASSWORD devem ser definidos nas variáveis de
        // ambiente (Vercel/​.env, nunca commitados). Sem essas duas variáveis
        // configuradas, o login master fica desativado — não há credencial
        // padrão embutida no código-fonte.
        // =========================================================================
        const envEmail = process.env.MASTER_EMAIL
        const envPassword = process.env.MASTER_PASSWORD

        const inputEmail = credentials.email.toLowerCase()
        const inputPassword = credentials.password

        const isMaster =
          !!envEmail && !!envPassword &&
          inputEmail === envEmail.toLowerCase() && inputPassword === envPassword

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
                  referralCode: 'ADMINPM',
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

          // Nota: este login de administrador antes semeava automaticamente ~110 vendas,
          // 15 usuários e comissões de afiliado fictícias marcadas como "pagas" direto no
          // banco de produção sempre que havia poucas vendas reais. Isso foi removido por
          // corromper dados reais (ranking e comissões de afiliados deixavam de refletir
          // atividade real). Para popular um ambiente de demonstração/local, use
          // `npm run seed` (scripts/seed.ts), nunca o fluxo de login.

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
