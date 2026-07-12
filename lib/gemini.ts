const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models'

export interface GeminiOptions {
  model?: string
  maxOutputTokens?: number
  temperature?: number
  json?: boolean
  timeoutMs?: number
}

export async function geminiGenerate(prompt: string, opts: GeminiOptions = {}): Promise<string> {
  const key = process.env.GEMINI_API_KEY
  if (!key) throw new Error('GEMINI_API_KEY não configurada')
  const model = opts.model ?? 'gemini-2.5-flash'

  const res = await fetch(`${GEMINI_BASE}/${model}:generateContent?key=${key}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        maxOutputTokens: opts.maxOutputTokens ?? 8192,
        temperature: opts.temperature ?? 0.8,
        // Sem "thinking" para respostas mais rápidas dentro do limite da Vercel
        thinkingConfig: { thinkingBudget: 0 },
        ...(opts.json ? { responseMimeType: 'application/json' } : {}),
      },
    }),
    signal: AbortSignal.timeout(opts.timeoutMs ?? 55_000),
  })

  if (!res.ok) {
    const t = await res.text().catch(() => '')
    throw new Error(`Gemini API ${res.status}: ${t.slice(0, 300)}`)
  }

  const data = await res.json()
  const text: string = data.candidates?.[0]?.content?.parts?.map((p: any) => p.text ?? '').join('') ?? ''
  if (!text.trim()) throw new Error('A IA retornou uma resposta vazia. Tente novamente.')
  return text
}

// Extrai JSON de uma resposta que pode vir embrulhada em ```json ... ```
export function parseJsonLoose<T = any>(raw: string): T {
  const cleaned = raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '')
  return JSON.parse(cleaned)
}
