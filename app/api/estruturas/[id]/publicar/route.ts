export const dynamic = 'force-dynamic'
export const maxDuration = 60

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/session'
import { hasActiveAccess, NO_ACCESS_MSG } from '@/lib/plan'
import { prisma } from '@/lib/db'
import { decryptJson } from '@/lib/crypto'
import { deployToNetlify } from '@/lib/netlify'
import { buildLandingHtml } from '@/lib/landing-export'

// Publica a landing page na conta Netlify DO USUÁRIO com 1 clique (usa a
// integração "netlify" conectada em Integrações). Hospedagem e tráfego ficam
// 100% na conta dele — custo zero para a plataforma.
export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  if (!hasActiveAccess(user)) return NextResponse.json({ error: NO_ACCESS_MSG }, { status: 403 })

  const structure = await prisma.structure.findFirst({
    where: { id: params.id, userId: user.id },
    include: { product: true, landingPage: true },
  })
  if (!structure) return NextResponse.json({ error: 'Estrutura não encontrada' }, { status: 404 })
  if (!structure.landingPage) {
    return NextResponse.json({ error: 'Gere a página de vendas primeiro.' }, { status: 400 })
  }

  const integration = await prisma.paymentIntegration.findFirst({
    where: { userId: user.id, provider: 'netlify', status: 'conectado' },
    orderBy: { createdAt: 'desc' },
  })
  if (!integration) {
    return NextResponse.json(
      { error: 'Conecte sua conta Netlify em Integrações para publicar com 1 clique — ou baixe o arquivo e hospede manualmente.' },
      { status: 400 },
    )
  }

  try {
    const creds = decryptJson(integration.credentialsEnc)
    const token = creds.clientSecret
    if (!token) return NextResponse.json({ error: 'Token da Netlify não encontrado. Reconecte a integração.' }, { status: 400 })

    const lp = structure.landingPage
    let copy: any = { headline: lp.headline }
    try { copy = { ...copy, ...JSON.parse(lp.copyJson) } } catch { /* segue com headline */ }

    const html = buildLandingHtml({
      productName: structure.product?.name ?? structure.title,
      priceDisplay: lp.priceDisplay,
      checkoutUrl: structure.product?.checkoutUrl ?? null,
      primaryColor: lp.primaryColor,
      secondaryColor: lp.secondaryColor,
      niche: structure.niche,
      coverImageDataUri: structure.product?.coverImageDataUri,
      copy,
    })

    const result = await deployToNetlify(token, lp.netlifySiteId, html)

    await prisma.landingPage.update({
      where: { id: lp.id },
      data: { netlifySiteId: result.siteId, userHostedUrl: result.url },
    })

    return NextResponse.json({ url: result.url })
  } catch (e: any) {
    console.error('Erro ao publicar na Netlify:', e)
    return NextResponse.json({ error: `Falha ao publicar: ${e?.message ?? 'erro na Netlify'}` }, { status: 502 })
  }
}
