export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { listCaktoProducts, getCaktoToken } from '@/lib/cakto'

// Rota de diagnóstico TEMPORÁRIA, somente leitura — sem dados sensíveis (só
// nomes/config de produto), criada para investigar por que o setup da Cakto
// não refletiu no painel deles. Remover depois de confirmar.
export async function GET() {
  try {
    const products = await listCaktoProducts()
    const token = await getCaktoToken()

    const full = await Promise.all(
      products.map(async (p: any) => {
        const res = await fetch(`https://api.cakto.com.br/public_api/products/${p.id}/`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store',
        })
        const detail = res.ok ? await res.json() : { _fetchError: res.status, _body: await res.text().catch(() => '') }
        return {
          id: p?.id,
          name: p?.name,
          affiliate: detail?.affiliate,
          affiliateCommission: detail?.affiliateCommission,
          affiliateRequest: detail?.affiliateRequest,
          affiliateSalesPage: detail?.affiliateSalesPage,
          affiliateMarketplace: detail?.affiliateMarketplace,
          contentDeliveries: detail?.contentDeliveries,
          emailAccessLink: detail?.emailAccessLink,
          producerName: detail?.producerName,
          _fetchError: detail?._fetchError,
          _body: detail?._body,
        }
      }),
    )

    const infobookProduct = products.find((p: any) => String(p?.name ?? '').includes('InfoBook'))
    let raw: any = null
    if (infobookProduct) {
      const res = await fetch(`https://api.cakto.com.br/public_api/products/${infobookProduct.id}/`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      })
      raw = { status: res.status, body: await res.text() }
    }

    return NextResponse.json({ ok: true, count: products.length, products: full, raw })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message ?? e) }, { status: 500 })
  }
}
