export const dynamic = 'force-dynamic'
export const maxDuration = 30

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// Webhook de vendas dos gateways (Kiwify / Hotmart / genérico).
// O usuário cadastra esta URL no painel do gateway; o id da integração (cuid
// não enumerável) funciona como segredo do endpoint. Só registramos vendas
// claramente PAGAS — nunca criamos vendas sintéticas.

interface ParsedSale {
  amount: number // em reais
  transactionId: string
  buyerEmail: string | null
  productName: string | null
}

function parseKiwify(body: any): ParsedSale | null {
  const status = String(body?.order_status ?? body?.status ?? '').toLowerCase()
  const event = String(body?.webhook_event_type ?? '').toLowerCase()
  const isPaid = status === 'paid' || status === 'approved' || event === 'order_approved'
  if (!isPaid) return null

  const cents = Number(body?.Commissions?.charge_amount ?? body?.charge_amount ?? NaN)
  const amount = Number.isFinite(cents) ? cents / 100 : NaN
  const transactionId = String(body?.order_id ?? body?.order_ref ?? '')
  if (!Number.isFinite(amount) || amount <= 0 || !transactionId) return null

  return {
    amount,
    transactionId: `kiwify_${transactionId}`,
    buyerEmail: body?.Customer?.email ?? null,
    productName: body?.Product?.product_name ?? null,
  }
}

function parseHotmart(body: any): ParsedSale | null {
  const event = String(body?.event ?? '').toUpperCase()
  if (event !== 'PURCHASE_APPROVED' && event !== 'PURCHASE_COMPLETE') return null

  const amount = Number(body?.data?.purchase?.price?.value ?? NaN)
  const transactionId = String(body?.data?.purchase?.transaction ?? '')
  if (!Number.isFinite(amount) || amount <= 0 || !transactionId) return null

  return {
    amount,
    transactionId: `hotmart_${transactionId}`,
    buyerEmail: body?.data?.buyer?.email ?? null,
    productName: body?.data?.product?.name ?? null,
  }
}

function parseGeneric(body: any): ParsedSale | null {
  const status = String(body?.status ?? '').toLowerCase()
  if (status && !['paid', 'approved', 'completed'].includes(status)) return null
  const amount = Number(body?.amount ?? NaN)
  const transactionId = String(body?.transaction_id ?? body?.id ?? '')
  if (!Number.isFinite(amount) || amount <= 0 || !transactionId) return null
  return {
    amount,
    transactionId: `generic_${transactionId}`,
    buyerEmail: body?.email ?? null,
    productName: body?.product_name ?? null,
  }
}

export async function POST(req: NextRequest, { params }: { params: { integrationId: string } }) {
  try {
    const integration = await prisma.paymentIntegration.findUnique({
      where: { id: params.integrationId },
    })
    if (!integration) return NextResponse.json({ error: 'unknown endpoint' }, { status: 404 })

    const body = await req.json().catch(() => null)
    if (!body) return NextResponse.json({ received: true, recorded: false, reason: 'corpo inválido' })

    let sale: ParsedSale | null = null
    if (integration.provider === 'kiwify') sale = parseKiwify(body)
    else if (integration.provider === 'hotmart') sale = parseHotmart(body)
    else sale = parseGeneric(body) ?? parseKiwify(body) ?? parseHotmart(body)

    if (!sale) {
      // Evento que não é venda paga (boleto gerado, reembolso, etc.) — confirma
      // o recebimento sem registrar nada.
      return NextResponse.json({ received: true, recorded: false })
    }

    // Idempotência: o mesmo webhook pode ser reenviado pelo gateway
    const existing = await prisma.infoproductSale.findUnique({
      where: { gatewayTransactionId: sale.transactionId },
    })
    if (existing) return NextResponse.json({ received: true, recorded: false, reason: 'duplicada' })

    // Tenta vincular ao produto pelo nome (melhor esforço)
    let productId: string | null = null
    if (sale.productName) {
      const match = await prisma.ebookProduct.findFirst({
        where: {
          name: { equals: sale.productName, mode: 'insensitive' },
          structure: { userId: integration.userId },
        },
      })
      productId = match?.id ?? null
    }

    await prisma.infoproductSale.create({
      data: {
        userId: integration.userId,
        productId,
        paymentIntegrationId: integration.id,
        amount: sale.amount,
        gateway: integration.provider,
        gatewayTransactionId: sale.transactionId,
        buyerEmail: sale.buyerEmail,
        paidAt: new Date(),
      },
    })

    return NextResponse.json({ received: true, recorded: true })
  } catch (e) {
    console.error('Erro no webhook de vendas:', e)
    return NextResponse.json({ error: 'internal error' }, { status: 500 })
  }
}
