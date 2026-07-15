'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Sparkles, Layers, TrendingUp, CalendarDays, CalendarRange, ExternalLink, Loader2, Plug,
  BookOpen, Globe, ShoppingCart, ArrowRight, CheckCircle2, Circle, Wallet,
} from 'lucide-react'
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
} from 'recharts'
import { PageHeader, EmptyState, CountUp, brl } from '@/components/lz/ui'
import { StructureStatusBadge } from '@/components/lz/ebookai-ui'

interface PanelData {
  revenue: { today: number; last7: number; last30: number; allTime: number }
  byGateway: Record<string, number>
  daily: { date: string; total: number }[]
  salesCount30d: number
  salesCountAllTime: number
  counts: { structures: number; ebooks: number; landings: number; integrations: number }
  userName: string | null
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

  const firstName = data.userName?.split(' ')[0]
  const revenueCards = [
    { label: 'Hoje', value: data.revenue.today, icon: TrendingUp, accent: '#7c3aed' },
    { label: 'Últimos 7 dias', value: data.revenue.last7, icon: CalendarDays, accent: '#8b5cf6' },
    { label: 'Últimos 30 dias', value: data.revenue.last30, icon: CalendarRange, accent: '#a78bfa' },
    { label: 'Total acumulado', value: data.revenue.allTime, icon: Wallet, accent: '#10b981' },
  ]

  const funnelStats = [
    { label: 'Estruturas', value: data.counts.structures, icon: Layers, href: '/estruturas' },
    { label: 'E-books gerados', value: data.counts.ebooks, icon: BookOpen, href: '/estruturas' },
    { label: 'Páginas no ar', value: data.counts.landings, icon: Globe, href: '/estruturas' },
    { label: 'Vendas registradas', value: data.salesCountAllTime, icon: ShoppingCart, href: '/integracoes' },
  ]

  const checklist = [
    { done: data.counts.structures > 0, label: 'Criar sua primeira estrutura', href: '/estruturas/nova' },
    { done: data.counts.ebooks > 0, label: 'Gerar um e-book com IA', href: '/estruturas/nova' },
    { done: data.counts.landings > 0, label: 'Publicar sua página de vendas', href: '/estruturas' },
    { done: data.counts.integrations > 0, label: 'Conectar Kiwify ou Hotmart', href: '/integracoes' },
    { done: data.salesCountAllTime > 0, label: 'Receber sua primeira venda 🎉', href: '/integracoes' },
  ]
  const allDone = checklist.every((c) => c.done)
  const doneCount = checklist.filter((c) => c.done).length

  const gateways = Object.entries(data.byGateway)
  const chartData = data.daily.map((d) => ({ ...d, label: d.date.slice(8, 10) + '/' + d.date.slice(5, 7) }))

