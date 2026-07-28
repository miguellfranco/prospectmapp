// Adaptadores dos gateways de venda de infoprodutos (Kiwify / Hotmart / Cakto).
//
// Realidade importante e mantida honesta aqui: as APIs públicas da Kiwify e da
// Hotmart NÃO permitem criar produtos programaticamente (reconfirmado em
// 2026-07-26 direto na documentação oficial da Kiwify — só existem endpoints
// de LISTAR/CONSULTAR produto, nenhum de criar) — elas só expõem leitura
// (vendas, produtos existentes) e webhooks. Já a Cakto TEM um endpoint real
// de criação de produto (POST /public_api/products/, já usado neste mesmo
// projeto pra criar os planos do próprio InfoBook) — então pra Cakto
// createProductOnGateway() cria o produto de verdade. A única coisa que a
// API da Cakto não expõe é o link de checkout pronto (só metadados) — isso
// ainda precisa ser copiado uma vez do painel dela.
//   - testConnection() valida as credenciais de verdade (OAuth real).
//   - createProductOnGateway() retorna { supported: false } com instruções
//     quando o provedor genuinamente não suporta (Kiwify/Hotmart), ou
//     { supported: true, externalProductId } quando cria de verdade (Cakto).
// Nunca inventamos um checkout_url ou um external_product_id falso.

import { testNetlifyToken } from './netlify'
import { getCaktoToken, createCaktoProduct } from './cakto'

export type GatewayProvider = 'kiwify' | 'hotmart' | 'cakto' | 'netlify' | 'outro'

export interface GatewayCredentials {
  clientId?: string
  clientSecret?: string
  accountId?: string // Kiwify: account id exigido nos headers da API
  notes?: string
}

export interface ConnectionResult {
  ok: boolean
  message: string
}

export const PROVIDER_LABELS: Record<string, string> = {
  kiwify: 'Kiwify',
  hotmart: 'Hotmart',
  cakto: 'Cakto',
  netlify: 'Netlify (hospedagem)',
  outro: 'Outro gateway',
}

export async function testConnection(provider: GatewayProvider, creds: GatewayCredentials): Promise<ConnectionResult> {
  try {
    if (provider === 'kiwify') {
      if (!creds.clientId || !creds.clientSecret) {
        return { ok: false, message: 'Informe Client ID e Client Secret da Kiwify (Painel → Apps → API).' }
      }
      const res = await fetch('https://public-api.kiwify.com/v1/oauth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ client_id: creds.clientId, client_secret: creds.clientSecret }),
        signal: AbortSignal.timeout(15_000),
      })
      const json = await res.json().catch(() => null)
      if (res.ok && json?.access_token) return { ok: true, message: 'Conexão com a Kiwify validada com sucesso.' }
      return { ok: false, message: `A Kiwify recusou as credenciais (HTTP ${res.status}). Confira Client ID e Secret.` }
    }

    if (provider === 'hotmart') {
      if (!creds.clientId || !creds.clientSecret) {
        return { ok: false, message: 'Informe Client ID e Client Secret da Hotmart (Ferramentas → Credenciais API).' }
      }
      const basic = Buffer.from(`${creds.clientId}:${creds.clientSecret}`).toString('base64')
      const url = `https://api-sec-vlc.hotmart.com/security/oauth/token?grant_type=client_credentials&client_id=${encodeURIComponent(creds.clientId)}&client_secret=${encodeURIComponent(creds.clientSecret)}`
      const res = await fetch(url, {
        method: 'POST',
        headers: { Authorization: `Basic ${basic}`, 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(15_000),
      })
      const json = await res.json().catch(() => null)
      if (res.ok && json?.access_token) return { ok: true, message: 'Conexão com a Hotmart validada com sucesso.' }
      return { ok: false, message: `A Hotmart recusou as credenciais (HTTP ${res.status}). Confira Client ID e Secret.` }
    }

    if (provider === 'cakto') {
      if (!creds.clientId || !creds.clientSecret) {
        return { ok: false, message: 'Informe Client ID e Client Secret da Cakto (Integrações → Cakto API → Criar Chave de API).' }
      }
      try {
        await getCaktoToken({ clientId: creds.clientId, clientSecret: creds.clientSecret })
      } catch (e: any) {
        return { ok: false, message: `A Cakto recusou as credenciais: ${e?.message ?? 'erro desconhecido'}. Confira Client ID e Secret.` }
      }
      return { ok: true, message: 'Conexão com a Cakto validada com sucesso.' }
    }

    if (provider === 'netlify') {
      if (!creds.clientSecret) {
        return { ok: false, message: 'Informe o Personal Access Token da Netlify (app.netlify.com → User settings → Applications → New access token).' }
      }
      return testNetlifyToken(creds.clientSecret)
    }

    // "outro": não há endpoint padrão para validar — salva sem validação automática
    return { ok: true, message: 'Credenciais salvas. Este provedor não tem validação automática — confira manualmente.' }
  } catch (e: any) {
    return { ok: false, message: `Não foi possível conectar ao gateway: ${e?.message ?? 'erro de rede'}` }
  }
}

export interface CreateProductResult {
  supported: boolean
  externalProductId?: string
  checkoutUrl?: string
  message: string
}

export async function createProductOnGateway(
  provider: GatewayProvider,
  creds: GatewayCredentials,
  product: { name: string; priceReais: number; description?: string }
): Promise<CreateProductResult> {
  if (provider === 'kiwify') {
    return {
      supported: false,
      message:
        'A API pública da Kiwify não permite criar produtos automaticamente. Crie o produto no painel da Kiwify (leva ~2 min), copie o link de checkout e cole aqui — o resto do funil continua automático.',
    }
  }
  if (provider === 'hotmart') {
    return {
      supported: false,
      message:
        'A API pública da Hotmart não permite criar produtos automaticamente. Crie o produto no painel da Hotmart, copie o link de checkout e cole aqui — o resto do funil continua automático.',
    }
  }
  if (provider === 'cakto') {
    if (!creds.clientId || !creds.clientSecret) {
      return { supported: false, message: 'Integração Cakto sem credenciais salvas — reconecte em Integrações.' }
    }
    try {
      const created = await createCaktoProduct(
        { name: product.name, description: product.description ?? product.name, price: product.priceReais },
        { clientId: creds.clientId, clientSecret: creds.clientSecret },
      )
      if (created?.id == null) {
        return { supported: false, message: 'A Cakto criou o produto mas não devolveu um id — confira manualmente no painel dela.' }
      }
      // A API da Cakto cria o produto de verdade, mas (diferente de criar o
      // produto) não expõe o link de checkout pronto — só existe no painel
      // dela (Produto → aba "Links"). Único passo manual que sobra.
      return {
        supported: true,
        externalProductId: String(created.id),
        message:
          'Produto criado na Cakto automaticamente! Falta só 1 passo: copie o link de checkout em app.cakto.com.br → Produtos → abra este produto → aba "Links", e cole aqui.',
      }
    } catch (e: any) {
      return { supported: false, message: `Não foi possível criar o produto na Cakto: ${e?.message ?? 'erro desconhecido'}` }
    }
  }
  return {
    supported: false,
    message: 'Cadastro automático indisponível para este provedor. Cole o link de checkout gerado no painel do gateway.',
  }
}

export const PROVIDER_DASHBOARD_URLS: Record<string, string> = {
  kiwify: 'https://dashboard.kiwify.com.br/products',
  hotmart: 'https://app.hotmart.com/products',
  cakto: 'https://app.cakto.com.br/products',
}
