import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const host = req.headers.get('host') || 'localhost:3000'
  const protocol = req.headers.get('x-forwarded-proto') || 'http'
  const baseUrl = `${protocol}://${host}`

  const masterEmail = process.env.MASTER_EMAIL || 'admin@leadzap.com.br'
  const masterPassword = process.env.MASTER_PASSWORD || 'leadzap_master_2026'

  try {
    const res = await fetch(`${baseUrl}/api/auth/callback/credentials`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        email: masterEmail,
        password: masterPassword,
        redirect: 'false',
        json: 'true',
      }),
    })

    if (!res.ok) {
      return NextResponse.json({ error: 'Erro ao autenticar no servidor de auth.' }, { status: 500 })
    }

    const setCookieHeaders = res.headers.getSetCookie()
    if (!setCookieHeaders || setCookieHeaders.length === 0) {
      return NextResponse.json({ error: 'Nenhum cookie de sessão foi retornado.' }, { status: 500 })
    }

    const response = NextResponse.redirect(new URL('/dashboard', baseUrl))

    for (const cookieStr of setCookieHeaders) {
      response.headers.append('Set-Cookie', cookieStr)
    }

    return response
  } catch (error: any) {
    return NextResponse.json({ error: `Falha no bypass: ${error.message}` }, { status: 500 })
  }
}
