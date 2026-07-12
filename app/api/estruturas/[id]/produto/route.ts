export const dynamic = 'force-dynamic'
export const maxDuration = 30

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/session'
import { prisma } from '@/lib/db'
import { decryptJson } from '@/lib/crypto'
import { createProductOnGateway, type GatewayProvider } from '@/lib/gateways'

// Passo 2 do wizard — define preço e vincula o produto ao gateway de pagamento.
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const price = Number(body?.price)
  const paymentIntegrationId = body?.paymentIntegrationId ? String(body.paymentIntegrationId) : null
  const manualCheckoutUrl = body?.checkoutUrl ? String(body.checkoutUrl).trim() : null

  if (!Number.isFinite(price) || price < 1 || price > 100000) {
    return NextResponse.json({ error: 'Informe um preço válido (ex: 29,90).' }, { status: 400 })
  }
  if (manualCheckoutUrl && !/^https?:\/\//i.test(manualCheckoutUrl)) {
    return NextResponse.json({ error: 'O link de checkout precisa começar com http:// ou https://' }, { status: 400 })
  }

  const structure = await prisma.structure.findFirst({
    where: { id: params.id, userId: user.id },
    include: { product: true },
  })
  if (!structure) return NextResponse.json({ error: 'Estrutura não encontrada' }, { status: 404 })
  if (!structure.product) {
    return NextResponse.json({ error: 'Gere o e-book primeiro (Passo 1) antes de cadastrar o produto.' }, { status: 400 })
  }

  let gatewayMessage: string | null = null
  let externalProductId: string | null = structure.product.externalProductId
  let checkoutUrl: string | null = manualCheckoutUrl ?? structure.product.checkoutUrl

  // Tenta o cadastro automático no gateway — os adaptadores são honestos:
  // se a API pública do provedor não suportar criação de produto, retornam
  // supported=false com instruções, e o usuário cola o link de checkout.
  if (paymentIntegrationId) {
    const integration = await prisma.paymentIntegration.findFirst({
      where: { id: paymentIntegrationId, userId: user.id },
    })
    if (!integration) {
      return NextResponse.json({ error: 'Integração de pagamento não encontrada.' }, { status: 400 })
    }
    try {
      const creds = decryptJson(integration.credentialsEnc)
      const result = await createProductOnGateway(integration.provider as GatewayProvider, creds, {
        name: structure.product.name,
        priceReais: price,
      })
      gatewayMessage = result.message
      if (result.supported) {
        externalProductId = result.externalProductId ?? externalProductId
        checkoutUrl = result.checkoutUrl ?? checkoutUrl
      }
    } catch (e: any) {
      console.error('Erro no gateway:', e)
      gatewayMessage = `Não foi possível falar com o gateway: ${e?.message ?? 'erro'}`
    }
  }

  try {
    const product = await prisma.ebookProduct.update({
      where: { id: structure.product.id },
      data: {
        price,
        paymentIntegrationId,
        externalProductId,
        checkoutUrl,
      },
    })

    if (structure.status === 'conteudo_gerado' || structure.status === 'rascunho') {
      await prisma.structure.update({ where: { id: structure.id }, data: { status: 'precificado' } })
    }

    return NextResponse.json({
      product: {
        id: product.id,
        name: product.name,
        price: product.price,
        checkoutUrl: product.checkoutUrl,
        paymentIntegrationId: product.paymentIntegrationId,
      },
      gatewayMessage,
    })
  } catch (e) {
    console.error('Erro ao salvar produto:', e)
    return NextResponse.json({ error: 'Erro ao salvar o produto.' }, { status: 500 })
  }
}
