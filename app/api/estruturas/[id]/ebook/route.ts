export const dynamic = 'force-dynamic'
export const maxDuration = 60

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/session'
import { hasActiveAccess, NO_ACCESS_MSG } from '@/lib/plan'
import { prisma } from '@/lib/db'
import { geminiGenerate, parseJsonLoose } from '@/lib/gemini'
import { isValidEbookDesign, ebookDesignToMarkdown, type EbookDesign } from '@/lib/ebook-export'
import { isRateLimited } from '@/lib/rate-limit'

// Passo 1 do wizard — gera o e-book DESIGNADO (estrutura página por página,
// estilo Gamma) e salva o design + a versão texto no produto da estrutura.
export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  if (!hasActiveAccess(user)) return NextResponse.json({ error: NO_ACCESS_MSG }, { status: 403 })

  if (isRateLimited(`ebook-gen:${user.id}`, 5, 60_000)) {
    return NextResponse.json({ error: 'Muitas gerações em pouco tempo. Aguarde um instante.' }, { status: 429 })
  }

  const structure = await prisma.structure.findFirst({
    where: { id: params.id, userId: user.id },
    include: { product: true },
  })
  if (!structure) return NextResponse.json({ error: 'Estrutura não encontrada' }, { status: 404 })

  const prompt = `Você é um escritor profissional de infoprodutos e designer editorial, escrevendo em português do Brasil.

Crie um E-BOOK COMPLETO, página por página, sobre o nicho "${structure.niche}"${structure.subNiche ? ` (sub-nicho: "${structure.subNiche}")` : ''}, resolvendo especificamente esta dor do leitor: "${structure.title}".

Responda APENAS com JSON válido neste formato exato:
{
  "title": "título chamativo e específico do e-book (máx 80 caracteres)",
  "subtitle": "subtítulo de capa com a promessa concreta (1 frase)",
  "pages": [
    { "kind": "intro", "title": "...", "intro": "frase de abertura forte", "paragraphs": ["2-3 parágrafos: por que os métodos tradicionais falham + conexão emocional com quem vive essa dor"], "highlight": "frase de impacto para fechar a página" },
    { "kind": "chapter", "title": "Fase 1 — nome da fase", "intro": "o que é esta fase em 1 frase", "paragraphs": ["2 parágrafos desenvolvendo a fase"], "bullets": ["3-4 pontos-chave práticos da fase"] },
    { "kind": "chapter", "title": "Fase 2 — nome da fase", "intro": "...", "paragraphs": ["..."], "bullets": ["..."] },
    { "kind": "chapter", "title": "Fase 3 — nome da fase", "intro": "...", "paragraphs": ["..."], "bullets": ["..."] },
    { "kind": "steps", "title": "Passo a passo prático", "intro": "como aplicar hoje mesmo", "steps": [{ "title": "nome curto do passo", "text": "instrução acionável e específica" }] com 5-7 passos },
    { "kind": "checklist", "title": "Seu plano de ação diário", "intro": "marque conforme for cumprindo", "items": ["6-9 ações diárias/semanais curtas e específicas"] },
    { "kind": "bonus", "title": "Bônus — título do extra", "intro": "...", "paragraphs": ["1 parágrafo"], "bullets": ["4-6 itens do bônus: receitas, exercícios, scripts ou modelos — o que fizer sentido para o nicho"] },
    { "kind": "conclusion", "title": "...", "paragraphs": ["2 parágrafos motivacionais com próximo passo claro"], "highlight": "frase final memorável" }
  ]
}

REGRAS:
- Conteúdo COMPLETO e detalhado em cada página — nada de placeholder.
- Tom: mentor experiente, próximo e direto.
- Prometa apenas o que o conteúdo entrega; sem garantias irreais; quando relevante, recomende procurar um profissional.
- JSON puro, sem comentários nem texto fora do objeto.`

  try {
    // Até 2 tentativas caso a IA devolva JSON quebrado/incompleto
    let design: EbookDesign | null = null
    for (let attempt = 0; attempt < 2 && !design; attempt++) {
      const raw = await geminiGenerate(prompt, { maxOutputTokens: 8192, temperature: 0.85, json: true })
      try {
        const parsed = parseJsonLoose<EbookDesign>(raw)
        if (isValidEbookDesign(parsed)) design = parsed
        else console.error('Design de e-book incompleto (tentativa', attempt + 1, '):', raw.slice(0, 300))
      } catch {
        console.error('Design de e-book com JSON inválido (tentativa', attempt + 1, '):', raw.slice(0, 300))
      }
    }
    if (!design) {
      return NextResponse.json({ error: 'A IA retornou um formato inesperado duas vezes seguidas. Tente gerar novamente.' }, { status: 502 })
    }

    const productName = design.title.slice(0, 150)
    const designJson = JSON.stringify(design)
    const content = ebookDesignToMarkdown(design)

    // A capa ilustrada por IA é gerada à parte, num segundo request
    // (POST /ebook/cover), disparado pelo cliente só depois que este request
    // já respondeu com sucesso. Gerar imagem aqui dentro somava tempo à
    // geração de texto e estourava o limite de 60s da função (erro real visto
    // em produção: "Task timed out after 60 seconds").
    const product = structure.product
      ? await prisma.ebookProduct.update({
          where: { id: structure.product.id },
          data: { name: productName, content, designJson },
        })
      : await prisma.ebookProduct.create({
          data: { structureId: structure.id, name: productName, content, designJson },
        })

    if (structure.status === 'rascunho') {
      await prisma.structure.update({ where: { id: structure.id }, data: { status: 'conteudo_gerado' } })
    }

    return NextResponse.json({ product: { id: product.id, name: product.name, designJson: product.designJson } })
  } catch (e: any) {
    console.error('Erro ao gerar e-book:', e)
    return NextResponse.json({ error: `Falha ao gerar o e-book: ${e?.message ?? 'erro na IA'}` }, { status: 502 })
  }
}
