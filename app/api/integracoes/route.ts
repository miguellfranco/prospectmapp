export const dynamic = 'force-dynamic'
export const maxDuration = 30

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/session'
import { prisma } from '@/lib/db'
import { encryptJson } from '@/lib/crypto'
import { testConnection, type GatewayProvider } from '@/lib/gateways'

function publicShape(i: {
  id: string; provider: string; label: string | null; status: string
  statusMessage: string | null; lastCheckedAt: Date | null; createdAt: Date
}) {
  return {
    id: i.id,
    provider: i.provider,
    label: i.label,
    status: i.status,
    statusMessage: i.statusMessage,
    lastCheckedAt: i.lastCheckedAt,
    createdAt: i.createdAt,
    webhookPath: `/api/webhooks/vendas/${i.id}`,
  }
}

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  try {
    const integrations = await prisma.paymentIntegration.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ integrations: integrations.map(publicShape) })
  } catch (e) {
    console.error('Erro ao listar integrações:', e)
    return NextResponse.json({ error: 'Erro ao carregar integrações.' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const provider = String(body?.provider ?? '').toLowerCase() as GatewayProvider
  const label = body?.label ? String(body.label).trim().slice(0, 80) : null

  if (!['kiwify', 'hotmart', 'netlify', 'outro'].includes(provider)) {
    return NextResponse.json({ error: 'Provedor inválido. Use kiwify, hotmart, netlify ou outro.' }, { status: 400 })
  }

  const creds = {
    clientId: body?.clientId ? String(body.clientId).trim() : undefined,
    clientSecret: body?.clientSecret ? String(body.clientSecret).trim() : undefined,
    accountId: body?.accountId ? String(body.accountId).trim() : undefined,
    notes: body?.notes ? String(body.notes).trim().slice(0, 500) : undefined,
  }

  if (provider === 'netlify') {
    if (!creds.clientSecret) return NextResponse.json({ error: 'Informe o Personal Access Token da Netlify.' }, { status: 400 })
  } else if (provider !== 'outro' && (!creds.clientId || !creds.clientSecret)) {
    return NextResponse.json({ error: 'Informe Client ID e Client Secret.' }, { status: 400 })
  }

  // Valida as credenciais contra a API real do gateway antes de salvar
  const check = await testConnection(provider, creds)

  try {
    const integration = await prisma.paymentIntegration.create({
      data: {
        userId: user.id,
        provider,
        label,
        credentialsEnc: encryptJson(creds),
        status: check.ok ? 'conectado' : 'erro',
        statusMessage: check.message,
        lastCheckedAt: new Date(),
      },
    })
    return NextResponse.json({ integration: publicShape(integration), check }, { status: 201 })
  } catch (e) {
    console.error('Erro ao salvar integração:', e)
    return NextResponse.json({ error: 'Erro ao salvar a integração.' }, { status: 500 })
  }
}
