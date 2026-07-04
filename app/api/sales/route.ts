export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/session'
import { prisma } from '@/lib/db'
import fs from 'fs'
import path from 'path'

const LOCAL_SALES_PATH = path.join(process.cwd(), 'prisma', 'local_sales_fallback.json')

function getLocalSales(userId: string) {
  try {
    if (fs.existsSync(LOCAL_SALES_PATH)) {
      const data = JSON.parse(fs.readFileSync(LOCAL_SALES_PATH, 'utf-8'))
      return data.filter((s: any) => s.userId === userId)
    }
  } catch {}
  return []
}

function saveLocalSale(sale: any) {
  try {
    let data: any[] = []
    if (fs.existsSync(LOCAL_SALES_PATH)) {
      try {
        data = JSON.parse(fs.readFileSync(LOCAL_SALES_PATH, 'utf-8'))
      } catch {}
    }
    data.unshift(sale)
    fs.writeFileSync(LOCAL_SALES_PATH, JSON.stringify(data, null, 2), 'utf-8')
  } catch {}
}

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    let sales = []
    try {
      sales = await prisma.sale.findMany({ where: { userId: user.id }, orderBy: { createdAt: 'desc' } })
    } catch (dbError) {
      console.warn('Database offline, reading local fallback sales list')
      sales = getLocalSales(user.id)
    }

    return NextResponse.json({
      sales: sales.map((s: any) => ({
        id: s.id,
        niche: s.niche,
        city: s.city,
        saleValue: s.saleValue,
        description: s.description,
        isPublic: s.isPublic,
        createdAt: typeof s.createdAt === 'string' ? s.createdAt : s.createdAt.toISOString(),
      })),
    })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Erro' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    
    const body = await req.json().catch(() => ({}))
    const { niche, city, saleValue, description, isPublic } = body ?? {}
    if (!niche || !city) {
      return NextResponse.json({ error: 'Informe o nicho e a cidade.' }, { status: 400 })
    }

    const saleData = {
      userId: user.id,
      niche: String(niche),
      city: String(city),
      saleValue: saleValue != null && saleValue !== '' ? Number(saleValue) : null,
      description: description ? String(description) : null,
      isPublic: isPublic !== false,
    }

    let sale: any = null
    try {
      sale = await prisma.sale.create({ data: saleData })
    } catch (dbError) {
      console.warn('Database offline, saving sale locally')
      const localSale = {
        id: `local_sale_${Math.random().toString(36).substring(2, 9)}`,
        ...saleData,
        createdAt: new Date(),
      }
      saveLocalSale(localSale)
      sale = localSale
    }

    return NextResponse.json({
      sale: {
        id: sale.id,
        niche: sale.niche,
        city: sale.city,
        saleValue: sale.saleValue,
        description: sale.description,
        isPublic: sale.isPublic,
        createdAt: typeof sale.createdAt === 'string' ? sale.createdAt : sale.createdAt.toISOString(),
      },
    })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Erro ao registrar venda' }, { status: 500 })
  }
}
