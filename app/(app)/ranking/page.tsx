'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Crown, Trophy, Users } from 'lucide-react'
import { PageHeader, brl } from '@/components/lz/ui'
import { LiveSalesToast } from '@/components/lz/live-sales-toast'

export default function RankingPage() {
  const [ranking, setRanking] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/ranking')
      .then((r) => (r.ok ? r.json() : { ranking: [] }))
      .then((d) => {
        setRanking(d?.ranking ?? [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const top3 = ranking.slice(0, 3)
  const rest = ranking.slice(3)

  const podiumGradients = [
    "linear-gradient(135deg, #7c3aed, #a855f7)", // 1st Place (purple/violet)
    "linear-gradient(135deg, #3b82f6, #8b5cf6)", // 2nd Place (blue)
    "linear-gradient(135deg, #ec4899, #8b5cf6)", // 3rd Place (pink)
  ]

  // Extract initials for avatar
  function getInitials(name: string) {
    const parts = name.split(' ')
    const first = parts[0]?.charAt(0) || ''
    const last = parts[parts.length - 1]?.charAt(0) || ''
    return (first + last).toUpperCase()
  }

  return (
    <div>
      <LiveSalesToast />
      <PageHeader 
        title="Ranking de" 
        highlight="Vendedores" 
        description="Acompanhe a classificação em tempo real dos maiores produtores da plataforma este mês." 
      />

      {loading ? (
        <div className="space-y-4">
          <div className="h-64 rounded-xl skeleton-shimmer" />
          <div className="h-32 rounded-xl skeleton-shimmer" />
        </div>
      ) : ranking.length === 0 ? (
        <div className="lz-card p-10 text-center">
          <Trophy size={48} style={{ color: 'var(--purple-core)', opacity: 0.3 }} className="mx-auto mb-3" />
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Nenhuma venda registrada este mês ainda.</p>
        </div>
      ) : (
        <div>
          {/* Visual Podium for Top 3 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 items-end">
            {/* 2nd Place */}
            {top3[1] && (
              <motion.div 
                initial={{ opacity: 0, y: 15 }} 
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="lz-card p-5 text-center flex flex-col items-center justify-between min-h-[220px]"
                style={{ borderColor: 'rgba(59, 130, 246, 0.3)', background: 'var(--bg-secondary)' }}
              >
                <div className="flex flex-col items-center">
                  <div className="h-7 w-7 rounded-full bg-slate-400 text-slate-900 flex items-center justify-center font-bold text-xs mb-3 shadow">
                    2°
                  </div>
                  <div 
                    className="h-14 w-14 rounded-full flex items-center justify-center font-grotesk font-bold text-lg text-white mb-2"
                    style={{ background: podiumGradients[1] }}
                  >
                    {getInitials(top3[1].name)}
                  </div>
                  <h3 className="font-grotesk font-semibold text-sm truncate max-w-full" style={{ color: 'var(--text-primary)' }}>
                    {top3[1].name}
                  </h3>
                </div>
                <div className="mt-3">
                  <p className="text-xs font-jet mt-0.5 text-glow font-bold" style={{ color: 'var(--success)' }}>
                    {brl(top3[1].revenue)}
                  </p>
                </div>
              </motion.div>
            )}

            {/* 1st Place (Tallest, center) - Rotating Glowing Gold Crown (Section 3) */}
            {top3[0] && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }}
                className="lz-card p-6 text-center flex flex-col items-center justify-between min-h-[260px] relative order-first md:order-none"
                style={{ 
                  borderColor: 'var(--purple-core)', 
                  background: 'var(--bg-elevated)',
                  boxShadow: '0 8px 30px rgba(124, 58, 237, 0.15)'
                }}
              >
                {/* Rotating Glowing Crown */}
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                  className="absolute -top-7 text-yellow-500 drop-shadow-[0_0_15px_rgba(245,158,11,0.85)]"
                >
                  <Crown className="w-8 h-8" />
                </motion.div>

                <div className="flex flex-col items-center mt-2">
                  <div className="h-7 w-7 rounded-full bg-yellow-500 text-yellow-950 flex items-center justify-center font-bold text-xs mb-3 shadow">
                    1°
                  </div>
                  <div 
                    className="h-16 w-16 rounded-full flex items-center justify-center font-grotesk font-bold text-xl text-white mb-2 shadow-lg"
                    style={{ 
                      background: podiumGradients[0],
                      boxShadow: '0 0 20px rgba(124, 58, 237, 0.4)'
                    }}
                  >
                    {getInitials(top3[0].name)}
                  </div>
                  <h3 className="font-grotesk font-bold text-base truncate max-w-full" style={{ color: 'var(--text-primary)' }}>
                    {top3[0].name}
                  </h3>
                </div>
                <div className="mt-3">
                  <p className="text-sm font-jet mt-0.5 text-glow font-bold" style={{ color: 'var(--success)' }}>
                    {brl(top3[0].revenue)}
                  </p>
                </div>
              </motion.div>
            )}

            {/* 3rd Place */}
            {top3[2] && (
              <motion.div 
                initial={{ opacity: 0, y: 15 }} 
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="lz-card p-5 text-center flex flex-col items-center justify-between min-h-[200px]"
                style={{ borderColor: 'rgba(236, 72, 153, 0.3)', background: 'var(--bg-secondary)' }}
              >
                <div className="flex flex-col items-center">
                  <div className="h-7 w-7 rounded-full bg-amber-700 text-amber-100 flex items-center justify-center font-bold text-xs mb-3 shadow">
                    3°
                  </div>
                  <div 
                    className="h-12 w-12 rounded-full flex items-center justify-center font-grotesk font-bold text-sm text-white mb-2"
                    style={{ background: podiumGradients[2] }}
                  >
                    {getInitials(top3[2].name)}
                  </div>
                  <h3 className="font-grotesk font-semibold text-sm truncate max-w-full" style={{ color: 'var(--text-primary)' }}>
                    {top3[2].name}
                  </h3>
                </div>
                <div className="mt-3">
                  <p className="text-xs font-jet mt-0.5 text-glow font-bold" style={{ color: 'var(--success)' }}>
                    {brl(top3[2].revenue)}
                  </p>
                </div>
              </motion.div>
            )}
          </div>

          {/* Full Table (Positions 4+) */}
          {rest.length > 0 && (
            <div className="lz-card p-5">
              <h2 className="font-grotesk text-lg mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <Users size={18} style={{ color: 'var(--purple-soft)' }} /> Tabela de Classificação
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-default)' }}>
                      <th className="py-3 px-4 text-xs font-grotesk text-secondary uppercase">Posição</th>
                      <th className="py-3 px-4 text-xs font-grotesk text-secondary uppercase">Vendedor</th>
                      <th className="py-3 px-4 text-xs font-grotesk text-secondary uppercase text-right">Faturamento</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rest.map((r) => (
                      <tr 
                        key={r.userId} 
                        style={{ borderBottom: '1px solid var(--border-default)', background: r.isMe ? 'var(--bg-elevated)' : 'transparent' }}
                        className="hover:bg-[rgba(124,58,237,0.04)] transition-colors"
                      >
                        <td className="py-3.5 px-4 font-jet font-bold text-center w-20">
                          {r.position}°
                        </td>
                        <td className="py-3.5 px-4 font-medium flex items-center gap-3" style={{ color: r.isMe ? 'var(--purple-soft)' : 'var(--text-primary)' }}>
                          <div 
                            className="h-8 w-8 rounded-full flex items-center justify-center font-grotesk font-bold text-[10px] text-white shrink-0"
                            style={{ 
                              background: r.isMe ? 'linear-gradient(135deg, #7c3aed, #ec4899)' : 'var(--border-default)',
                              border: r.isMe ? '1px solid var(--purple-border)' : 'none'
                            }}
                          >
                            {getInitials(r.name)}
                          </div>
                          <span>{r.name} {r.isMe && <span className="text-[10px] bg-[var(--purple-glow)] border border-[var(--purple-border)] text-[var(--purple-soft)] rounded px-1.5 py-0.5 ml-1">VOCÊ</span>}</span>
                        </td>
                        <td className="py-3.5 px-4 font-jet text-right text-success font-bold">
                          {brl(r.revenue)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Sticky user footer if not in top 3 */}
          {ranking.map((r, idx) => r.isMe && (
            <div 
              key="sticky-footer" 
              className="lz-card p-4 mt-6 flex items-center justify-between border-t border-[var(--purple-border)] shadow-2xl"
              style={{ background: 'rgba(13, 13, 26, 0.95)', backdropFilter: 'blur(12px)' }}
            >
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-[var(--purple-core)] text-white flex items-center justify-center font-grotesk font-bold text-xs">
                  {r.position}°
                </div>
                <div>
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Sua classificação atual</p>
                  <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{r.name}</p>
                </div>
              </div>
              <div className="flex gap-6 text-right">
                <div>
                  <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Faturamento</p>
                  <p className="font-jet font-bold text-sm text-success">{brl(r.revenue)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
