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
