export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/session'
import { prisma } from '@/lib/db'
import fs from 'fs'
import path from 'path'

const LOCAL_DB_PATH = path.join(process.cwd(), 'prisma', 'local_leads_fallback.json')

function getLocalLeads(userId: string) {
  try {
    if (fs.existsSync(LOCAL_DB_PATH)) {
      const data = JSON.parse(fs.readFileSync(LOCAL_DB_PATH, 'utf-8'))
      return data.filter((l: any) => l.userId === userId)
    }
  } catch {}
  return []
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const body = await req.json().catch(() => ({}))
    const leadId = body?.leadId as string | undefined
    if (!leadId) return NextResponse.json({ error: 'Lead não informado' }, { status: 400 })

    let lead: any = null
    try {
      lead = await prisma.lead.findFirst({
        where: { id: leadId, userId: user.id }
      })
    } catch (dbError) {
      console.warn('Database offline, looking up lead locally for analysis')
    }

    // Fallback if lead is not found in database (e.g. was generated locally during offline tests)
    if (!lead) {
      const localLeads = getLocalLeads(user.id)
      lead = localLeads.find((l: any) => l.id === leadId)
    }

    // Fallback to request body parameter if lead is still null
    if (!lead && body?.lead) {
      lead = body.lead
    }

    if (!lead) return NextResponse.json({ error: 'Lead não encontrado' }, { status: 404 })

    const prompt = `Você é um consultor especialista em marketing digital e vendas para pequenas empresas no Brasil.
Analise a presença digital do negócio abaixo e elabore um plano prático de serviços digitais que podem ser oferecidos a eles.

INFORMAÇÕES DO NEGÓCIO:
- Nome: ${lead.businessName}
- Nicho: ${lead.niche}
- Cidade: ${lead.city}
- Avaliação no Google Maps: ${lead.rating ?? 'N/A'} estrelas (${lead.reviewCount ?? 0} avaliações)
- Presença Digital Atual:
  * Website próprio: ${lead.hasWebsite ? 'Sim' : 'Não tem site'} ${lead.hasWebsite ? '' : `(há ${lead.yearsWithoutSite ?? 'alguns'} anos sem site)`}
  * Está nas primeiras posições do Google: ${lead.inTopGoogle ? 'Sim' : 'Não'}
  * Ficha do Google Meu Negócio Otimizada: ${lead.gmbOptimized ? 'Sim' : 'Não'}
  * Conta do Instagram cadastrada: ${lead.instagramUrl ? 'Sim' : 'Não'}

INSTRUÇÕES OBRIGATÓRIAS:
1. Identifique 2 a 3 problemas críticos na presença digital deles com base nos dados.
2. Sugira 2 a 3 soluções comerciais exatas que o usuário do SaaS pode vender para eles (ex: criação de landing page moderna se não tiver site, otimização completa do Google Meu Negócio se a ficha for ruim/não otimizada, ou campanhas de tráfego se já tiver site mas não estiver no topo).
3. Use um tom comercial, persuasivo, de especialista em negócios.
4. NUNCA cite que isso foi feito por Inteligência Actor / IA / LLM.
5. Escreva de forma curta e direta, formatado em markdown com espaçamentos, com títulos limpos e emojis. Máximo de 250 palavras.

Gere apenas o texto da proposta/análise pronta.`

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 600 },
        }),
      }
    )

    if (!response.ok) {
      const errorText = await response.text().catch(() => '')
      console.error('LLM API Error:', response.status, errorText)
      return NextResponse.json({ error: 'Erro ao gerar análise na API de IA.' }, { status: 502 })
    }

    const data = await response.json()
    const analysis = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Não foi possível gerar a análise deste lead.'

    return NextResponse.json({ analysis })
  } catch (e) {
    console.error('Audit API Error:', e)
    return NextResponse.json({ error: 'Erro interno ao processar auditoria.' }, { status: 500 })
  }
}