  return (
    <div className="p-6 md:p-10 pb-24 md:pb-10 max-w-7xl mx-auto">
      <PageHeader
        title={firstName ? `Olá, ${firstName}` : 'Painel'}
        highlight="👋"
        description="Aqui está o resumo do seu império de infoprodutos."
        actions={
          <Link href="/estruturas/nova" className="lz-btn-primary inline-flex items-center gap-2">
            <Sparkles size={16} /> Nova Estrutura
          </Link>
        }
      />

      {/* Cards de faturamento */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        {revenueCards.map((c) => (
          <div
            key={c.label}
            className="lz-card lz-card-hover p-5 relative overflow-hidden"
          >
            <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full pointer-events-none"
              style={{ background: c.accent, opacity: 0.09, filter: 'blur(24px)' }} />
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] uppercase tracking-wider font-semibold" style={{ color: 'var(--text-secondary)' }}>{c.label}</span>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: `${c.accent}1f`, border: `1px solid ${c.accent}40` }}>
                <c.icon size={15} style={{ color: c.accent }} />
              </div>
            </div>
            <div className="text-2xl md:text-[26px] font-black font-grotesk" style={{ color: 'var(--text-primary)' }}>
              R$ <CountUp value={c.value} decimals={2} />
            </div>
          </div>
        ))}
      </div>

      {/* Funil em números */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {funnelStats.map((s) => (
          <Link key={s.label} href={s.href}
            className="flex items-center gap-3 p-4 rounded-2xl transition-all hover:-translate-y-0.5"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)' }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'rgba(124,58,237,0.12)', border: '1px solid var(--purple-border)' }}>
              <s.icon size={16} style={{ color: 'var(--purple-soft)' }} />
            </div>
            <div className="min-w-0">
              <p className="text-xl font-black font-grotesk leading-none" style={{ color: 'var(--text-primary)' }}>
                <CountUp value={s.value} />
              </p>
              <p className="text-[11px] mt-1 truncate" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Gráfico + coluna lateral */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="lz-card p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Faturamento diário — últimos 30 dias</p>
            {data.salesCount30d > 0 && (
              <span className="lz-badge lz-badge-new">{data.salesCount30d} venda{data.salesCount30d > 1 ? 's' : ''}</span>
            )}
          </div>
          <div className="h-56 relative">
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
                  domain={data.salesCount30d === 0 ? [0, 100] : ['auto', 'auto']}
                  tickFormatter={(v: number) => `R$${v}`} />
                <Tooltip
                  contentStyle={{ background: '#111126', border: '1px solid #181830', borderRadius: 12, fontSize: 12 }}
                  labelStyle={{ color: '#a1a1aa' }}
                  formatter={(value: any) => [brl(Number(value)), 'Faturamento']}
                />
                <Area type="monotone" dataKey="total" stroke="#7c3aed" strokeWidth={2} fill="url(#rev)" />
              </AreaChart>
            </ResponsiveContainer>

            {data.salesCount30d === 0 && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center px-6 py-4 rounded-2xl pointer-events-auto"
                  style={{ background: 'rgba(10,10,24,0.85)', border: '1px solid var(--purple-border)', backdropFilter: 'blur(6px)' }}>
                  <p className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Seu gráfico está esperando a primeira venda</p>
                  <p className="text-xs mb-3" style={{ color: 'var(--text-secondary)' }}>
                    Conecte seu gateway e configure o webhook — cada venda aparece aqui na hora.
                  </p>
                  <Link href="/integracoes" className="text-xs font-bold inline-flex items-center gap-1" style={{ color: 'var(--purple-soft)' }}>
                    Configurar agora <ArrowRight size={12} />
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {/* Checklist de primeiros passos (some quando tudo estiver feito) */}
          {!allDone && (
            <div className="lz-card p-6">
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Primeiros passos</p>
                <span className="font-jet text-xs" style={{ color: 'var(--purple-soft)' }}>{doneCount}/{checklist.length}</span>
              </div>
              <div className="h-1.5 rounded-full mb-4 overflow-hidden" style={{ background: 'var(--bg-elevated)' }}>
                <div className="h-full rounded-full transition-all"
                  style={{ width: `${(doneCount / checklist.length) * 100}%`, background: 'linear-gradient(90deg, #7c3aed, #a78bfa)' }} />
              </div>
              <div className="space-y-1">
                {checklist.map((c) => (
                  <Link key={c.label} href={c.href}
                    className="flex items-center gap-2.5 px-2 py-2 rounded-lg transition-colors hover:bg-white/[0.04]">
                    {c.done
                      ? <CheckCircle2 size={16} className="shrink-0" style={{ color: 'var(--success)' }} />
                      : <Circle size={16} className="shrink-0" style={{ color: 'var(--text-muted)' }} />}
                    <span className="text-[13px]" style={{
                      color: c.done ? 'var(--text-muted)' : 'var(--text-primary)',
                      textDecoration: c.done ? 'line-through' : 'none',
                    }}>
                      {c.label}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Por gateway */}
          <div className="lz-card p-6 flex-1">
            <p className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Por gateway (30 dias)</p>
            {gateways.length === 0 ? (
              <div className="py-4 text-center">
                <Plug size={28} className="mx-auto mb-2" style={{ color: 'var(--purple-core)', opacity: 0.35 }} />
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Sem vendas por gateway ainda.</p>
                <Link href="/integracoes" className="text-xs underline mt-1.5 inline-block" style={{ color: 'var(--purple-soft)' }}>
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
