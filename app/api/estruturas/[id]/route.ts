export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/session'
import { prisma } from '@/lib/db'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  try {
    const structure = await prisma.structure.findFirst({
      where: { id: params.id, userId: user.id },
      include: {
        product: true,
        landingPage: true,
        outreachGroups: { orderBy: { createdAt: 'desc' } },
        outreachMessages: { orderBy: { createdAt: 'desc' }, take: 5 },
      },
    })
    if (!structure) return NextResponse.json({ error: 'Estrutura não encontrada' }, { status: 404 })
    return NextResponse.json({ structure })
  } catch (e) {
    console.error('Erro ao carregar estrutura:', e)
    return NextResponse.json({ error: 'Erro ao carregar a estrutura.' }, { status: 500 })
  }
}

const EDITABLE_STATUSES = ['rascunho', 'conteudo_gerado', 'precificado', 'landing_gerada', 'concluida']

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const body = await req.json().catch(() => ({}))

  try {
    const structure = await prisma.structure.findFirst({ where: { id: params.id, userId: user.id }, include: { product: true } })
    if (!structure) return NextResponse.json({ error: 'Estrutura não encontrada' }, { status: 404 })

    const data: Record<string, string> = {}
    if (typeof body?.title === 'string' && body.title.trim()) data.title = body.title.trim().slice(0, 200)
    if (typeof body?.status === 'string' && EDITABLE_STATUSES.includes(body.status)) data.status = body.status

    if (Object.keys(data).length) {
      await prisma.structure.update({ where: { id: structure.id }, data })
    }

    // Edição manual do conteúdo do e-book
    if (typeof body?.ebookContent === 'string' && structure.product) {
      await prisma.ebookProduct.update({
        where: { id: structure.product.id },
        data: { content: body.ebookContent },
      })
    }
    if (typeof body?.productName === 'string' && body.productName.trim() && structure.product) {
      await prisma.ebookProduct.update({
        where: { id: structure.product.id },
        data: { name: body.productName.trim().slice(0, 150) },
      })
    }
    // Cor de destaque do e-book (capa, capítulos, cards)
    if (typeof body?.ebookAccentColor === 'string' && /^#[0-9a-fA-F]{6}$/.test(body.ebookAccentColor) && structure.product) {
      await prisma.ebookProduct.update({
        where: { id: structure.product.id },
        data: { accentColor: body.ebookAccentColor },
      })
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('Erro ao atualizar estrutura:', e)
    return NextResponse.json({ error: 'Erro ao salvar as alterações.' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  try {
    const structure = await prisma.structure.findFirst({ where: { id: params.id, userId: user.id } })
    if (!structure) return NextResponse.json({ error: 'Estrutura não encontrada' }, { status: 404 })
    await prisma.structure.delete({ where: { id: structure.id } })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('Erro ao excluir estrutura:', e)
    return NextResponse.json({ error: 'Erro ao excluir a estrutura.' }, { status: 500 })
  }
}
