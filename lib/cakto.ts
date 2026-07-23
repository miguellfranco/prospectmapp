// Cakto (cakto.com.br) — usado para vender os planos do InfoBook com
// programa de afiliados (comissão automática). Autenticação OAuth
// client-credentials: POST /public_api/token/ com client_id + client_secret
// retorna um Bearer válido por ~10h (sem refresh — pedimos outro ao expirar).

const CAKTO_API = 'https://api.cakto.com.br'

let tokenCache: { token: string; expiresAt: number } | null = null

export function caktoConfigured(): boolean {
  return Boolean(process.env.CAKTO_CLIENT_ID && process.env.CAKTO_CLIENT_SECRET)
}

export async function getCaktoToken(): Promise<string> {
  if (tokenCache && Date.now() < tokenCache.expiresAt) return tokenCache.token

  const clientId = process.env.CAKTO_CLIENT_ID
  const clientSecret = process.env.CAKTO_CLIENT_SECRET
  if (!clientId || !clientSecret) throw new Error('CAKTO_CLIENT_ID/CAKTO_CLIENT_SECRET não configurados')

  const res = await fetch(`${CAKTO_API}/public_api/token/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret }),
    cache: 'no-store',
  })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`Cakto token ${res.status}: ${body.slice(0, 300)}`)
  }
  const data = await res.json()
  if (!data?.access_token) throw new Error('Cakto token: resposta sem access_token')

  const ttlMs = (Number(data.expires_in) || 3600) * 1000
  // renova 5 min antes de expirar para nunca usar token vencido
  tokenCache = { token: data.access_token, expiresAt: Date.now() + ttlMs - 5 * 60 * 1000 }
  return data.access_token
}

export interface CaktoOrder {
  id: string
  status: string // paid | authorized | processing | refunded | waiting_payment | refused | canceled | chargedback | ...
  customerEmail: string | null
  customerName: string | null
  customerPhone: string | null
  productId: string | null
  productName: string | null
  amount: number | null // como veio da API (pode ser reais decimais ou centavos)
  raw: any
}

export async function getCaktoOrder(orderId: string): Promise<CaktoOrder | null> {
  const token = await getCaktoToken()
  const res = await fetch(`${CAKTO_API}/public_api/orders/${encodeURIComponent(orderId)}/`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  })
  if (res.status === 404) return null
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`Cakto order ${res.status}: ${body.slice(0, 300)}`)
  }
  const o = await res.json()
  return {
    id: String(o?.id ?? orderId),
    status: String(o?.status ?? '').toLowerCase(),
    customerEmail: o?.customer?.email ?? null,
    customerName: o?.customer?.name ?? null,
    customerPhone: o?.customer?.phone ?? o?.customer?.phone_number ?? null,
    productId: o?.product?.id != null ? String(o.product.id) : null,
    productName: o?.product?.name ?? null,
    amount: typeof o?.amount === 'number' ? o.amount : (typeof o?.baseAmount === 'number' ? o.baseAmount : null),
    raw: o,
  }
}

// Respostas de listagem da Cakto podem vir como array direto ou paginadas
// no formato Django ({ results: [...] }).
function unwrapList(data: any): any[] {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.results)) return data.results
  return []
}

async function caktoGet(path: string): Promise<any> {
  const token = await getCaktoToken()
  const res = await fetch(`${CAKTO_API}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`Cakto GET ${path} ${res.status}: ${body.slice(0, 300)}`)
  }
  return res.json()
}

async function caktoPost(path: string, payload: any): Promise<any> {
  const token = await getCaktoToken()
  const res = await fetch(`${CAKTO_API}${path}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    cache: 'no-store',
  })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`Cakto POST ${path} ${res.status}: ${body.slice(0, 300)}`)
  }
  return res.json()
}

async function caktoPut(path: string, payload: any): Promise<any> {
  const token = await getCaktoToken()
  const res = await fetch(`${CAKTO_API}${path}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    cache: 'no-store',
  })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`Cakto PUT ${path} ${res.status}: ${body.slice(0, 300)}`)
  }
  return res.json()
}

export async function listCaktoProducts(): Promise<any[]> {
  return unwrapList(await caktoGet('/public_api/products/'))
}

