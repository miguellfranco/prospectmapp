// Publicação da landing page na conta Netlify DO USUÁRIO (token dele,
// hospedagem dele, custo zero para a plataforma). Usa o método de deploy por
// digest da API oficial: criar site → declarar arquivos → enviar o index.html.
import crypto from 'crypto'

const API = 'https://api.netlify.com/api/v1'

export async function testNetlifyToken(token: string): Promise<{ ok: boolean; message: string }> {
  try {
    const res = await fetch(`${API}/user`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(15_000),
    })
    if (res.ok) return { ok: true, message: 'Conexão com a Netlify validada com sucesso.' }
    return { ok: false, message: `A Netlify recusou o token (HTTP ${res.status}). Gere um novo em app.netlify.com → User settings → Applications.` }
  } catch (e: any) {
    return { ok: false, message: `Não foi possível conectar à Netlify: ${e?.message ?? 'erro de rede'}` }
  }
}

export async function deployToNetlify(
  token: string,
  siteId: string | null,
  html: string,
): Promise<{ siteId: string; url: string }> {
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }

  // 1. Garante o site (reusa o mesmo para manter a URL entre republicações)
  let site: any = null
  if (siteId) {
    const res = await fetch(`${API}/sites/${siteId}`, { headers, signal: AbortSignal.timeout(15_000) })
    if (res.ok) site = await res.json()
  }
  if (!site) {
    const res = await fetch(`${API}/sites`, {
      method: 'POST', headers, body: JSON.stringify({}), signal: AbortSignal.timeout(20_000),
    })
    if (!res.ok) throw new Error(`Netlify não deixou criar o site (HTTP ${res.status}). Confira o token em Integrações.`)
    site = await res.json()
  }

  // 2. Declara o deploy com o hash do arquivo
  const sha1 = crypto.createHash('sha1').update(html, 'utf8').digest('hex')
  const deployRes = await fetch(`${API}/sites/${site.id}/deploys`, {
    method: 'POST', headers,
    body: JSON.stringify({ files: { '/index.html': sha1 } }),
    signal: AbortSignal.timeout(30_000),
  })
  if (!deployRes.ok) throw new Error(`Netlify recusou o deploy (HTTP ${deployRes.status}).`)
  const deploy = await deployRes.json()

  // 3. Envia o conteúdo (só é pedido quando o hash é novo)
  if (Array.isArray(deploy.required) && deploy.required.includes(sha1)) {
    const upload = await fetch(`${API}/deploys/${deploy.id}/files/index.html`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/octet-stream' },
      body: html,
      signal: AbortSignal.timeout(60_000),
    })
    if (!upload.ok) throw new Error(`Falha ao enviar o arquivo para a Netlify (HTTP ${upload.status}).`)
  }

  const url: string = site.ssl_url || site.url || deploy.ssl_url || deploy.url
  if (!url) throw new Error('A Netlify não retornou a URL do site.')
  return { siteId: site.id, url }
}
