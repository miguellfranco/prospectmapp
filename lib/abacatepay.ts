const ABACATEPAY_API_URL = 'https://api.abacatepay.com/v2'

// Prices in cents. "anual" includes the +3 months bonus baked into the
// duration granted, not a lower price — see PLAN_DURATION_DAYS.
export const PLAN_PRICES_CENTS: Record<string, number> = {
  mensal: 9700,
  trimestral: 19700,
  anual: 39700,
}

// How long access lasts per plan once paid. "anual" is 12 months + the
// promotional +3 months free, granted as extra duration up front.
export const PLAN_DURATION_DAYS: Record<string, number> = {
  mensal: 30,
  trimestral: 90,
  anual: 455, // 365 + 90 (3 bonus months)
}

export const PLAN_LABELS: Record<string, string> = {
  mensal: 'Mensal',
  trimestral: 'Trimestral',
  anual: 'Anual (+3 meses grátis)',
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
