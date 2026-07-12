'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Sparkles, Layers, TrendingUp, CalendarDays, CalendarRange, ExternalLink, Loader2, Plug,
} from 'lucide-react'
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
} from 'recharts'
import { PageHeader, EmptyState, CountUp, brl } from '@/components/lz/ui'
import { StructureStatusBadge } from '@/components/lz/ebookai-ui'

interface PanelData {
  revenue: { today: number; last7: number; last30: number }
  byGateway: Record<string, number>
  daily: { date: string; total: number }[]
  salesCount30d: number
  structures: {
    id: string; niche: string; subNiche: string | null; title: string; status: string
    createdAt: string; productName: string | null; price: number | null
    checkoutUrl: string | null; landingSlug: string | null
  }[]
}

export default function PainelPage() {
  const [data, setData] = useState<PanelData | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/painel')
      .then(async (r) => {
        const d = await r.json().catch(() => null)
        if (!r.ok) throw new Error(d?.error ?? 'Erro ao carregar o painel.')
        setData(d)
      })
      .catch((e) => setError(e.message))
  }, [])

  if (error) {
    return (
      <div className="p-6 md:p-10">
        <PageHeader title="Painel" />
        <div className="lz-card p-6 text-sm" style={{ color: 'var(--danger)' }}>{error}</div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="p-6 md:p-10 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin" size={28} style={{ color: 'var(--purple-core)' }} />
      </div>
    )
  }

  const cards = [
    { label: 'Faturamento hoje', value: data.revenue.today, icon: TrendingUp },
    { label: 'Últimos 7 dias', value: data.revenue.last7, icon: CalendarDays },
    { label: 'Últimos 30 dias', value: data.revenue.last30, icon: CalendarRange },
  ]

  const gateways = Object.entries(data.byGateway)
  const chartData = data.daily.map((d) => ({ ...d, label: d.date.slice(8, 10) + '/' + d.date.slice(5, 7) }))

  return (
    <div className="p-6 md:p-10 pb-24 md:pb-10 max-w-7xl mx-auto">
      <PageHeader
        title="Painel"
        highlight="EbookAI"
        description="Acompanhe o faturamento dos seus infoprodutos e continue suas estruturas."
        actions={
          <Link href="/estruturas/nova" className="lz-btn-primary inline-flex items-center gap-2">
            <Sparkles size={16} /> Nova Estrutura
          </Link>
        }
      />

      {/* Cards de faturamento */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {cards.map((c) => (
          <div key={c.label} className="lz-card lz-card-hover p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs uppercase tracking-wider font-semibold" style={{ color: 'var(--text-secondary)' }}>{c.label}</span>
              <c.icon size={18} style={{ color: 'var(--purple-core)' }} />
            </div>
            <div className="text-3xl font-black font-grotesk" style={{ color: 'var(--text-primary)' }}>
              R$ <CountUp value={c.value} decimals={2} />
            </div>
          </div>
        ))}
      </div>

      {/* Gráfico + breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-10">
        <div className="lz-card p-6 lg:col-span-2">
          <p className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Faturamento diário — últimos 30 dias</p>
          {data.salesCount30d === 0 ? (
            <div className="py-10 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
              Nenhuma venda registrada ainda. Assim que seu gateway enviar a primeira venda pelo webhook
              (configure em <Link href="/integracoes" className="underline" style={{ color: 'var(--purple-soft)' }}>Integrações</Link>), o gráfico ganha vida.
            </div>
          ) : (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#7c3aed" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="#7c3aed" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#181830" vertical={false} />
                  <XAxis dataKey="label" tick={{ fill: '#52525b', fontSize: 11 }} tickLine={false} axisLine={false} interval={4} />
                  <YAxis tick={{ fill: '#52525b', fontSize: 11 }} tickLine={false} axisLine={false} width={56}
                    tickFormatter={(v: number) => `R$${v}`} />
                  <Tooltip
                    contentStyle={{ background: '#111126', border: '1px solid #181830', borderRadius: 12, fontSize: 12 }}
                    labelStyle={{ color: '#a1a1aa' }}
                    formatter={(value: any) => [brl(Number(value)), 'Faturamento']}
                  />
                  <Area type="monotone" dataKey="total" stroke="#7c3aed" strokeWidth={2} fill="url(#rev)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="lz-card p-6">
          <p className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Por gateway (30 dias)</p>
          {gateways.length === 0 ? (
            <div className="py-8 text-center">
              <Plug size={32} className="mx-auto mb-3" style={{ color: 'var(--purple-core)', opacity: 0.35 }} />
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Sem vendas por gateway ainda.</p>
              <Link href="/integracoes" className="text-xs underline mt-2 inline-block" style={{ color: 'var(--purple-soft)' }}>
                Conectar Kiwify / Hotmart
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {gateways.map(([gw, total]) => (
                <div key={gw} className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'var(--bg-elevated)' }}>
                  <span className="text-sm font-medium capitalize" style={{ color: 'var(--text-primary)' }}>{gw}</span>
                  <span className="font-jet text-sm" style={{ color: 'var(--purple-soft)' }}>{brl(total)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Estruturas */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-grotesk" style={{ color: 'var(--text-primary)' }}>Suas Estruturas</h2>
        <Link href="/estruturas" className="text-sm" style={{ color: 'var(--purple-soft)' }}>Ver todas →</Link>
      </div>

      {data.structures.length === 0 ? (
        <div className="lz-card">
          <EmptyState
            icon={Layers}
            title="Nenhuma estrutura ainda"
            subtitle="Crie sua primeira estrutura: a IA gera o e-book, a página de vendas e a mensagem de divulgação em 4 passos."
            action={
              <Link href="/estruturas/nova" className="lz-btn-primary inline-flex items-center gap-2">
                <Sparkles size={16} /> Criar primeira estrutura
              </Link>
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.structures.map((s) => (
            <Link key={s.id} href={`/estruturas/${s.id}`} className="lz-card lz-card-hover p-5 block">
              <div className="flex items-start justify-between gap-3 mb-3">
                <span className="text-xs font-jet uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>{s.niche}</span>
                <StructureStatusBadge status={s.status} />
              </div>
              <p className="font-semibold text-sm mb-2 line-clamp-2" style={{ color: 'var(--text-primary)' }}>
                {s.productName ?? s.title}
              </p>
              <div className="flex items-center justify-between mt-4">
                <span className="font-jet text-sm" style={{ color: 'var(--purple-soft)' }}>
                  {s.price != null ? brl(s.price) : '—'}
                </span>
                {s.landingSlug && (
                  <span className="inline-flex items-center gap-1 text-xs" style={{ color: 'var(--success)' }}>
                    <ExternalLink size={12} /> página no ar
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
