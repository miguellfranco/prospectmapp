export const dynamic = 'force-dynamic'
export const maxDuration = 30

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { createPixCharge, PLAN_PRICES_CENTS, PLAN_LABELS } from '@/lib/abacatepay'
import { isRateLimited } from '@/lib/rate-limit'

const EXPIRES_IN_SECONDS = 15 * 60 // 15 minutes

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || 'unknown'
    if (isRateLimited(`pix-create:${ip}`, 8, 60_000)) {
      return NextResponse.json({ error: 'Muitas tentativas. Aguarde um instante e tente novamente.' }, { status: 429 })
    }

    const body = await req.json().catch(() => ({}))
    const email = String(body?.email ?? '').trim().toLowerCase()
    const phone = String(body?.phone ?? '').trim()
    const plan = String(body?.plan ?? '').trim().toLowerCase()

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: 'E-mail inválido.' }, { status: 400 })
    }
    const phoneDigits = phone.replace(/\D/g, '')
    if (phoneDigits.length < 10) {
      return NextResponse.json({ error: 'Telefone inválido.' }, { status: 400 })
    }
    const amountCents = PLAN_PRICES_CENTS[plan]
    if (!amountCents) {
      return NextResponse.json({ error: 'Plano inválido.' }, { status: 400 })
    }

    // Reuse an existing pending, not-yet-expired charge for the same
    // email+plan instead of spawning a new one on every click/retry.
    const existingPending = await prisma.pixPayment.findFirst({
      where: { email, plan, status: 'pending', expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    })
    if (existingPending) {
      return NextResponse.json({
        paymentId: existingPending.id,
        brCode: existingPending.brCode,
        brCodeBase64: existingPending.brCodeBase64,
        expiresAt: existingPending.expiresAt,
      })
    }

    const localId = `pix_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`
    const charge = await createPixCharge({
      amountCents,
      description: `EbookAI — Plano ${PLAN_LABELS[plan] ?? plan}`,
      expiresInSeconds: EXPIRES_IN_SECONDS,
      externalId: localId,
      metadata: { email, phone: phoneDigits, plan },
    })

    const payment = await prisma.pixPayment.create({
      data: {
        abacatePayId: charge.id,
        email,
        phone: phoneDigits,
        plan,
        amount: amountCents,
        status: 'pending',
        brCode: charge.brCode,
        brCodeBase64: charge.brCodeBase64,
        expiresAt: new Date(charge.expiresAt),
      },
    })

    return NextResponse.json({
      paymentId: payment.id,
      brCode: payment.brCode,
      brCodeBase64: payment.brCodeBase64,
      expiresAt: payment.expiresAt,
    })
  } catch (e) {
    console.error('PIX create error:', e)
    return NextResponse.json({ error: 'Erro ao gerar cobrança PIX.' }, { status: 500 })
  }
}
