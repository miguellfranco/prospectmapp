export const dynamic = 'force-dynamic'
export const maxDuration = 30

import crypto from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { checkPixStatus, checkCheckoutStatus } from '@/lib/abacatepay'
import { grantAccessForPayment } from '@/lib/grant-access'

function isValidSignature(rawBody: string, signatureHeader: string | null, secret: string): boolean {
  if (!signatureHeader) return false
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('base64')
  const a = Buffer.from(signatureHeader)
  const b = Buffer.from(expected)
  if (a.length !== b.length) return false
  return crypto.timingSafeEqual(a, b)
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text()
    const secret = process.env.ABACATEPAY_WEBHOOK_SECRET

    // Belt-and-suspenders: signature verification here follows the documented
    // HMAC-SHA256 + X-Webhook-Signature pattern, but since we couldn't fully
    // confirm the exact encoding from official docs, we NEVER trust this
    // webhook alone to grant access — every payment gets independently
    // re-confirmed against AbacatePay's own /transparents/check endpoint
    // below before any account/plan change happens.
    if (secret) {
      const signature = req.headers.get('x-webhook-signature')
      if (!isValidSignature(rawBody, signature, secret)) {
        console.warn('AbacatePay webhook: invalid signature, ignoring (will still be caught by status polling fallback)')
        return NextResponse.json({ ok: true }) // 200 so AbacatePay doesn't retry-storm us; we just don't act on it
      }
    }

    const event = JSON.parse(rawBody)
    const eventType: string = event?.event || event?.type
    const chargeId: string | undefined = event?.data?.id

    if (!chargeId) {
      return NextResponse.json({ ok: true })
    }

    const payment = await prisma.pixPayment.findUnique({ where: { abacatePayId: chargeId } })
    if (!payment) {
      return NextResponse.json({ ok: true })
    }

    if (payment.status === 'paid') {
      return NextResponse.json({ ok: true })
    }

    if (eventType === 'transparent.completed' || eventType === 'checkout.completed' || event?.data?.status === 'PAID') {
      // Re-confirm directly with AbacatePay using our own API key rather than
      // trusting the webhook body's status field — the only thing the
      // signature actually proves is that the request came from AbacatePay's
      // infrastructure, not that this specific field wasn't manipulated
      // upstream of signing in some misconfiguration.
      const liveStatus = payment.method === 'CARD'
        ? await checkCheckoutStatus(payment.abacatePayId)
        : await checkPixStatus(payment.abacatePayId)
      if (liveStatus === 'PAID') {
        await grantAccessForPayment(payment.id)
      }
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('AbacatePay webhook error:', e)
    return NextResponse.json({ ok: true }) // always 200 — never let AbacatePay retry-storm on our bugs
  }
}
