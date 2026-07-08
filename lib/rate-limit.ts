// Lightweight in-memory sliding-window rate limiter for serverless routes.
// Not distributed (each warm Vercel instance keeps its own counters), but it's
// a real, zero-dependency guard against runaway loops/abuse hitting paid LLM
// APIs (Gemini) with no cost limit — better than no protection at all. If this
// app grows and needs a hard distributed guarantee, swap the Map for
// Upstash/Vercel KV using the same interface.

const hits = new Map<string, number[]>()

export function isRateLimited(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now()
  const timestamps = (hits.get(key) ?? []).filter((t) => now - t < windowMs)

  if (timestamps.length >= limit) {
    hits.set(key, timestamps)
    return true
  }

  timestamps.push(now)
  hits.set(key, timestamps)

  // Prevent unbounded growth across all users sharing this module instance.
  if (hits.size > 5000) {
    for (const [k, v] of hits) {
      if (v.every((t) => now - t > windowMs)) hits.delete(k)
    }
  }

  return false
}
