export const dynamic = 'force-dynamic'
export const maxDuration = 30

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/session'
import { prisma } from '@/lib/db'
import { decryptJson } from '@/lib/crypto'
import { testConnection, type GatewayProvider } from '@/lib/gateways'

// POST { action: 'test' } — revalida a conexão com o gateway
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  if (body?.action !== 'test') {
    return NextResponse.json({ error: 'Ação inválida.' }, { status: 400 })
  }

  const integration = await prisma.paymentIntegration.findFirst({
    where: { id: params.id, userId: user.id },
  })
  if (!integration) return NextResponse.json({ error: 'Integração não encontrada' }, { status: 404 })

  try {
    const creds = decryptJson(integration.credentialsEnc)
    const check = await testConnection(integration.provider as GatewayProvider, creds)
    const updated = await prisma.paymentIntegration.update({
      where: { id: integration.id },
      data: {
        status: check.ok ? 'conectado' : 'erro',
        statusMessage: check.message,
        lastCheckedAt: new Date(),
      },
    })
    return NextResponse.json({ status: updated.status, message: check.message })
  } catch (e: any) {
    console.error('Erro ao testar integração:', e)
    return NextResponse.json({ error: `Erro ao testar a conexão: ${e?.message ?? 'erro'}` }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  try {
    const integration = await prisma.paymentIntegration.findFirst({
      where: { id: params.id, userId: user.id },
    })
    if (!integration) return NextResponse.json({ error: 'Integração não encontrada' }, { status: 404 })
    await prisma.paymentIntegration.delete({ where: { id: integration.id } })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('Erro ao remover integração:', e)
    return NextResponse.json({ error: 'Erro ao remover a integração.' }, { status: 500 })
  }
}
