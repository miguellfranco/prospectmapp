import crypto from 'crypto'

// Chave de 32 bytes derivada de INTEGRATION_CRYPTO_KEY (ou NEXTAUTH_SECRET como
// fallback, que já existe na Vercel) — usada para criptografar credenciais de
// gateways de pagamento antes de salvar no banco.
function getKey(): Buffer {
  const secret = process.env.INTEGRATION_CRYPTO_KEY || process.env.NEXTAUTH_SECRET
  if (!secret) throw new Error('Defina INTEGRATION_CRYPTO_KEY (ou NEXTAUTH_SECRET) para criptografar credenciais')
  return crypto.createHash('sha256').update(secret).digest()
}

export function encryptJson(data: unknown): string {
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', getKey(), iv)
  const enc = Buffer.concat([cipher.update(JSON.stringify(data), 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return [iv.toString('base64'), tag.toString('base64'), enc.toString('base64')].join('.')
}

export function decryptJson<T = Record<string, string>>(payload: string): T {
  const [ivB64, tagB64, dataB64] = payload.split('.')
  if (!ivB64 || !tagB64 || !dataB64) throw new Error('Payload criptografado inválido')
  const decipher = crypto.createDecipheriv('aes-256-gcm', getKey(), Buffer.from(ivB64, 'base64'))
  decipher.setAuthTag(Buffer.from(tagB64, 'base64'))
  const dec = Buffer.concat([decipher.update(Buffer.from(dataB64, 'base64')), decipher.final()])
  return JSON.parse(dec.toString('utf8'))
}
