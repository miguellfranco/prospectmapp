export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { listCaktoProducts, getCaktoToken } from '@/lib/cakto'

// Rota de diagnóstico TEMPORÁRIA — sem dados sensíveis (só nomes/config de
// produto), criada para investigar por que o setup da Cakto não refletiu no
// painel deles. Remover depois de confirmar.
export async function GET() {
  try {
    const products = await listCaktoProducts()
    const token = await getCaktoToken()

    // A listagem não traz campos de afiliado/entrega — buscamos o detalhe
    // completo de cada produto pra ver o estado real salvo na Cakto.
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

    return NextResponse.json({ ok: true, count: products.length, products: full })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message ?? e) }, { status: 500 })
  }
}
