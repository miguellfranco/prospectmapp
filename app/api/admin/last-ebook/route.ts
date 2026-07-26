export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/session'
import { isAdminUser } from '@/lib/plan'
import { prisma } from '@/lib/db'

// Endpoint enxuto (1 query) só pra alimentar o atalho de simulação de venda
// (dev/QA, ver components/lz/app-shell.tsx) — separado do /api/admin porque
// aquele faz várias agregações pesadas e causava atraso perceptível toda vez
// que o atalho era acionado. Só leitura, nunca grava nada.
export async function GET() {
  const user = await getCurrentUser()
  if (!user || !isAdminUser(user)) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })

  const lastEbook = await prisma.ebookProduct.findFirst({
    where: { price: { not: null } },
    orderBy: { createdAt: 'desc' },
    select: { name: true, price: true },
  })

  return NextResponse.json({ lastEbook: lastEbook ? { name: lastEbook.name, price: lastEbook.price } : null })
}
