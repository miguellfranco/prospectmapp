const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models'

// O Google descontinua modelos para contas novas (ex: gemini-2.5-flash retornou
// 404 "no longer available to new users"). Por isso tentamos uma cadeia de
// modelos, do mais novo para o mais antigo — os aliases "-latest" sempre
// apontam para o flash estável mais recente da conta.
const MODELS_FULL = ['gemini-flash-latest', 'gemini-2.5-flash', 'gemini-2.0-flash']
const MODELS_FAST = ['gemini-flash-lite-latest', 'gemini-2.5-flash-lite', 'gemini-2.0-flash-lite', 'gemini-flash-latest']

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
  for (const model of models) {
    let attempt = await callModel(model, prompt, opts, true, key)

    // Alguns modelos não aceitam thinkingConfig (400) — tenta de novo sem ele
    if (!attempt.ok && attempt.status === 400 && /thinking/i.test(attempt.body)) {
      attempt = await callModel(model, prompt, opts, false, key)
    }

    if (attempt.ok) return attempt.text

    lastError = `${model} → HTTP ${attempt.status}: ${attempt.body.slice(0, 200)}`
    // 404 = modelo indisponível para esta conta → tenta o próximo da cadeia
    if (attempt.status === 404) continue
    // Qualquer outro erro (401, 429, 500...) não melhora trocando de modelo
    throw new Error(`Gemini API ${attempt.status}: ${attempt.body.slice(0, 300)}`)
  }

  throw new Error(`Nenhum modelo Gemini disponível para esta conta. Último erro: ${lastError}`)
}

// Extrai JSON de uma resposta que pode vir embrulhada em ```json ... ```
export function parseJsonLoose<T = any>(raw: string): T {
  const cleaned = raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '')
  return JSON.parse(cleaned)
}
