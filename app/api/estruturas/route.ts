export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/session'
import { prisma } from '@/lib/db'

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  try {
    const structures = await prisma.structure.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        product: { select: { id: true, name: true, price: true, checkoutUrl: true } },
        landingPage: { select: { slug: true, publishedAt: true } },
      },
    })
    return NextResponse.json({ structures })
  } catch (e) {
    console.error('Erro ao listar estruturas:', e)
    return NextResponse.json({ error: 'Erro ao carregar suas estruturas. Tente novamente.' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const niche = String(body?.niche ?? '').trim()
  const subNiche = body?.subNiche ? String(body.subNiche).trim() : null
  const title = String(body?.title ?? '').trim()

  if (!niche) return NextResponse.json({ error: 'Escolha um nicho.' }, { status: 400 })
  if (!title) return NextResponse.json({ error: 'Escolha ou escreva a dor principal do seu público.' }, { status: 400 })
  if (title.length > 200) return NextResponse.json({ error: 'A dor principal deve ter no máximo 200 caracteres.' }, { status: 400 })

  try {
    const structure = await prisma.structure.create({
      data: { userId: user.id, niche, subNiche, title, status: 'rascunho' },
    })
    return NextResponse.json({ structure }, { status: 201 })
  } catch (e) {
    console.error('Erro ao criar estrutura:', e)
    return NextResponse.json({ error: 'Erro ao criar a estrutura. Tente novamente.' }, { status: 500 })
  }
}
