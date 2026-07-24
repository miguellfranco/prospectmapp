export const dynamic = 'force-dynamic'
export const maxDuration = 60

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/session'
import { hasActiveAccess, NO_ACCESS_MSG } from '@/lib/plan'
import { prisma } from '@/lib/db'
import { geminiGenerateImage } from '@/lib/gemini'
import { isRateLimited } from '@/lib/rate-limit'

// Capa ilustrada por IA — separada de /ebook de propósito (ver comentário lá).
// É um extra visual best-effort: se a IA falhar ou estourar quota, devolve
// coverImageDataUri: null com status 200 (não é um erro de verdade — o e-book
// já existe e usa o ícone do nicho como capa nesse caso).
export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  if (!hasActiveAccess(user)) return NextResponse.json({ error: NO_ACCESS_MSG }, { status: 403 })

  if (isRateLimited(`ebook-cover-gen:${user.id}`, 5, 60_000)) {
    return NextResponse.json({ error: 'Muitas gerações em pouco tempo. Aguarde um instante.' }, { status: 429 })
  }

  const structure = await prisma.structure.findFirst({
    where: { id: params.id, userId: user.id },
    include: { product: true },
  })
  if (!structure) return NextResponse.json({ error: 'Estrutura não encontrada' }, { status: 404 })
  if (!structure.product) return NextResponse.json({ error: 'Gere o e-book antes de gerar a capa.' }, { status: 400 })

  const coverPrompt = `Ilustração de capa de e-book digital sobre "${structure.niche}"${structure.subNiche ? `, especificamente: "${structure.subNiche}"` : ''}. Estilo flat design moderno, minimalista e editorial premium — elegante e comercial, SEM realismo fotográfico e SEM estilo cinematográfico dramático. Paleta de cores predominantemente roxo (#7c3aed) sobre fundo escuro/preto, com destaques claros. Composição limpa com bastante espaço negativo. IMPORTANTE: não inclua nenhum texto, letra, número, palavra ou marca d'água na imagem — apenas elementos gráficos/ilustração.`
  const cover = await geminiGenerateImage(coverPrompt)
  const coverImageDataUri = cover ? `data:${cover.mimeType};base64,${cover.base64}` : null

  if (coverImageDataUri) {
    await prisma.ebookProduct.update({ where: { id: structure.product.id }, data: { coverImageDataUri } })
  }

  return NextResponse.json({ coverImageDataUri })
}
