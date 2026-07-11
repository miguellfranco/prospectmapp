export const dynamic = 'force-dynamic'
export const maxDuration = 30

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { checkPixStatus, checkCheckoutStatus } from '@/lib/abacatepay'
import { grantAccessForPayment } from '@/lib/grant-access'

export async function GET(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id obrigatório' }, { status: 400 })

    const payment = await prisma.pixPayment.findUnique({ where: { id } })
    if (!payment) return NextResponse.json({ error: 'Pagamento não encontrado' }, { status: 404 })

    if (payment.status === 'paid') {
      return NextResponse.json({ status: 'paid' })
    }

    // Webhook may not have arrived yet — cross-check directly with AbacatePay
    // as a fallback so the UI doesn't sit on "pending" longer than necessary.
    try {
      const liveStatus = payment.method === 'CARD'
        ? await checkCheckoutStatus(payment.abacatePayId)
        : await checkPixStatus(payment.abacatePayId)
      if (liveStatus === 'PAID' && payment.status !== 'paid') {
        await grantAccessForPayment(payment.id)
        return NextResponse.json({ status: 'paid' })
      }
      if (liveStatus === 'EXPIRED' || liveStatus === 'CANCELLED') {
        await prisma.pixPayment.update({ where: { id }, data: { status: liveStatus.toLowerCase() } })
        return NextResponse.json({ status: liveStatus.toLowerCase() })
      }
    } catch (checkError) {
      console.warn('AbacatePay status cross-check failed, returning local status:', checkError)
    }

    return NextResponse.json({ status: payment.status })
  } catch (e) {
    console.error('PIX status error:', e)
    return NextResponse.json({ error: 'Erro ao consultar status.' }, { status: 500 })
  }
}