export async function getCaktoProduct(productId: string): Promise<any> {
  return caktoGet(`/public_api/products/${encodeURIComponent(productId)}/`)
}

export async function createCaktoProduct(input: { name: string; description: string; price: number }): Promise<any> {
  return caktoPost('/public_api/products/', {
    name: input.name,
    description: input.description,
    price: input.price.toFixed(2),
    type: 'unique',
    guarantee: 7, // garantia de 7 dias (direito de arrependimento do CDC)
  })
}

// IMPORTANTE (testado e confirmado 2x em produção, não é suposição): apesar
// da documentação da Cakto listar campos affiliate/affiliateCommission/
// affiliateSalesPage/producerName/contentDeliveries como editáveis via PUT,
// na prática essa conta NÃO grava nem devolve os campos de afiliado (nem
// aparecem na resposta), e contentDeliveries também não persistiu como
// ['emailAccess']. Isso precisa ser feito manualmente no painel da Cakto —
// ver instruções no Super Admin. O único campo confirmado que grava de
// verdade via API é emailAccessLink (link de acesso), então deixamos isso
// pré-preenchido como um mimo — o usuário ainda precisa marcar "Acesso por
// e-mail" manualmente para esse link ser usado.
export async function configureCaktoProduct(productId: string, siteUrl: string): Promise<any> {
  const current = await getCaktoProduct(productId)
  return caktoPut(`/public_api/products/${encodeURIComponent(productId)}/`, {
    name: current.name,
    description: current.description,
    price: current.price,
    type: current.type,
    category: current.category?.id ?? current.category ?? null,
    status: current.status,
    image: current.image,
    paymentMethods: current.paymentMethods,
    salesPage: current.salesPage,
    emailAccessLink: `${siteUrl}/login`,
  })
}

export async function listCaktoWebhooks(): Promise<any[]> {
  return unwrapList(await caktoGet('/public_api/webhook/'))
}

export async function createCaktoWebhook(input: { name: string; url: string; products: string[]; events: string[] }): Promise<any> {
  return caktoPost('/public_api/webhook/', input)
}

// Dispara um evento sintético de teste pro webhook já cadastrado — permite
// verificar de verdade se nosso endpoint recebe e entende o formato da Cakto,
// sem precisar esperar uma compra real.
export async function testCaktoWebhookEvent(webhookId: string, eventId: string): Promise<any> {
  return caktoPost(`/public_api/webhook/event_test/${encodeURIComponent(webhookId)}/?event_id=${encodeURIComponent(eventId)}`, {})
}

export async function getCaktoWebhookEventHistory(limit = 5): Promise<any[]> {
  return unwrapList(await caktoGet(`/public_api/webhook/event_history/?limit=${limit}&ordering=-dispatchedAt`))
}

export interface CaktoSetupResult {
  products: { plan: string; name: string; id: string; created: boolean; deliveryLinkSet: boolean; deliveryLinkError: string | null }[]
  webhook: { id: string; url: string; created: boolean; secret: string | null }
}

