'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, BarChart3, X, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader, EmptyState, TimeAgo, brl, nicheIcon, NICHE_LABELS } from '@/components/lz/ui'

const NICHES = ['restaurante', 'academia', 'salao', 'barbearia', 'clinica', 'pizzaria', 'petshop', 'estetica', 'oficina', 'advocacia', 'imobiliaria', 'contabilidade']

export default function VendasPage() {
  const [sales, setSales] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ niche: 'restaurante', city: '', saleValue: '', description: '' })

  function load() { fetch('/api/sales').then((r) => (r.ok ? r.json() : { sales: [] })).then((d) => { setSales(d?.sales ?? []); setLoading(false) }).catch(() => setLoading(false)) }
  useEffect(load, [])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.city.trim()) { toast.error('Informe a cidade.'); return }
    setSaving(true)
    try {
      const res = await fetch('/api/sales', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      if (!res.ok) { toast.error('Erro ao registrar.'); return }
      toast.success('Venda registrada!'); setOpen(false); setForm({ niche: 'restaurante', city: '', saleValue: '', description: '' }); load()
    } catch { toast.error('Erro.') } finally { setSaving(false) }
  }

  const total = sales.reduce((a, s) => a + (s.saleValue ?? 0), 0)

  return (
    <div>
      <PageHeader title="Minhas" highlight="vendas" description="Registre e acompanhe os projetos que você fechou."
        actions={<button onClick={() => setOpen(true)} className="lz-btn-primary inline-flex items-center gap-2"><Plus size={16} /> Nova venda</button>} />
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="lz-card p-5"><p className="text-xs font-grotesk mb-1" style={{ color: 'var(--text-secondary)' }}>TOTAL DE VENDAS</p><p className="font-jet font-bold text-3xl" style={{ color: 'var(--purple-soft)' }}>{sales.length}</p></div>
        <div className="lz-card p-5"><p className="text-xs font-grotesk mb-1" style={{ color: 'var(--text-secondary)' }}>FATURAMENTO</p><p className="font-jet font-bold text-3xl" style={{ color: 'var(--success)' }}>{brl(total)}</p></div>
      </div>
      <div className="lz-card p-5">
        {loading ? <div className="h-32 rounded-lg skeleton-shimmer" /> : sales.length === 0 ? (
          <EmptyState icon={BarChart3} title="Nenhuma venda ainda" subtitle="Registre sua primeira venda para acompanhar seu progresso." action={<button onClick={() => setOpen(true)} className="lz-btn-primary inline-flex items-center gap-2"><Plus size={16} /> Nova venda</button>} />
        ) : (
          <div className="space-y-2">
            {sales.map((s) => { const Icon = nicheIcon(s.niche); return (
              <div key={s.id} className="flex items-center gap-3 p-3 rounded-[10px]" style={{ background: 'var(--bg-elevated)' }}>
                <div className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'var(--purple-glow)' }}><Icon size={16} style={{ color: 'var(--purple-soft)' }} /></div>
                <div className="flex-1 min-w-0"><p className="text-sm" style={{ color: 'var(--text-primary)' }}>{NICHE_LABELS[s.niche] ?? s.niche} · {s.city}</p><p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{s.description ?? 'Sem descrição'} · <TimeAgo date={s.createdAt} /></p></div>
                <span className="font-jet text-sm" style={{ color: 'var(--success)' }}>{brl(s.saleValue)}</span>
              </div>
            )})}
          </div>
        )}
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" style={{ background: 'rgba(0,0,0,0.6)' }} onClick={() => setOpen(false)}>
          <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} onClick={(e) => e.stopPropagation()} className="w-full sm:max-w-md p-6" style={{ background: 'rgba(10,10,20,0.96)', backdropFilter: 'blur(24px)', border: '1px solid rgba(124,58,237,0.25)', borderRadius: 18 }}>
            <div className="flex items-center justify-between mb-4"><h2 className="font-grotesk text-lg" style={{ color: 'var(--text-primary)' }}>Nova venda</h2><button onClick={() => setOpen(false)} style={{ color: 'var(--text-muted)' }}><X size={20} /></button></div>
            <form onSubmit={submit} className="space-y-3">
              <select value={form.niche} onChange={(e) => setForm({ ...form, niche: e.target.value })} className="lz-input">{NICHES.map((n) => <option key={n} value={n} style={{ background: '#0d0d1a' }}>{NICHE_LABELS[n]}</option>)}</select>
              <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="Cidade (ex: São Paulo, SP)" className="lz-input" />
              <input type="number" value={form.saleValue} onChange={(e) => setForm({ ...form, saleValue: e.target.value })} placeholder="Valor (R$)" className="lz-input" />
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Descrição do projeto" className="lz-input" rows={3} />
              <button type="submit" disabled={saving} className="lz-btn-primary w-full inline-flex items-center justify-center gap-2">{saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />} Registrar venda</button>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  )
}
