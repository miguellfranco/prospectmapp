export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { decryptJson } from '@/lib/crypto'
import { CAKTO_CHECKOUT_URL_KEYS } from '@/lib/cakto'

// Rota pública (sem login) — devolve só os links de checkout da Cakto que o
// admin já configurou, para os botões de "Assinar" da home redirecionarem
// direto ao pagamento. Nenhum dado sensível é exposto aqui.
export async function GET() {
  const plans = Object.keys(CAKTO_CHECKOUT_URL_KEYS)
  const rows = await prisma.appConfig.findMany({
    where: { key: { in: Object.values(CAKTO_CHECKOUT_URL_KEYS) } },
  })

  const byKey = new Map(rows.map((r) => [r.key, r]))
  const urls: Record<string, string | null> = {}
  for (const plan of plans) {
    const row = byKey.get(CAKTO_CHECKOUT_URL_KEYS[plan])
    if (!row) { urls[plan] = null; continue }
    try {
      const data = decryptJson<{ url?: string }>(row.valueEnc)
      urls[plan] = data?.url ?? null
    } catch {
      urls[plan] = null
    }
  }

  return NextResponse.json({ ok: true, urls })
}
