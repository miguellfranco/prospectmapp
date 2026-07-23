import crypto from 'crypto'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'
import { PLAN_DURATION_DAYS, PLAN_LABELS } from '@/lib/abacatepay'
import { sendAccessEmail } from '@/lib/email'

export function generatePassword(): string {
  return crypto.randomBytes(9).toString('base64url') // ~12 char random password
}

function genReferralCode(len = 8) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let s = ''
  for (let i = 0; i < len; i++) s += chars[Math.floor(Math.random() * chars.length)]
  return s
}

// Core plan-granting logic, shared by every payment source (AbacatePay
// webhook/polling, Cakto webhook). Creates the account if needed (random
// password), stacks renewal time on top of unexpired plans, and emails access.
export async function grantPlanByEmail(params: { email: string; plan: string; phone?: string | null; name?: string | null }) {
  const email = params.email.trim().toLowerCase()
  const durationDays = PLAN_DURATION_DAYS[params.plan] ?? 30
  const existingUser = await prisma.user.findUnique({ where: { email } })

  let user
  let plainPassword: string | null = null
  let isNewAccount: boolean

  if (existingUser) {
    isNewAccount = false
    const now = new Date()
    // Renewals stack on top of remaining time if the plan hasn't expired yet,
    // instead of discarding time the customer already paid for.
    const currentExpiry = existingUser.planExpiresAt && existingUser.planExpiresAt > now ? existingUser.planExpiresAt : now
    const newExpiry = new Date(currentExpiry.getTime() + durationDays * 24 * 60 * 60 * 1000)
    user = await prisma.user.update({
      where: { id: existingUser.id },
      data: {
        plan: params.plan,
        planStatus: 'active',
        planExpiresAt: newExpiry,
        whatsappNumber: existingUser.whatsappNumber || params.phone || undefined,
      },
    })
  } else {
    isNewAccount = true
    plainPassword = generatePassword()
    const passwordHash = await bcrypt.hash(plainPassword, 10)
    let referralCode = genReferralCode()
    for (let i = 0; i < 5; i++) {
      const taken = await prisma.user.findUnique({ where: { referralCode } })
      if (!taken) break
      referralCode = genReferralCode()
    }
    user = await prisma.user.create({
      data: {
        email,
        name: params.name?.trim() || email.split('@')[0],
        passwordHash,
        plan: params.plan,
        planStatus: 'active',
        planExpiresAt: new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000),
        whatsappNumber: params.phone || null,
        referralCode,
        leadsResetDate: new Date(),
      },
    })
  }

  await sendAccessEmail({
    to: email,
    planLabel: PLAN_LABELS[params.plan] ?? params.plan,
    isNewAccount,
    password: plainPassword,
  })

  return { user, isNewAccount }
}

// Called once a PixPayment is confirmed PAID (from the webhook, or the status
// polling fallback). Idempotent: PixPayment.accessGrantedAt guards against
// double-processing if both the webhook and the polling fallback fire.
export async function grantAccessForPayment(paymentId: string) {
  const payment = await prisma.pixPayment.findUnique({ where: { id: paymentId } })
  if (!payment) throw new Error(`PixPayment ${paymentId} not found`)
  if (payment.accessGrantedAt) return // already processed

  const { user } = await grantPlanByEmail({ email: payment.email, plan: payment.plan, phone: payment.phone })

  await prisma.pixPayment.update({
    where: { id: payment.id },
    data: { status: 'paid', paidAt: new Date(), accessGrantedAt: new Date(), userId: user.id },
  })

  return user
}
