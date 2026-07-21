export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { listCaktoProducts } from '@/lib/cakto'

// Rota de diagnóstico TEMPORÁRIA — sem dados sensíveis (só nomes/config de
// produto), criada para investigar por que o setup da Cakto não refletiu no
// painel deles. Remover depois de confirmar.
export async function GET() {
  try {
    const products = await listCaktoProducts()
    return NextResponse.json({
      ok: true,
      count: products.length,
      products: products.map((p: any) => ({
        id: p?.id,
        name: p?.name,
        status: p?.status,
        price: p?.price,
        affiliate: p?.affiliate,
        affiliateCommission: p?.affiliateCommission,
        affiliateRequest: p?.affiliateRequest,
        affiliateSalesPage: p?.affiliateSalesPage,
        affiliateMarketplace: p?.affiliateMarketplace,
        contentDeliveries: p?.contentDeliveries,
        emailAccessLink: p?.emailAccessLink,
        producerName: p?.producerName,
      })),
    })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message ?? e) }, { status: 500 })
  }
}
