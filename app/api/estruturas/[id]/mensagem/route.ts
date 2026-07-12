export const dynamic = 'force-dynamic'
export const maxDuration = 30

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/session'
import { prisma } from '@/lib/db'
import { geminiGenerate } from '@/lib/gemini'
import { isRateLimited } from '@/lib/rate-limit'

// Passo 4 do wizard — gera a mensagem de divulgação com IA (regenerável).
// Copy honesta: apresenta o material em primeira pessoa como AUTOR/CRIADOR,
// sem depoimento forjado de "cliente satisfeito" e sem esconder que é uma oferta.
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  if (isRateLimited(`msg-outreach:${user.id}`, 10, 60_000)) {
    return NextResponse.json({ error: 'Muitas gerações em pouco tempo. Aguarde um instante.' }, { status: 429 })
  }

  const body = await req.json().catch(() => ({}))
  const variant = Number(body?.variant ?? 1)

  const structure = await prisma.structure.findFirst({
    where: { id: params.id, userId: user.id },
    include: { product: true, landingPage: true },
  })
  if (!structure) return NextResponse.json({ error: 'Estrutura não encontrada' }, { status: 404 })

  const baseUrl = process.env.NEXTAUTH_URL || ''
  const landingUrl = structure.landingPage ? `${baseUrl}/p/${structure.landingPage.slug}` : null

  const styles: Record<number, string> = {
    1: 'Comece com uma pergunta que toca na dor, depois apresente o material como algo que você criou para resolver exatamente isso.',
    2: 'Comece compartilhando 2-3 dicas rápidas e genuinamente úteis sobre o tema, e só então mencione que o guia completo está no link.',
    3: 'Tom direto e transparente: diga que você preparou um material sobre o tema, para quem ele serve e o que a pessoa vai encontrar nele.',
  }
  const style = styles[variant] ?? styles[1]

  const prompt = `Você escreve mensagens de divulgação para comunidades online (grupos de Facebook/WhatsApp) em português do Brasil.

PRODUTO: e-book "${structure.product?.name ?? structure.title}"
NICHO: ${structure.niche}${structure.subNiche ? ` / ${structure.subNiche}` : ''}
DOR QUE RESOLVE: ${structure.title}
${landingUrl ? `LINK DA PÁGINA: ${landingUrl}` : 'LINK DA PÁGINA: [SEU LINK AQUI]'}

ESTILO: ${style}

REGRAS OBRIGATÓRIAS:
- Fale em primeira pessoa como o CRIADOR do material — NUNCA finja ser um cliente ou invente resultados/depoimentos.
- Sem promessas irreais; desperte curiosidade pelos benefícios reais do conteúdo.
- Máximo 5 frases curtas + o link no final. Até 1 emoji natural.
- Formatação de WhatsApp: *negrito* em no máximo 2 palavras-chave.
- Responda APENAS com o texto pronto para copiar, sem aspas nem comentários.`

  try {
    const text = await geminiGenerate(prompt, { model: 'gemini-2.5-flash-lite', maxOutputTokens: 512, temperature: 0.9 })

    const message = await prisma.outreachMessage.create({
      data: { structureId: structure.id, generatedText: text.trim() },
    })

    return NextResponse.json({ message: { id: message.id, generatedText: message.generatedText } })
  } catch (e: any) {
    console.error('Erro ao gerar mensagem:', e)
    return NextResponse.json({ error: `Falha ao gerar a mensagem: ${e?.message ?? 'erro na IA'}` }, { status: 502 })
  }
}
