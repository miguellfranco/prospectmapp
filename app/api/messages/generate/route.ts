export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
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

function updateLocalLeadStatus(leadId: string, status: string, viewed?: boolean) {
  try {
    if (fs.existsSync(LOCAL_DB_PATH)) {
      const data = JSON.parse(fs.readFileSync(LOCAL_DB_PATH, 'utf-8'))
      const lead = data.find((l: any) => l.id === leadId)
      if (lead) {
        lead.status = status
        if (viewed !== undefined) lead.viewed = viewed
        lead.updatedAt = new Date().toISOString()
        fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(data, null, 2), 'utf-8')
      }
    }
  } catch {}
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return new Response(JSON.stringify({ error: 'Não autenticado' }), { status: 401 })

  const body = await req.json().catch(() => ({}))
  const leadId = body?.leadId as string | undefined
  const tone = String(body?.tone ?? 'casual').toLowerCase() // casual | profissional | direto
  const variant = Number(body?.variant ?? 1)
  const service = String(body?.service ?? 'site').toLowerCase() // site | gmb | trafego | instagram

  if (!leadId) return new Response(JSON.stringify({ error: 'Lead não informado' }), { status: 400 })

  let lead: any = null
  let isDbOffline = false
  try {
    lead = await prisma.lead.findFirst({ where: { id: leadId, userId: user.id } })
  } catch (dbError) {
    console.warn('Database offline, looking up lead locally for message generation')
    isDbOffline = true
  }

  // Fallback if lead is not found in database (e.g. was generated locally during offline tests)
  if (!lead) {
    const localLeads = getLocalLeads(user.id)
    lead = localLeads.find((l: any) => l.id === leadId)
    if (lead) {
      isDbOffline = true
    }
  }

  // Fallback to request body parameter if lead is still null
  if (!lead && body?.lead) {
    lead = body.lead
  }

  if (!lead) return new Response(JSON.stringify({ error: 'Lead não encontrado' }), { status: 404 })

  let toneInstruction = ""
  if (tone === 'profissional') {
    toneInstruction = "Use um tom formal, profissional, sério e corporativo. Transmita credibilidade e fale de valor comercial, autoridade digital e resultados."
  } else if (tone === 'direto') {
    toneInstruction = "Use um tom altamente objetivo, curto e focado. Perfeito para empresários muito ocupados. Limite-se a no máximo 2 frases rápidas."
  } else {
    toneInstruction = "Use um tom leve, casual, próximo e amigável. Comece com expressões comuns como 'Oi, tudo bem? 👋' ou 'Olá!'. Fale como um parceiro local e humano."
  }

  let serviceInstruction = ""
  if (service === 'gmb') {
    serviceInstruction = "Foque em oferecer serviços de OTIMIZAÇÃO DO GOOGLE MEU NEGÓCIO / GOOGLE MAPS. Diga que percebeu falhas no posicionamento local deles no Google ou que eles têm poucas avaliações/ficha não otimizada, e que isso está fazendo com que eles percam clientes locais para a concorrência diariamente."
  } else if (service === 'trafego') {
    serviceInstruction = "Foque em oferecer serviços de TRÁFEGO PAGO (Anúncios Patrocinados no Instagram, Facebook ou Google Ads). Diga que eles podem atrair dezenas de novos clientes todas as semanas fazendo anúncios locais direcionados para quem já está procurando pelo serviço deles na região."
  } else if (service === 'instagram') {
    serviceInstruction = "Foque em oferecer serviços de GESTÃO DE REDES SOCIAIS / INSTAGRAM. Comente que percebeu que o Instagram deles pode ser mais atraente, com publicações e vídeos (Reels) profissionais para atrair mais seguidores e clientes locais interessados no que eles vendem."
  } else {
    // Default or 'site'
    serviceInstruction = "Foque em oferecer a CRIAÇÃO DE UM SITE PROFISSIONAL OU LANDING PAGE. Diga que percebeu que eles não possuem um site otimizado ou profissional para receber clientes e que ter uma página de alta conversão traria muito mais credibilidade e faturamento direto para o negócio deles."
  }

  const prompt = `Você é um Copywriter de elite e especialista em prospecção fria via WhatsApp para pequenos negócios locais no Brasil.
Seu objetivo é escrever uma mensagem de abertura comercial altamente persuasiva, natural, amigável e extremamente humanizada (que pareça digitada por uma pessoa no celular, não por robô) e impossível de ser ignorada.

DADOS DO ESTABELECIMENTO:
- Nome da Empresa: ${lead.businessName}
- Nicho/Ramo: ${lead.niche ?? 'Negócio local'}
- Localização: ${lead.city ?? 'Brasil'}
- Avaliação Google Maps: ${lead.rating ?? 'N/A'} estrelas (${lead.reviewCount ?? 0} avaliações)
- Presença Online: ${lead.hasWebsite ? 'Já possui website' : 'Não possui site comercial'}

DIRETRIZES DA ABORDAGEM:
1. ${toneInstruction}
2. ${serviceInstruction}
3. VARIAÇÃO DE COPY (Variação ${variant} de 5): 
   - Variação 1: Pergunta direta baseada em uma observação sincera de melhoria no nicho deles.
   - Variação 2: Elogio sincero ao trabalho deles no Maps/Redes, seguido de um gancho rápido de otimização comercial.
   - Variação 3: Abordagem focada em trazer mais clientes locais da concorrência direta na região deles.
   - Variação 4: Curiosidade rápida, propondo mostrar um detalhe rápido/auditoria grátis que você fez da empresa deles.
   - Variação 5: Foco em conversão direta de clientes perdidos por falta de otimização/canal digital na cidade deles.
4. FORMATAÇÃO WHATSAPP:
   - Use formatação do WhatsApp como *negrito* estrategicamente em 1 ou 2 palavras-chave importantes (ex: *site próprio*, *posicionamento*, *novos clientes*, *Google Maps*).
   - Use parágrafos curtos ou espaçamento se necessário, mas mantenha a mensagem compacta (máximo 4 frases).
   - Use no máximo 1 emoji muito natural (evite emojis corporativos como 🚀 ou 📊; prefira algo amigável como 👋, 👍 ou 😊).
5. REGRAS CRÍTICAS:
   - NUNCA use clichês de vendas como "Sou da empresa X", "Gostaria de apresentar meus serviços", "Temos a solução ideal para o seu negócio".
   - Comece de forma casual, simpática e direta ao ponto, como se estivesse mandando mensagem para um parceiro de negócios local.
   - Termine com uma pergunta simples de resposta rápida (Sim/Não), com baixíssimo atrito de resposta.
   - Escreva EXCLUSIVAMENTE o texto da mensagem comercial pronta para copiar e enviar, sem aspas, explicações de IA, observações ou tags.`

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 400 },
        }),
      }
    )

    if (!response.ok) {
      const t = await response.text().catch(() => '')
      console.error('LLM error', response.status, t)
      return new Response(JSON.stringify({ error: 'Falha ao gerar mensagem (LLM API).' }), { status: 502 })
    }

    const data = await response.json()
    const full = data.candidates?.[0]?.content?.parts?.[0]?.text || ''

    if (full) {
      try {
        await prisma.message.create({ data: { userId: user.id, leadId: lead.id, messageText: full } })
        if (lead.status === 'novo') {
          await prisma.lead.update({ where: { id: lead.id }, data: { status: 'mensagem_gerada' } })
        }
      } catch (err) {
        console.error('Database persist failed, updating locally', err)
        updateLocalLeadStatus(lead.id, 'mensagem_gerada')
      }
    }

    // Return custom EventSource text stream structure for frontend to parse delta
    const textStream = `data: ${JSON.stringify({ status: 'processing', delta: full })}\n\ndata: ${JSON.stringify({ status: 'completed' })}\n\n`
    return new Response(textStream, {
      headers: { 'Content-Type': 'text/event-stream; charset=utf-8', 'Cache-Control': 'no-cache', Connection: 'keep-alive' },
    })
  } catch (e) {
    console.error(e)
    return new Response(JSON.stringify({ error: 'Erro interno ao gerar mensagem.' }), { status: 500 })
  }
}
