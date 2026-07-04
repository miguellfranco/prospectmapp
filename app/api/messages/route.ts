export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/session'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    let messages: any[] = []
    try {
      messages = await prisma.message.findMany({
        where: { userId: user.id },
        orderBy: { generatedAt: 'desc' },
        include: { lead: { select: { businessName: true, phone: true, niche: true, city: true, tier: true } } },
      })
    } catch (dbError) {
      console.warn('Database offline, using empty array for GET /api/messages')
    }

    return NextResponse.json({
      messages: messages.map((m) => ({
        id: m.id,
        messageText: m.messageText,
        generatedAt: m.generatedAt.toISOString(),
        sentAt: m.sentAt ? m.sentAt.toISOString() : null,
        lead: m.lead
          ? { businessName: m.lead.businessName, phone: m.lead.phone, niche: m.lead.niche, city: m.lead.city, tier: m.lead.tier }
          : null,
      })),
    })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Erro' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const { leadId, status, saleValue } = await req.json().catch(() => ({}))
    if (!leadId || !status) {
      return NextResponse.json({ error: 'Parâmetros inválidos' }, { status: 400 })
    }

    const lead = await prisma.lead.findFirst({
      where: { id: leadId, userId: user.id }
    })

    if (!lead) {
      return NextResponse.json({ error: 'Lead não encontrado' }, { status: 404 })
    }

    const updatedLead = await prisma.lead.update({
      where: { id: leadId },
      data: { status }
    })

    if (status === 'venda_fechada') {
      const existingSale = await prisma.sale.findFirst({
        where: { userId: user.id, leadId }
      })

      if (!existingSale) {
        const parsedSaleValue = parseFloat(saleValue) || 500.0
        await prisma.sale.create({
          data: {
            userId: user.id,
            leadId: lead.id,
            niche: lead.niche,
            city: lead.city,
            clientName: lead.businessName,
            saleValue: parsedSaleValue,
            description: `Venda fechada para ${lead.businessName}`
          }
        })
      }
    }

    return NextResponse.json({ success: true, lead: updatedLead })
  } catch (e) {
    console.error('Error updating lead status in POST /api/messages:', e)
    return NextResponse.json({ error: 'Erro ao atualizar status' }, { status: 500 })
  }
}
