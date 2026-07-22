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

// Diferente de sendAccessEmail, essa NÃO engole o erro — usada só pelo botão
// de teste do Super Admin, pra confirmar de verdade se o Resend está
// entregando e-mails (chave válida, domínio do remetente verificado, etc.).
export async function sendTestEmail(to: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.RESEND_FROM_EMAIL
  if (!apiKey || !from) {
    throw new Error('RESEND_API_KEY ou RESEND_FROM_EMAIL não configurados na Vercel.')
  }

  const resend = new Resend(apiKey)
  const result = await resend.emails.send({
    from,
    to,
    subject: 'InfoBook — Teste de e-mail (Super Admin)',
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2>✅ O Resend está funcionando!</h2>
        <p>Este é um e-mail de teste disparado pelo Super Admin do InfoBook para confirmar que o envio de e-mails
        (login de novos clientes, renovações) está entregando de verdade.</p>
        <p style="color:#666;font-size:13px;">Enviado em ${new Date().toLocaleString('pt-BR')}.</p>
      </div>
    `,
  })

  if (result.error) {
    throw new Error(`Resend recusou o envio: ${result.error.message || JSON.stringify(result.error)}`)
  }
}
