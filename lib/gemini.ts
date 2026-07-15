const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models'

// O Google descontinua modelos para contas novas (ex: gemini-2.5-flash retornou
// 404 "no longer available to new users"). Por isso tentamos uma cadeia de
// modelos, do mais novo para o mais antigo — os aliases "-latest" sempre
// apontam para o flash estável mais recente da conta.
const MODELS_FULL = ['gemini-flash-latest', 'gemini-3-flash-preview', 'gemini-2.5-flash', 'gemini-2.0-flash']
const MODELS_FAST = ['gemini-flash-lite-latest', 'gemini-2.5-flash-lite', 'gemini-2.0-flash-lite', 'gemini-flash-latest']

// Erros que valem tentar o próximo modelo da cadeia:
// 404 = modelo indisponível para a conta; 429 = rate limit; 503 = sobrecarga temporária
const RETRIABLE = new Set([404, 429, 503])

export interface GeminiOptions {
  model?: string // modelo preferido (tentado primeiro); a cadeia de fallback continua depois dele
  fast?: boolean // true = usa a cadeia "lite" (respostas curtas, mais rápidas)
  maxOutputTokens?: number
  temperature?: number
  json?: boolean
  timeoutMs?: number
}

async function callModel(
  model: string,
  prompt: string,
  opts: GeminiOptions,
  withThinkingConfig: boolean,
  key: string,
): Promise<{ ok: true; text: string } | { ok: false; status: number; body: string }> {
  const res = await fetch(`${GEMINI_BASE}/${model}:generateContent?key=${key}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        maxOutputTokens: opts.maxOutputTokens ?? 8192,
        temperature: opts.temperature ?? 0.8,
        // Sem "thinking" para respostas mais rápidas dentro do limite da Vercel
        ...(withThinkingConfig ? { thinkingConfig: { thinkingBudget: 0 } } : {}),
        ...(opts.json ? { responseMimeType: 'application/json' } : {}),
      },
    }),
    signal: AbortSignal.timeout(opts.timeoutMs ?? 55_000),
  })

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    return { ok: false, status: res.status, body }
  }
  const data = await res.json()
  const text: string = data.candidates?.[0]?.content?.parts?.map((p: any) => p.text ?? '').join('') ?? ''
  if (!text.trim()) return { ok: false, status: 502, body: 'resposta vazia do modelo' }
  return { ok: true, text }
}

export async function geminiGenerate(prompt: string, opts: GeminiOptions = {}): Promise<string> {
  const key = process.env.GEMINI_API_KEY
  if (!key) throw new Error('GEMINI_API_KEY não configurada')

  const chain = opts.fast ? MODELS_FAST : MODELS_FULL
  const models = opts.model ? [opts.model, ...chain.filter((m) => m !== opts.model)] : chain

  let lastError = ''
  let lastStatus = 0
  // Até 2 passadas pela cadeia: a 2ª cobre sobrecargas temporárias (503/429)
  for (let pass = 0; pass < 2; pass++) {
    if (pass > 0) await new Promise((r) => setTimeout(r, 2000))
    for (const model of models) {
      let attempt = await callModel(model, prompt, opts, true, key)

      // Alguns modelos não aceitam thinkingConfig (400) — tenta de novo sem ele
      if (!attempt.ok && attempt.status === 400 && /thinking/i.test(attempt.body)) {
        attempt = await callModel(model, prompt, opts, false, key)
      }

      if (attempt.ok) return attempt.text

      lastError = `${model} → HTTP ${attempt.status}: ${attempt.body.slice(0, 200)}`
      lastStatus = attempt.status
      if (RETRIABLE.has(attempt.status)) continue
      // Erros como 401/400/500 não melhoram trocando de modelo
      throw new Error(`Gemini API ${attempt.status}: ${attempt.body.slice(0, 300)}`)
    }
  }

  if (lastStatus === 503 || lastStatus === 429) {
    throw new Error('A IA está com alta demanda neste momento. Aguarde alguns segundos e clique em gerar novamente.')
  }
  throw new Error(`Nenhum modelo Gemini disponível para esta conta. Último erro: ${lastError}`)
}

// Extrai JSON de uma resposta que pode vir embrulhada em ```json ... ``` ou
// com texto solto antes/depois do objeto.
export function parseJsonLoose<T = any>(raw: string): T {
  const cleaned = raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '')
  try {
    return JSON.parse(cleaned)
  } catch { /* tenta recortar do primeiro { ao último } */ }
  const start = cleaned.indexOf('{')
  const end = cleaned.lastIndexOf('}')
  if (start >= 0 && end > start) {
    return JSON.parse(cleaned.slice(start, end + 1))
  }
  throw new Error('resposta sem JSON válido')
}
