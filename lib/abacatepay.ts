const ABACATEPAY_API_URL = 'https://api.abacatepay.com/v2'

// Prices in cents. "anual" includes the +3 months bonus baked into the
// duration granted, not a lower price — see PLAN_DURATION_DAYS.
export const PLAN_PRICES_CENTS: Record<string, number> = {
  mensal: 9700,
  trimestral: 19700,
  anual: 39700,
  vitalicio: 29700,
}

// How long access lasts per plan once paid. "anual" is 12 months + the
// promotional +3 months free, granted as extra duration up front.
export const PLAN_DURATION_DAYS: Record<string, number> = {
  mensal: 30,
  trimestral: 90,
  anual: 455, // 365 + 90 (3 bonus months)
  vitalicio: 36500, // acesso vitalício (~100 anos)
}

export const PLAN_LABELS: Record<string, string> = {
  mensal: 'Mensal',
  trimestral: 'Trimestral',
  anual: 'Anual (+3 meses grátis)',
  vitalicio: 'Vitalício',
}

// One-time (non-subscription) Product ids, created once via a one-off setup
// call to POST /products/create — required by /checkouts/create (card
// payments), unlike /transparents/create (PIX) which takes an ad-hoc amount.
export const PLAN_PRODUCT_IDS: Record<string, string> = {
  mensal: process.env.ABACATEPAY_PRODUCT_MENSAL || '',
  trimestral: process.env.ABACATEPAY_PRODUCT_TRIMESTRAL || '',
  anual: process.env.ABACATEPAY_PRODUCT_ANUAL || '',
  vitalicio: process.env.ABACATEPAY_PRODUCT_VITALICIO || '',
}

function getApiKey(): string {
  const key = process.env.ABACATEPAY_API_KEY
  if (!key) throw new Error('Missing ABACATEPAY_API_KEY env var')
  return key
}

export interface CreatePixChargeParams {
  amountCents: number
  description: string
  expiresInSeconds: number
  externalId: string
  metadata: Record<string, string>
}

export interface AbacatePayPixCharge {
  id: string
  amount: number
  status: string
  brCode: string
  brCodeBase64: string
  expiresAt: string
}

export async function createPixCharge(params: CreatePixChargeParams): Promise<AbacatePayPixCharge> {
  const response = await fetch(`${ABACATEPAY_API_URL}/transparents/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getApiKey()}`,
    },
    body: JSON.stringify({
      method: 'PIX',
      data: {
        amount: params.amountCents,
        description: params.description,
        expiresIn: params.expiresInSeconds,
        externalId: params.externalId,
        metadata: params.metadata,
      },
    }),
    signal: AbortSignal.timeout(20000),
  })

  const json = await response.json().catch(() => null)
  if (!response.ok || !json?.success) {
    throw new Error(`AbacatePay charge creation failed: ${response.status} ${JSON.stringify(json)}`)
  }
  return json.data
}

export async function checkPixStatus(abacatePayId: string): Promise<string> {
  const response = await fetch(`${ABACATEPAY_API_URL}/transparents/check?id=${encodeURIComponent(abacatePayId)}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${getApiKey()}` },
    signal: AbortSignal.timeout(15000),
  })
  const json = await response.json().catch(() => null)
  if (!response.ok || !json?.success) {
    throw new Error(`AbacatePay status check failed: ${response.status} ${JSON.stringify(json)}`)
  }
  return json.data.status as string
}

export interface CreateProductParams {
  externalId: string
  name: string
  priceCents: number
}

export async function createProduct(params: CreateProductParams): Promise<{ id: string }> {
  const response = await fetch(`${ABACATEPAY_API_URL}/products/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getApiKey()}` },
    body: JSON.stringify({
      externalId: params.externalId,
      name: params.name,
      price: params.priceCents,
      currency: 'BRL',
    }),
    signal: AbortSignal.timeout(20000),
  })
  const json = await response.json().catch(() => null)
  if (!response.ok || !json?.success) {
    throw new Error(`AbacatePay product creation failed: ${response.status} ${JSON.stringify(json)}`)
  }
  return json.data
}

