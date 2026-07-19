export const dynamic = 'force-dynamic'
export const maxDuration = 30

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { caktoConfigured, getCaktoOrder, mapCaktoPlan } from '@/lib/cakto'
import { grantPlanByEmail } from '@/lib/grant-access'

// Eventos da Cakto que representam dinheiro entrando e devem ativar/renovar acesso.
const GRANT_EVENTS = new Set(['purchase_approved', 'subscription_created', 'subscription_renewed'])

// Status da Cakto que consideramos "pago de verdade" ao reconfirmar na API.
const PAID_STATUSES = new Set(['paid', 'authorized'])

// Health check simples: abrir a URL no navegador mostra se as credenciais
// estão configuradas (não expõe nenhum dado).
export async function GET() {
  return NextResponse.json({ ok: true, caktoConfigured: caktoConfigured() })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null)
    if (!body) return NextResponse.json({ ok: true })

    // A Cakto inclui o secret do webhook no corpo. Se o dono configurou
    // CAKTO_WEBHOOK_SECRET na Vercel, exigimos que bata. Mesmo sem isso o
    // fluxo é seguro: nunca confiamos no corpo do webhook — toda venda é
    // reconfirmada na API da Cakto com as nossas credenciais antes de
    // qualquer ativação.
    const expectedSecret = process.env.CAKTO_WEBHOOK_SECRET
    const receivedSecret = body?.secret ?? body?.data?.secret
    if (expectedSecret && receivedSecret !== expectedSecret) {
      console.warn('Cakto webhook: secret divergente, ignorando')
      return NextResponse.json({ ok: true })
    }

    const event: string = String(body?.event ?? body?.type ?? '').toLowerCase()
    const data = body?.data ?? body
    const orderId: string | undefined = data?.id ?? data?.order?.id ?? data?.order_id ?? body?.id

    if (!orderId || !GRANT_EVENTS.has(event)) {
      return NextResponse.json({ ok: true })
    }

    const orderIdStr = String(orderId)

    // Idempotência: se já ativamos essa venda, não faz nada.
    const existing = await prisma.caktoSale.findUnique({ where: { caktoOrderId: orderIdStr } })
    if (existing?.accessGrantedAt) {
      return NextResponse.json({ ok: true })
    }

    // Reconfirma a venda direto na API da Cakto (fonte da verdade).
    const order = await getCaktoOrder(orderIdStr)
    if (!order) {
      console.warn(`Cakto webhook: pedido ${orderIdStr} não encontrado na API, ignorando`)
      return NextResponse.json({ ok: true })
    }
    if (!PAID_STATUSES.has(order.status)) {
      console.warn(`Cakto webhook: pedido ${orderIdStr} com status "${order.status}" (não pago), ignorando`)
      return NextResponse.json({ ok: true })
    }

    // E-mail: preferimos o da API; caso o escopo não devolva, usamos o do webhook.
    const email: string | undefined = order.customerEmail ?? data?.customer?.email ?? data?.email
    if (!email || !email.includes('@')) {
      console.error(`Cakto webhook: pedido ${orderIdStr} pago mas sem e-mail do cliente — impossível ativar. Verifique o escopo de acesso das credenciais da API.`)
      await prisma.caktoSale.upsert({
        where: { caktoOrderId: orderIdStr },
        update: { status: 'pending' },
        create: { caktoOrderId: orderIdStr, event, email: '', plan: '', productName: order.productName, status: 'pending' },
      })
      return NextResponse.json({ ok: true })
    }

    const productName = order.productName ?? data?.product?.name ?? null
    const rawAmount = order.amount ?? data?.amount ?? null
    const plan = mapCaktoPlan(productName, rawAmount)
    if (!plan) {
      console.error(`Cakto webhook: pedido ${orderIdStr} pago mas não deu para identificar o plano (produto: "${productName}", valor: ${rawAmount}). O nome do produto na Cakto precisa conter Mensal, Trimestral ou Vitalício.`)
      await prisma.caktoSale.upsert({
        where: { caktoOrderId: orderIdStr },
        update: { status: 'pending', email },
        create: { caktoOrderId: orderIdStr, event, email, plan: '', productName, status: 'pending' },
      })
      return NextResponse.json({ ok: true })
    }

    const amountCents = typeof rawAmount === 'number'
      ? Math.round(rawAmount >= 1000 ? rawAmount : rawAmount * 100)
      : null

    await prisma.caktoSale.upsert({
      where: { caktoOrderId: orderIdStr },
      update: { event, email, plan, productName, amount: amountCents },
      create: { caktoOrderId: orderIdStr, event, email, plan, productName, amount: amountCents },
    })

    await grantPlanByEmail({ email, plan, phone: order.customerPhone, name: order.customerName })

    await prisma.caktoSale.update({
      where: { caktoOrderId: orderIdStr },
      data: { status: 'granted', accessGrantedAt: new Date() },
    })

    console.log(`Cakto webhook: pedido ${orderIdStr} → plano ${plan} ativado para ${email}`)
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('Cakto webhook error:', e)
    return NextResponse.json({ ok: true }) // sempre 200 — evita tempestade de retries em cima de bug nosso
  }
}
