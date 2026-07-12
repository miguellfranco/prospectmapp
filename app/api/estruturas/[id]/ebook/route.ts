export const dynamic = 'force-dynamic'
export const maxDuration = 60

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/session'
import { prisma } from '@/lib/db'
import { geminiGenerate } from '@/lib/gemini'
import { isRateLimited } from '@/lib/rate-limit'

// Passo 1 do wizard — gera o e-book completo com IA e salva no produto da estrutura.
export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  if (isRateLimited(`ebook-gen:${user.id}`, 5, 60_000)) {
    return NextResponse.json({ error: 'Muitas gerações em pouco tempo. Aguarde um instante.' }, { status: 429 })
  }

  const structure = await prisma.structure.findFirst({
    where: { id: params.id, userId: user.id },
    include: { product: true },
  })
  if (!structure) return NextResponse.json({ error: 'Estrutura não encontrada' }, { status: 404 })

  const prompt = `Você é um escritor profissional de infoprodutos digitais em português do Brasil.

Escreva um E-BOOK COMPLETO (equivalente a 8-10 páginas) sobre o nicho "${structure.niche}"${structure.subNiche ? ` (sub-nicho: "${structure.subNiche}")` : ''}, resolvendo especificamente esta dor do leitor: "${structure.title}".

ESTRUTURA OBRIGATÓRIA (em markdown):
# [Título chamativo e específico do e-book — primeira linha do documento]

## Introdução
Por que os métodos tradicionais falham para esse problema; conexão emocional com o leitor que vive essa dor.

## O Método em Fases
Um plano dividido em 3-4 fases claras e nomeadas, explicando o que acontece em cada fase e por quê.

## Passo a Passo Prático
Instruções acionáveis, numeradas, que o leitor consegue aplicar hoje mesmo.

## Plano de Ação Diário
Checklist de ações diárias/semanais (lista com marcadores).

## Bônus
Conteúdo extra relevante para o nicho (receitas, exercícios, scripts, modelos ou tabelas — o que fizer sentido para "${structure.niche}").

## Conclusão
Fechamento motivacional com próximo passo claro.

REGRAS:
- Escreva o conteúdo COMPLETO de cada seção, não apenas tópicos. Parágrafos desenvolvidos + listas onde ajudar.
- Tom: próximo, encorajador e direto, como um mentor experiente.
- Prometa apenas o que o conteúdo entrega — nada de garantias irreais ("perca 10kg em 1 semana"), nada de conselho médico/financeiro que exija profissional habilitado; quando relevante, recomende procurar um profissional.
- Responda APENAS com o markdown do e-book, sem comentários antes ou depois.`

  try {
    const content = await geminiGenerate(prompt, { maxOutputTokens: 8192, temperature: 0.85 })

    // Primeira linha "# Título" vira o nome do produto
    const firstHeading = content.match(/^#\s+(.+)$/m)?.[1]?.trim()
    const productName = (firstHeading || structure.title).slice(0, 150)

    const product = structure.product
      ? await prisma.ebookProduct.update({
          where: { id: structure.product.id },
          data: { name: productName, content },
        })
      : await prisma.ebookProduct.create({
          data: { structureId: structure.id, name: productName, content },
        })

    if (structure.status === 'rascunho') {
      await prisma.structure.update({ where: { id: structure.id }, data: { status: 'conteudo_gerado' } })
    }

    return NextResponse.json({ product: { id: product.id, name: product.name, content: product.content } })
  } catch (e: any) {
    console.error('Erro ao gerar e-book:', e)
    return NextResponse.json({ error: `Falha ao gerar o e-book: ${e?.message ?? 'erro na IA'}` }, { status: 502 })
  }
}