export async function listProducts(): Promise<any[]> {
  const response = await fetch(`${ABACATEPAY_API_URL}/products/list`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${getApiKey()}` },
    signal: AbortSignal.timeout(15000),
  })
  const json = await response.json().catch(() => null)
  if (!response.ok || !json?.success) {
    throw new Error(`AbacatePay product list failed: ${response.status} ${JSON.stringify(json)}`)
  }
  return Array.isArray(json.data) ? json.data : []
}

// Resolve o produto do plano no gateway sem depender de configuração manual:
// env → cache do processo → busca na conta por externalId → cria na hora.
// Assim o checkout de cartão funciona para qualquer plano novo automaticamente.
const productIdCache: Record<string, string> = {}

export async function getOrCreateProductId(plan: string): Promise<string | null> {
  const fromEnv = PLAN_PRODUCT_IDS[plan]
  if (fromEnv) return fromEnv
  if (productIdCache[plan]) return productIdCache[plan]

  const priceCents = PLAN_PRICES_CENTS[plan]
  if (!priceCents) return null
  const externalId = `plan_${plan}`

  try {
    const products = await listProducts()
    const found = products.find((p: any) => p?.externalId === externalId)
    if (found?.id) {
      productIdCache[plan] = found.id
      return found.id
    }
  } catch (e) {
    console.warn('AbacatePay products/list indisponível, tentando criar direto:', e)
  }

  const created = await createProduct({
    externalId,
    name: `InfoBook — Plano ${PLAN_LABELS[plan] ?? plan}`,
    priceCents,
  })
  productIdCache[plan] = created.id
  return created.id
}

export interface CreateCardCheckoutParams {
  productId: string
  amountCents: number
  externalId: string
  returnUrl: string
  completionUrl: string
  metadata: Record<string, string>
}

export interface AbacatePayCheckout {
  id: string
  url: string
  amount: number
  status: string
}

// AbacatePay requires at least R$10 per installment — 12x isn't valid for
// every plan (e.g. R$97 / 12 < R$10), so cap dynamically per amount.
function maxInstallmentsFor(amountCents: number): number {
  return Math.max(1, Math.min(12, Math.floor(amountCents / 1000)))
}

export async function createCardCheckout(params: CreateCardCheckoutParams): Promise<AbacatePayCheckout> {
  const response = await fetch(`${ABACATEPAY_API_URL}/checkouts/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getApiKey()}` },
    body: JSON.stringify({
      items: [{ id: params.productId, quantity: 1 }],
      methods: ['CARD'],
      card: { maxInstallments: maxInstallmentsFor(params.amountCents) },
      externalId: params.externalId,
      returnUrl: params.returnUrl,
      completionUrl: params.completionUrl,
      metadata: params.metadata,
    }),
    signal: AbortSignal.timeout(20000),
  })
  const json = await response.json().catch(() => null)
  if (!response.ok || !json?.success) {
    throw new Error(`AbacatePay checkout creation failed: ${response.status} ${JSON.stringify(json)}`)
  }
  return json.data
}

export async function checkCheckoutStatus(abacatePayId: string): Promise<string> {
  const response = await fetch(`${ABACATEPAY_API_URL}/checkouts/list?id=${encodeURIComponent(abacatePayId)}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${getApiKey()}` },
    signal: AbortSignal.timeout(15000),
  })
  const json = await response.json().catch(() => null)
  if (!response.ok || !json?.success) {
    throw new Error(`AbacatePay checkout status check failed: ${response.status} ${JSON.stringify(json)}`)
  }
  const match = Array.isArray(json.data) ? json.data.find((c: any) => c.id === abacatePayId) : null
  if (!match) throw new Error(`Checkout ${abacatePayId} not found in list response`)
  return match.status as string
}
