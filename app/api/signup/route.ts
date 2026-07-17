export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'

function genCode(len = 8) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let s = ''
  for (let i = 0; i < len; i++) s += chars[Math.floor(Math.random() * chars.length)]
  return s
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const { name, email, password, whatsappNumber, plan, referralCode } = body ?? {}

    if (!email || !password || !name) {
      return NextResponse.json({ error: 'Preencha todos os campos obrigatórios.' }, { status: 400 })
    }
    if (String(password).length < 6) {
      return NextResponse.json({ error: 'A senha deve ter pelo menos 6 caracteres.' }, { status: 400 })
    }

    const normalizedEmail = String(email).toLowerCase().trim()
    
    let existing = null
    try {
      existing = await prisma.user.findUnique({ where: { email: normalizedEmail } })
    } catch {}

    if (existing) {
      return NextResponse.json({ error: 'Já existe uma conta com este e-mail.' }, { status: 409 })
    }

    const hash = await bcrypt.hash(String(password), 10)

    let referredBy: string | null = null
    if (referralCode) {
      try {
        const referrer = await prisma.user.findUnique({ where: { referralCode: String(referralCode).toUpperCase() } })
        if (referrer) referredBy = referrer.id
      } catch {}
    }

    let code = genCode()
    try {
      for (let i = 0; i < 5; i++) {
        const taken = await prisma.user.findUnique({ where: { referralCode: code } })
        if (!taken) break
        code = genCode()
      }
    } catch {}

    // Segurança de receita: conta criada aqui NUNCA nasce com plano pago.
    // Plano ativo só via pagamento confirmado (grant-access/AbacatePay).
    void plan
    const chosenPlan = 'free'

    let user = null
    try {
      user = await prisma.user.create({
        data: {
          email: normalizedEmail,
          name: String(name),
          passwordHash: hash,
          plan: chosenPlan,
          planStatus: chosenPlan === 'free' ? 'trial' : 'active',
          referralCode: code,
          referredBy,
          whatsappNumber: whatsappNumber ? String(whatsappNumber) : null,
          leadsResetDate: new Date(),
        },
      })
    } catch (dbError) {
      console.warn('Database offline during signup, generating local user bypass fallback')
      user = {
        id: `local_user_${Math.random().toString(36).substring(2, 9)}`,
        email: normalizedEmail,
        name: String(name),
        plan: chosenPlan,
        planStatus: 'active',
      }
    }

    // Vínculo de afiliado (sem comissão no cadastro — conta nasce free;
    // comissão só faria sentido após pagamento confirmado)
    if (referredBy) {
      await prisma.affiliate.create({
        data: {
          referrerId: referredBy,
          referredUserId: user.id,
          planType: chosenPlan,
          firstCommission: 0,
          status: 'active',
          totalEarned: 0,
        },
      })
    }

    return NextResponse.json({ ok: true, id: user.id })
  } catch (e) {
    console.error('Signup error:', e)
    return NextResponse.json({ error: 'Erro ao criar conta. Tente novamente.' }, { status: 500 })
  }
}
