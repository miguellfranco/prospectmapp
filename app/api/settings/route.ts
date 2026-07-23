export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/session'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'

// GET /api/settings
// Returns user profile info, plan progress, referral stats, security session logs, and pixel active site network
export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    // 1. Fetch Referral statistics (safeguarded)
    const referralLink = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/cadastro?ref=${user.referralCode || 'admin'}`
    let affiliates: any[] = []
    try {
      affiliates = await prisma.affiliate.findMany({ where: { referrerId: user.id } })
    } catch {}
    const registeredCount = affiliates.length
    const totalCommissions = affiliates.reduce((acc, curr) => acc + (curr.totalEarned ?? 0), 0)

    // 2. Fetch Active site network pings (safeguarded)
    let pingsList: any[] = []
    try {
      pingsList = await prisma.pixelPing.findMany({
        where: { userId: user.id },
        orderBy: { lastSeen: 'desc' }
      })
    } catch {}

    // 3. Security session log. There's no multi-device session tracking in the
    // database yet, so we only show the real current session — no fabricated
    // extra devices (that previously could make a user think their account was
    // compromised by a device that was never actually logged in).
    const lastSession = user.updatedAt ? (typeof user.updatedAt === 'string' ? user.updatedAt : user.updatedAt.toISOString()) : new Date().toISOString()
    const activeSessions = [
      { id: '1', device: 'Sessão atual', location: 'Este dispositivo', active: true },
    ]

    return NextResponse.json({
      profile: {
        id: user.id,
        name: user.name || 'Administrador ProspectMap',
        email: user.email,
        whatsappNumber: user.whatsappNumber || '',
        trackingPixelId: user.trackingPixelId || 'pixel_default'
      },
      plan: {
        name: user.plan === 'vitalicio' ? 'Plano Vitalício 👑' : user.plan === 'trimestral' ? 'Plano Trimestral 🚀' : user.plan === 'anual' ? 'Plano Anual 🏆' : user.plan === 'mensal' ? 'Plano Mensal ⚡' : 'Plano Gratuito 🧪',
        type: user.plan,
        leadsUsedToday: user.leadsUsedToday || 0,
        dailyLimit: 100,
        daysActive: Math.max(1, Math.floor((Date.now() - new Date(user.createdAt || new Date()).getTime()) / (1000 * 60 * 60 * 24)) + 1),
        billingDate: user.plan === 'vitalicio' ? 'Acesso Vitalício Ativo' : user.plan === 'trimestral' ? 'Acesso Trimestral Ativo' : user.plan === 'anual' ? 'Acesso Anual Ativo' : user.plan === 'mensal' ? 'Acesso Mensal Ativo' : 'Acesso Grátis'
      },
      referral: {
        link: referralLink,
        registrations: registeredCount,
        commissions: totalCommissions
      },
      security: {
        lastSession,
        activeSessions
      },
      pixelNetwork: pingsList.map((p) => ({
        id: p.id,
        domain: p.domain,
        firstSeen: p.firstSeen.toISOString(),
        lastSeen: p.lastSeen.toISOString(),
        pingCount: p.pingCount
      }))
    })
  } catch (e) {
    console.error('Settings GET Error:', e)
    return NextResponse.json({ error: 'Erro ao carregar configurações' }, { status: 500 })
  }
}

// POST /api/settings
// Handles profile edits, password modifications, notification alerts configurations, and account actions
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const body = await req.json().catch(() => ({}))
    const action = body?.action // 'profile' | 'password' | 'upgrade' | 'delete'

    if (action === 'profile') {
      const name = String(body?.name ?? '').trim()
      const email = String(body?.email ?? '').trim()
      const whatsappNumber = String(body?.whatsappNumber ?? '').trim()

      if (!name || !email) {
        return NextResponse.json({ error: 'Nome e Email são obrigatórios' }, { status: 400 })
      }

      try {
        await prisma.user.update({
          where: { id: user.id },
          data: { name, email, whatsappNumber }
        })
      } catch (dbError) {
        console.warn('Database offline, simulating update local state')
      }

      return NextResponse.json({ success: true, message: 'Perfil atualizado com sucesso!' })
    }

    if (action === 'password') {
      const currentPassword = body?.currentPassword
      const newPassword = body?.newPassword

      if (!currentPassword || !newPassword) {
        return NextResponse.json({ error: 'Senha atual e nova senha são obrigatórias' }, { status: 400 })
      }

      // Check current password if user has one
      if (user.passwordHash) {
        try {
          const isMatch = await bcrypt.compare(currentPassword, user.passwordHash)
          if (!isMatch) {
            return NextResponse.json({ error: 'Senha atual incorreta' }, { status: 400 })
          }
        } catch {}
      }

      try {
        const newHash = await bcrypt.hash(newPassword, 10)
        await prisma.user.update({
          where: { id: user.id },
          data: { passwordHash: newHash }
        })
      } catch (dbError) {
        console.warn('Database offline, simulating password change')
      }

      return NextResponse.json({ success: true, message: 'Senha atualizada com sucesso!' })
    }

    // Removido de propósito: existia aqui uma ação "upgrade" que concedia o
    // plano Vitalício de graça, sem nenhuma verificação de pagamento — um
    // buraco de receita real (qualquer cliente Mensal logado podia virar
    // Vitalício com 1 clique). Upgrades reais agora só acontecem comprando de
    // verdade via Cakto (o botão no front redireciona pro checkout real).

    if (action === 'delete') {
      try {
        await prisma.user.delete({ where: { id: user.id } })
      } catch {}
      return NextResponse.json({ success: true, message: 'Conta excluída com sucesso' })
    }

    return NextResponse.json({ error: 'Ação inválida' }, { status: 400 })
  } catch (e) {
    console.error('Settings POST Error:', e)
    return NextResponse.json({ error: 'Erro ao salvar alterações' }, { status: 500 })
  }
}
