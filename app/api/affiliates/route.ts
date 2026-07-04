export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'

// Rota desativada - funcionalidade de afiliados removida
export async function GET() {
  return NextResponse.json({ referrals: [], totalEarned: 0, totalReferrals: 0, pending: 0 })
}
