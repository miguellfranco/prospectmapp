export const dynamic = 'force-dynamic'
export const maxDuration = 30

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { createCardCheckout, getOrCreateProductId, PLAN_PRICES_CENTS } from '@/lib/abacatepay'
import { isRateLimited } from '@/lib/rate-limit'

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || 'unknown'
    if (isRateLimited(`card-create:${ip}`, 8, 60_000)) {
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

    // Produto do gateway resolvido automaticamente (env → conta → cria na hora)
    let productId: string | null = null
    try {
      productId = await getOrCreateProductId(plan)
    } catch (e) {
      console.error('Falha ao resolver produto no gateway:', e)
    }
    if (!productId) {
      return NextResponse.json({ error: 'Não foi possível preparar o produto no gateway. Tente novamente em instantes.' }, { status: 502 })
    }

    const siteUrl = process.env.NEXTAUTH_URL || 'https://extracted-olive.vercel.app'

    // Create the local record first (with a placeholder abacatePayId) so its
    // id can be embedded in completionUrl for the confirmation page to poll.
    const placeholder = `pending_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`
    const payment = await prisma.pixPayment.create({
      data: {
        abacatePayId: placeholder,
        method: 'CARD',
        email,
        phone: phoneDigits,
        plan,
        amount: amountCents,
        status: 'pending',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // hosted checkouts don't expire as fast as PIX QR codes
      },
    })

    const checkout = await createCardCheckout({
      productId,
      amountCents,
      externalId: payment.id,
      returnUrl: `${siteUrl}/`,
      completionUrl: `${siteUrl}/pagamento-confirmado?paymentId=${payment.id}`,
      metadata: { email, phone: phoneDigits, plan },
    })

    await prisma.pixPayment.update({
      where: { id: payment.id },
      data: { abacatePayId: checkout.id, checkoutUrl: checkout.url },
    })

    return NextResponse.json({ paymentId: payment.id, url: checkout.url })
  } catch (e) {
    console.error('Card checkout create error:', e)
    return NextResponse.json({ error: 'Erro ao gerar checkout de cartão.' }, { status: 500 })
  }
}
