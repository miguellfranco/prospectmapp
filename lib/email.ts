import { Resend } from 'resend'
import nodemailer from 'nodemailer'

interface SendAccessEmailParams {
  to: string
  planLabel: string
  isNewAccount: boolean
  password: string | null
}

// Envia um e-mail já pronto (subject+html) usando o que estiver configurado:
// Gmail via SMTP tem prioridade (ponte temporária, sem exigir domínio
// verificado) — quando GMAIL_USER/GMAIL_APP_PASSWORD não estiverem definidos,
// cai para o Resend (que exige domínio verificado para mandar a destinatários
// além do dono da conta). Lança erro se nenhum dos dois estiver configurado
// ou se o envio falhar — quem chama decide se engole o erro ou não.
async function sendViaConfiguredProvider(to: string, subject: string, html: string): Promise<void> {
  const gmailUser = process.env.GMAIL_USER
  const gmailPass = process.env.GMAIL_APP_PASSWORD

  if (gmailUser && gmailPass) {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: gmailUser, pass: gmailPass },
    })
    await transporter.sendMail({ from: `InfoBook <${gmailUser}>`, to, subject, html })
    return
  }

  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.RESEND_FROM_EMAIL
  if (apiKey && from) {
    const resend = new Resend(apiKey)
    const result = await resend.emails.send({ from, to, subject, html })
    if (result.error) {
      throw new Error(`Resend recusou o envio: ${result.error.message || JSON.stringify(result.error)}`)
    }
    return
  }

  throw new Error('Nenhum provedor de e-mail configurado (GMAIL_USER/GMAIL_APP_PASSWORD ou RESEND_API_KEY/RESEND_FROM_EMAIL).')
}

function buildAccessEmail({ to, planLabel, isNewAccount, password }: SendAccessEmailParams): { subject: string; html: string } {
  const loginUrl = `${process.env.NEXTAUTH_URL || 'https://infobookapp.vercel.app'}/login`

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

  return { subject, html }
}

// Degrada graciosamente (só loga) se nada estiver configurado ou o envio
// falhar — criação de conta / confirmação de pagamento não pode travar só
// porque o e-mail não saiu.
export async function sendAccessEmail(params: SendAccessEmailParams) {
  const { subject, html } = buildAccessEmail(params)
  try {
    await sendViaConfiguredProvider(params.to, subject, html)
  } catch (e) {
    console.error(`Failed to send access email to ${params.to}:`, e)
  }
}

// Mesmo e-mail exato de uma compra real (mesmo template), mas NÃO engole o
// erro — usada só pela prévia do Super Admin, pra saber com certeza se saiu.
export async function sendAccessEmailOrThrow(params: SendAccessEmailParams): Promise<void> {
  const { subject, html } = buildAccessEmail(params)
  await sendViaConfiguredProvider(params.to, subject, html)
}

// Diferente de sendAccessEmail, essa NÃO engole o erro — usada só pelo botão
// de teste do Super Admin, pra confirmar de verdade se o e-mail está saindo.
export async function sendTestEmail(to: string): Promise<void> {
  const provider = process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD ? 'Gmail' : 'Resend'
  await sendViaConfiguredProvider(
    to,
    'InfoBook — Teste de e-mail (Super Admin)',
    `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2>✅ O envio de e-mail está funcionando! (via ${provider})</h2>
        <p>Este é um e-mail de teste disparado pelo Super Admin do InfoBook para confirmar que o envio de e-mails
        (login de novos clientes, renovações) está entregando de verdade.</p>
        <p style="color:#666;font-size:13px;">Enviado em ${new Date().toLocaleString('pt-BR')}.</p>
      </div>
    `,
  )
}
