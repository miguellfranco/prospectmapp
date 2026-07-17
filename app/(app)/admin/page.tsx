'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  ShieldAlert, Loader2, Sparkles, Layers, Trash2, RefreshCw, Database, Users, ShoppingCart, Plug, FlaskConical,
} from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader, brl } from '@/components/lz/ui'

interface AdminStatus {
  seedSalesCount: number
  seedSalesTotal: number
  seedRevenue: { today: number; last7: number; last30: number; allTime: number }
  demoStructuresCount: number
  app: { users: number; structures: number; sales: number; integrations: number }
}

function fmtBr(n: number): string {
  return n.toFixed(2).replace('.', ',')
}

function parseBr(s: string): number {
  const n = parseFloat(s.replace(/\./g, '').replace(',', '.'))
  return Number.isFinite(n) && n >= 0 ? n : 0
}

// Painel Super Admin (dev/QA) — acessível apenas pelo MASTER_EMAIL.
// Usuários comuns recebem 404 da API e veem a tela de "não encontrado".
export default function AdminPage() {
  const [status, setStatus] = useState<AdminStatus | null>(null)
  const [denied, setDenied] = useState(false)
  const [busy, setBusy] = useState<string | null>(null)

  const [salesCount, setSalesCount] = useState('40')
  const [salesDays, setSalesDays] = useState('30')
  const [salesAvg, setSalesAvg] = useState('29,90')

  // Faturamento sob medida (por período)
  const [revToday, setRevToday] = useState('0,00')
  const [rev7, setRev7] = useState('0,00')
  const [rev30, setRev30] = useState('0,00')
  const [revAll, setRevAll] = useState('0,00')

  function syncRevenueInputs(s: AdminStatus) {
    setRevToday(fmtBr(s.seedRevenue.today))
    setRev7(fmtBr(s.seedRevenue.last7))
    setRev30(fmtBr(s.seedRevenue.last30))
    setRevAll(fmtBr(s.seedRevenue.allTime))
  }

  function load() {
    fetch('/api/admin')
      .then(async (r) => {
        if (r.status === 404) { setDenied(true); return }
        const d = await r.json().catch(() => null)
        if (!r.ok) throw new Error(d?.error ?? 'Erro ao carregar.')
        setStatus(d.status)
        syncRevenueInputs(d.status)
      })
      .catch((e) => toast.error(e.message))
  }

  useEffect(() => { load() }, [])

  async function run(action: string, extra: Record<string, unknown> = {}) {
    setBusy(action)
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...extra }),
      })
      const d = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(d?.error ?? 'Erro ao executar.')
      if (action === 'seed-sales') toast.success(`${d.created} vendas de demonstração criadas.`)
      if (action === 'set-revenue') toast.success(`Faturamento ajustado com ${d.created} vendas de demonstração.`)
      if (action === 'seed-structures') toast.success(d.created ? `${d.created} estruturas demo criadas.` : 'As 5 estruturas demo já existem.')
      if (action === 'clear') toast.success(`Removido: ${d.removed.sales} vendas e ${d.removed.structures} estruturas demo.`)
      setStatus(d.status)
      syncRevenueInputs(d.status)
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setBusy(null)
    }
  }

  if (denied) {
    return (
      <div className="p-6 md:p-10 flex flex-col items-center justify-center min-h-[60vh] text-center">
        <h1 className="text-2xl font-grotesk mb-2" style={{ color: 'var(--text-primary)' }}>Página não encontrada</h1>
        <Link href="/painel" className="text-sm" style={{ color: 'var(--purple-soft)' }}>← Voltar ao painel</Link>
      </div>
    )
  }

  if (!status) {
    return (
      <div className="p-6 md:p-10 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin" size={28} style={{ color: 'var(--purple-core)' }} />
      </div>
    )
  }

  const appStats = [
    { label: 'Usuários', value: status.app.users, icon: Users },
    { label: 'Estruturas', value: status.app.structures, icon: Layers },
    { label: 'Vendas', value: status.app.sales, icon: ShoppingCart },
    { label: 'Integrações', value: status.app.integrations, icon: Plug },
  ]

  return (
    <div className="p-6 md:p-10 pb-24 md:pb-10 max-w-5xl mx-auto">
      <PageHeader
        title="Super Admin"
        highlight="· Dev & QA"
        description="Configure dados de demonstração para validar layouts, gráficos e funis. Nada disso é visível para usuários finais."
      />

      <div className="p-4 rounded-xl mb-8 flex items-start gap-3 text-sm"
        style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)', color: 'var(--text-secondary)' }}>
        <ShieldAlert size={18} className="shrink-0 mt-0.5" style={{ color: 'var(--warning)' }} />
        <span>
          Dados de demonstração são criados <strong style={{ color: 'var(--text-primary)' }}>apenas na sua conta de admin</strong>,
          marcados internamente (<code>seed_</code> / <code>DEMO</code>) e removíveis com um clique. Contas de usuários reais nunca são tocadas.
        </span>
      </div>

      {/* Visão geral do app */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {appStats.map((s) => (
          <div key={s.label} className="lz-card p-4 flex items-center gap-3">
            <s.icon size={18} style={{ color: 'var(--purple-soft)' }} />
            <div>
              <p className="text-xl font-black font-grotesk leading-none" style={{ color: 'var(--text-primary)' }}>{s.value}</p>
              <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Vendas de demonstração */}
        <div className="lz-card p-6">
          <div className="flex items-center gap-2 mb-1">
            <Database size={16} style={{ color: 'var(--purple-soft)' }} />
            <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Vendas de demonstração</p>
          </div>
          <p className="text-xs mb-5" style={{ color: 'var(--text-muted)' }}>
            Alimentam os cards e o gráfico do painel. Atual: <strong style={{ color: 'var(--purple-soft)' }}>{status.seedSalesCount} vendas ({brl(status.seedSalesTotal)})</strong>
          </p>

          <div className="grid grid-cols-3 gap-3 mb-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>Qtd. vendas</label>
              <input value={salesCount} onChange={(e) => setSalesCount(e.target.value)} className="lz-input !py-2.5 font-jet text-sm" inputMode="numeric" />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>Período (dias)</label>
              <input value={salesDays} onChange={(e) => setSalesDays(e.target.value)} className="lz-input !py-2.5 font-jet text-sm" inputMode="numeric" />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>Ticket médio R$</label>
              <input value={salesAvg} onChange={(e) => setSalesAvg(e.target.value)} className="lz-input !py-2.5 font-jet text-sm" inputMode="decimal" />
            </div>
          </div>

          <button
            onClick={() => run('seed-sales', {
              count: parseInt(salesCount) || 40,
              days: parseInt(salesDays) || 30,
              avgAmount: parseFloat(salesAvg.replace(',', '.')) || 29.9,
            })}
            disabled={busy !== null}
            className="lz-btn-primary w-full inline-flex items-center justify-center gap-2 text-sm"
          >
            {busy === 'seed-sales' ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
            Gerar vendas de demonstração
          </button>
          <p className="text-[11px] mt-2" style={{ color: 'var(--text-muted)' }}>
            Distribuídas com viés de crescimento nos dias recentes, divididas entre Kiwify e Hotmart.
          </p>
        </div>

        {/* Estruturas de demonstração */}
        <div className="lz-card p-6 flex flex-col">
          <div className="flex items-center gap-2 mb-1">
            <FlaskConical size={16} style={{ color: 'var(--purple-soft)' }} />
            <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Estruturas de demonstração</p>
          </div>
          <p className="text-xs mb-5" style={{ color: 'var(--text-muted)' }}>
            5 estruturas com nichos, produtos, preços e status variados (rascunho → concluída) para preencher o grid.
            Atual: <strong style={{ color: 'var(--purple-soft)' }}>{status.demoStructuresCount}</strong>
          </p>
          <button
            onClick={() => run('seed-structures')}
            disabled={busy !== null}
            className="lz-btn-primary w-full inline-flex items-center justify-center gap-2 text-sm mt-auto"
          >
            {busy === 'seed-structures' ? <Loader2 size={15} className="animate-spin" /> : <Layers size={15} />}
            Criar estruturas demo
          </button>
          <p className="text-[11px] mt-2" style={{ color: 'var(--text-muted)' }}>
            Marcadas com o sub-nicho “DEMO”. Para conteúdo de e-book real, use o wizard normalmente.
          </p>
        </div>
      </div>

      {/* Faturamento sob medida — valores exatos por período */}
      <div className="lz-card p-6 mb-4">
        <div className="flex items-center gap-2 mb-1">
          <Database size={16} style={{ color: 'var(--purple-soft)' }} />
          <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Faturamento sob medida — período por período</p>
        </div>
        <p className="text-xs mb-5" style={{ color: 'var(--text-muted)' }}>
          Digite exatamente quanto cada card do painel deve mostrar. Regra: Hoje está dentro de 7 dias, que está dentro de 30 dias, que está dentro do Total — se os valores vierem incoerentes, ajustamos para cima automaticamente. Aplicar <strong>substitui</strong> as vendas de demonstração atuais.
        </p>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>Hoje (R$)</label>
            <input value={revToday} onChange={(e) => setRevToday(e.target.value)} className="lz-input !py-2.5 font-jet text-sm" inputMode="decimal" />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>Últimos 7 dias (R$)</label>
            <input value={rev7} onChange={(e) => setRev7(e.target.value)} className="lz-input !py-2.5 font-jet text-sm" inputMode="decimal" />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>Últimos 30 dias (R$)</label>
            <input value={rev30} onChange={(e) => setRev30(e.target.value)} className="lz-input !py-2.5 font-jet text-sm" inputMode="decimal" />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>Total acumulado (R$)</label>
            <input value={revAll} onChange={(e) => setRevAll(e.target.value)} className="lz-input !py-2.5 font-jet text-sm" inputMode="decimal" />
          </div>
        </div>

        <button
          onClick={() => run('set-revenue', {
            today: parseBr(revToday),
            last7: parseBr(rev7),
            last30: parseBr(rev30),
            allTime: parseBr(revAll),
          })}
          disabled={busy !== null}
          className="lz-btn-primary w-full inline-flex items-center justify-center gap-2 text-sm"
        >
          {busy === 'set-revenue' ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
          Aplicar valores exatos no painel
        </button>
        <p className="text-[11px] mt-2" style={{ color: 'var(--text-muted)' }}>
          As vendas são fatiadas em tickets realistas (R$9,90–R$59,90) que somam exatamente cada valor. Vendas reais (webhook) somam por cima desses números.
        </p>
      </div>

      {/* Limpeza */}
      <div className="lz-card p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        style={{ border: '1px solid rgba(239,68,68,0.3)' }}>
        <div>
          <p className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Limpar dados de demonstração</p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Remove todas as vendas <code>seed_</code> e estruturas <code>DEMO</code> da sua conta. Dados reais não são tocados.
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button onClick={load} disabled={busy !== null} className="lz-btn-secondary !px-4 !py-2.5 text-xs inline-flex items-center gap-1.5">
            <RefreshCw size={13} /> Atualizar
          </button>
          <button
            onClick={() => { if (window.confirm('Remover TODOS os dados de demonstração da sua conta?')) run('clear') }}
            disabled={busy !== null}
            className="!px-4 !py-2.5 text-xs font-bold rounded-xl inline-flex items-center gap-1.5 transition-colors"
            style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.4)', color: '#f87171' }}
          >
            {busy === 'clear' ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
            Limpar tudo
          </button>
        </div>
      </div>
    </div>
  )
}
