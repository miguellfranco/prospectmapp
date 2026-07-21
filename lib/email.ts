import { Resend } from 'resend'

interface SendAccessEmailParams {
  to: string
  planLabel: string
  isNewAccount: boolean
  password: string | null
}

// Degrades gracefully (logs instead of throwing) if RESEND_API_KEY / FROM
// address aren't configured yet — payment/account creation must not fail
// just because email delivery isn't wired up.
export async function sendAccessEmail({ to, planLabel, isNewAccount, password }: SendAccessEmailParams) {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.RESEND_FROM_EMAIL
  const loginUrl = `${process.env.NEXTAUTH_URL || 'https://infobookapp.vercel.app'}/login`

  if (!apiKey || !from) {
    console.error(`RESEND_API_KEY/RESEND_FROM_EMAIL not configured — could not email access to ${to}. Plan: ${planLabel}, newAccount: ${isNewAccount}`)
    return
  }

  const resend = new Resend(apiKey)

  const subject = isNewAccount ? 'Seu acesso ao InfoBook está pronto!' : 'Pagamento confirmado — plano renovado!'
  const html = isNewAccount
    ? `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2>Pagamento confirmado! 🎉</h2>
        <p>Seu plano <strong>${planLabel}</strong> foi ativado. Sua conta já está pronta:</p>
        <p><strong>E-mail:</strong> ${to}<br/><strong>Senha:</strong> ${password}</p>
        <p><a href="${loginUrl}" style="display:inline-block;padding:12px 24px;background:#7c3aed;color:#fff;text-decoration:none;border-radius:8px;">Entrar agora</a></p>
        <p style="color:#666;font-size:13px;">Recomendamos trocar sua senha após o primeiro acesso, em Configurações.</p>
      </div>
    `
    : `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2>Pagamento confirmado! 🎉</h2>
        <p>Seu plano foi renovado para <strong>${planLabel}</strong>. Sua conta continua com o mesmo login de sempre.</p>
        <p><a href="${loginUrl}" style="display:inline-block;padding:12px 24px;background:#7c3aed;color:#fff;text-decoration:none;border-radius:8px;">Entrar agora</a></p>
      </div>
    `

  try {
    await resend.emails.send({ from, to, subject, html })
  } catch (e) {
    console.error('Failed to send access email via Resend:', e)
  }
}