// Configuração 1-clique: garante os 3 produtos dos planos e o webhook de
// vendas apontando para o app. Também pré-preenche o link de acesso por
// e-mail em cada produto (único campo confirmado gravável via API — ver
// nota em configureCaktoProduct). Afiliados 50%, tipo de entrega e nome do
// produtor precisam ser feitos manualmente no painel da Cakto — a API dessa
// conta não expõe/grava esses campos (testado e confirmado, não é suposição).
// Idempotente — rodar de novo não duplica nada.
export async function ensureCaktoSetup(webhookUrl: string, salesPageUrl: string): Promise<CaktoSetupResult> {
  const PLAN_PRODUCTS = [
    { plan: 'mensal', name: 'InfoBook — Plano Mensal', price: 97, description: 'Acesso de 30 dias ao InfoBook: crie e-books, páginas de venda e mensagens de divulgação com IA, tudo em um funil completo de 4 passos.' },
    { plan: 'trimestral', name: 'InfoBook — Plano Trimestral', price: 197, description: 'Acesso de 90 dias ao InfoBook: crie e-books, páginas de venda e mensagens de divulgação com IA, tudo em um funil completo de 4 passos. Economize 32% em relação ao mensal.' },
    { plan: 'vitalicio', name: 'InfoBook — Plano Vitalício', price: 297, description: 'Acesso vitalício ao InfoBook: pague uma única vez e crie e-books, páginas de venda e mensagens de divulgação com IA para sempre.' },
  ]

  const existing = await listCaktoProducts()
  const products: CaktoSetupResult['products'] = []
  for (const p of PLAN_PRODUCTS) {
    const found = existing.find((e: any) => mapCaktoPlan(e?.name, null) === p.plan)
    let id: string
    let name: string
    let created: boolean
    if (found?.id != null) {
      id = String(found.id)
      name = found.name
      created = false
    } else {
      const createdProduct = await createCaktoProduct(p)
      if (createdProduct?.id == null) {
        throw new Error(`Cakto criou o produto "${p.name}" mas não devolveu um id na resposta (resposta: ${JSON.stringify(createdProduct).slice(0, 200)}). Verifique manualmente no painel da Cakto.`)
      }
      id = String(createdProduct.id)
      name = p.name
      created = true
    }

    let deliveryLinkSet = false
    let deliveryLinkError: string | null = null
    try {
      await configureCaktoProduct(id, salesPageUrl)
      deliveryLinkSet = true
    } catch (e: any) {
      deliveryLinkError = String(e?.message ?? e)
      console.error(`Cakto: falha ao configurar entrega no produto ${name} (${id}):`, e)
    }

    products.push({ plan: p.plan, name, id, created, deliveryLinkSet, deliveryLinkError })
  }

  const webhooks = await listCaktoWebhooks()
  const foundHook = webhooks.find((w: any) => String(w?.url ?? '').trim() === webhookUrl)
  if (foundHook?.id != null) {
    return {
      products,
      webhook: {
        id: String(foundHook.id),
        url: webhookUrl,
        created: false,
        secret: foundHook?.fields?.secret ?? foundHook?.secret ?? null,
      },
    }
  }

  const createdHook = await createCaktoWebhook({
    name: 'InfoBook — ativação automática de planos',
    url: webhookUrl,
    products: products.map((p) => p.id),
    events: ['purchase_approved', 'subscription_created', 'subscription_renewed'],
  })
  return {
    products,
    webhook: {
      id: String(createdHook.id),
      url: webhookUrl,
      created: true,
      secret: createdHook?.fields?.secret ?? createdHook?.secret ?? null,
    },
  }
}

// Links de checkout da Cakto por plano. A API pública da Cakto não expõe a
// URL de compra (`pay.cakto.com.br/...`) — ela só aparece no painel deles
// (Produto → aba "Links"). Por isso o admin cola manualmente aqui, uma vez,
// e o site usa esse valor para redirecionar o comprador direto pro checkout.
export const CAKTO_CHECKOUT_URL_KEYS: Record<string, string> = {
  mensal: 'cakto_checkout_mensal',
  trimestral: 'cakto_checkout_trimestral',
  vitalicio: 'cakto_checkout_vitalicio',
}

// Descobre qual plano do InfoBook a venda representa. Primeiro pelo nome do
// produto na Cakto (por isso os produtos DEVEM conter Mensal/Trimestral/
// Vitalício no nome), depois pelo valor como plano B.
export function mapCaktoPlan(productName: string | null | undefined, amount: number | null | undefined): string | null {
  const name = (productName || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // remove acentos: Vitalício -> vitalicio
  if (name.includes('vitalic')) return 'vitalicio'
  if (name.includes('trimestral')) return 'trimestral'
  if (name.includes('anual')) return 'anual'
  if (name.includes('mensal')) return 'mensal'

  if (typeof amount === 'number' && amount > 0) {
    // A API pode devolver reais (97.0) ou centavos (9700) — normaliza para reais.
    const reais = amount >= 1000 ? amount / 100 : amount
    if (Math.abs(reais - 97) <= 3) return 'mensal'
    if (Math.abs(reais - 197) <= 3) return 'trimestral'
    if (Math.abs(reais - 297) <= 3) return 'vitalicio'
    if (Math.abs(reais - 397) <= 3) return 'anual'
  }
  return null
}
