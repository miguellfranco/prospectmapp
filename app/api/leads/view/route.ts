export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/session'
import { prisma } from '@/lib/db'
import fs from 'fs'
import path from 'path'

const LOCAL_DB_PATH = path.join(process.cwd(), 'prisma', 'local_leads_fallback.json')

function getLocalLeads(userId: string) {
  try {
    if (fs.existsSync(LOCAL_DB_PATH)) {
      const data = JSON.parse(fs.readFileSync(LOCAL_DB_PATH, 'utf-8'))
      return data.filter((l: any) => l.userId === userId)
    }
  } catch {}
  return []
}

function updateLocalLeadStatus(leadId: string, status: string, viewed?: boolean) {
  try {
    if (fs.existsSync(LOCAL_DB_PATH)) {
      const data = JSON.parse(fs.readFileSync(LOCAL_DB_PATH, 'utf-8'))
      const lead = data.find((l: any) => l.id === leadId)
      if (lead) {
        lead.status = status
        if (viewed !== undefined) lead.viewed = viewed
        lead.updatedAt = new Date().toISOString()
        fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(data, null, 2), 'utf-8')
      }
    }
  } catch {}
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const body = await req.json().catch(() => ({}))
    const leadId = body?.leadId as string | undefined
    if (!leadId) return NextResponse.json({ error: 'Lead não informado' }, { status: 400 })

    let lead: any = null
    let isDbOffline = false
    try {
      lead = await prisma.lead.findFirst({
        where: { id: leadId, userId: user.id }
      })
    } catch (dbError) {
      console.warn('Database offline, looking up lead locally')
      isDbOffline = true
    }

    // Fallback if lead is not found in database (e.g. was generated locally during offline tests)
    if (!lead) {
      const localLeads = getLocalLeads(user.id)
      lead = localLeads.find((l: any) => l.id === leadId)
      if (lead) {
        isDbOffline = true
      }
    }

    // Fallback to request body parameter if lead is still null
    if (!lead && body?.lead) {
      lead = body.lead
    }

    if (!lead) return NextResponse.json({ error: 'Lead não encontrado' }, { status: 404 })

    // Se o lead já foi visualizado/aberto antes, não conta novamente!
    if (lead.viewed) {
      return NextResponse.json({ success: true, alreadyViewed: true })
    }

    // Limites diários de cliques (100 para todos os planos)
    const dailyLimit = 100
    
    // Se o banco estiver offline, marca localmente e ignora a validação restritiva do limite
    if (isDbOffline) {
      updateLocalLeadStatus(leadId, 'novo', true)
      return NextResponse.json({ success: true, alreadyViewed: false })
    }

    // Reset diário se passar da data
    const now = new Date()
    const startOfToday = new Date(now.setHours(0,0,0,0))
    
    let leadsUsed = user.leadsUsedToday
    
    if (user.leadsResetDate.getTime() < startOfToday.getTime()) {
      // Reseta o contador diário do usuário
      await prisma.user.update({
        where: { id: user.id },
        data: {
          leadsUsedToday: 0,
          leadsResetDate: new Date()
        }
      })
      leadsUsed = 0
    }

    if (leadsUsed >= dailyLimit) {
      return NextResponse.json(
        { error: `Limite diário atingido! Seu plano permite prospectar ${dailyLimit} leads por dia.` },
        { status: 403 }
      )
    }

    // Incrementa o contador do usuário e marca o lead como visto
    await prisma.$transaction([
      prisma.lead.update({
        where: { id: lead.id },
        data: { viewed: true }
      }),
      prisma.user.update({
        where: { id: user.id },
        data: { leadsUsedToday: { increment: 1 } }
      })
    ])

    return NextResponse.json({ success: true, alreadyViewed: false })
  } catch (e) {
    console.error('Lead View Error:', e)
    return NextResponse.json({ error: 'Erro ao registrar visualização' }, { status: 500 })
  }
}
