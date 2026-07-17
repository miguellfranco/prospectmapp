export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/session'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    let trackingPixelId = user.trackingPixelId
    if (!trackingPixelId) {
      trackingPixelId = `lz_${Math.random().toString(36).substring(2, 11)}_${Date.now().toString(36)}`
      try {
        await prisma.user.update({
          where: { id: user.id },
          data: { trackingPixelId }
        })
      } catch (dbError) {
        console.warn('Database offline, skipping trackingPixelId update in DB')
      }
    }

    const dailyLimit = user.plan === 'vitalicio' ? 50 : user.plan === 'mensal' ? 5 : 3
    const userCreatedAt = user.createdAt ? new Date(user.createdAt).getTime() : Date.now()
    const daysActive = Math.max(1, Math.floor((Date.now() - userCreatedAt) / (1000 * 60 * 60 * 24)) + 1)

    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      whatsappNumber: user.whatsappNumber || '',
      plan: user.plan,
      planStatus: user.planStatus,
      referralCode: user.referralCode,
      leadsUsedToday: user.leadsUsedToday || 0,
      dailyLimit,
      daysActive,
      trackingPixelId,
      isAdmin: Boolean(process.env.MASTER_EMAIL && user.email?.toLowerCase() === process.env.MASTER_EMAIL.trim().toLowerCase()),
    })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Erro' }, { status: 500 })
  }
}
