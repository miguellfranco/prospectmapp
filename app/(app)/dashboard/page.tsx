'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Radar, MessageSquare, TrendingUp, DollarSign, Search, Eye, Copy, ArrowUpRight,
  Activity, Rocket, X, Check, Sparkles, Award, Smile, Briefcase, Target, ExternalLink,
  Loader2, Phone, MapPin, RefreshCw
} from 'lucide-react'
import { toast } from 'sonner'
import {
  PageHeader, EmptyState, TierBadge, ScoreBar, TimeAgo, CountUp, brl, nicheIcon, NICHE_LABELS,
} from '@/components/lz/ui'
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid
} from 'recharts'

export default function DashboardPage() {
  const [data, setData] = useState<any>(null)
  const [me, setMe] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [chartLoading, setChartLoading] = useState(false)
  const [showWelcome, setShowWelcome] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [activeFilter, setActiveFilter] = useState('7dias')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [fakeConfig, setFakeConfig] = useState<Record<string, { sales: string; revenue: string }>>({
    hoje: { sales: '', revenue: '' },
    ontem: { sales: '', revenue: '' },
    '7dias': { sales: '', revenue: '' },
    mes: { sales: '', revenue: '' },
    custom: { sales: '', revenue: '' }
  })
  const [agendaNotes, setAgendaNotes] = useState<string[]>([])
  const [newNote, setNewNote] = useState('')
  const [showAddNote, setShowAddNote] = useState(false)
  const [selectedLead, setSelectedLead] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<'auditoria' | 'whatsapp'>('whatsapp')
  const [selectedTone, setSelectedTone] = useState<'casual' | 'profissional' | 'direto'>('casual')
  const [messageVariant, setMessageVariant] = useState(1)
  const [messageText, setMessageText] = useState('')
  const [messageLoading, setMessageLoading] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [auditText, setAuditText] = useState('')
  const [auditLoading, setAuditLoading] = useState(false)

  // Animation states
  const [isGlowGold, setIsGlowGold] = useState(false)
  const [showSaleModal, setShowSaleModal] = useState(false)

  // Load agenda notes
  useEffect(() => {
    try {
      const saved = localStorage.getItem('lz_agenda_notes')
      if (saved) {
        setAgendaNotes(JSON.parse(saved))
      } else {
        setAgendaNotes([])
        localStorage.setItem('lz_agenda_notes', JSON.stringify([]))
      }
    } catch {}
  }, [])

  function addNote() {
    if (!newNote.trim()) return
    const updated = [...agendaNotes, newNote.trim()]
    setAgendaNotes(updated)
    try { localStorage.setItem('lz_agenda_notes', JSON.stringify(updated)) } catch {}
    setNewNote('')
    setShowAddNote(false)
    toast.success('Compromisso adicionado!')
  }

  function deleteNote(index: number) {
    const updated = agendaNotes.filter((_, i) => i !== index)
    setAgendaNotes(updated)
    try { localStorage.setItem('lz_agenda_notes', JSON.stringify(updated)) } catch {}
    toast.success('Compromisso concluído/removido!')
  }

  // Initial load me
  useEffect(() => {
    setMounted(true)
    fetch('/api/me')
      .then((r) => (r.ok ? r.json() : null))
      .then((m) => setMe(m))
    try { if (!localStorage.getItem('lz_welcomed')) setShowWelcome(true) } catch {}
  }, [])

  // Refetch dashboard data when filter changes
  useEffect(() => {
    setChartLoading(true)
    let query = `/api/dashboard?filter=${activeFilter}`
    if (activeFilter === 'custom' && startDate) {
      query += `&start=${startDate}`
      if (endDate) query += `&end=${endDate}`
    }

    fetch(query)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        // Apply Admin Fake Overrides if they exist
        try {
          const stored = localStorage.getItem('lz_fake_dashboard_data')
          if (stored) {
            const config = JSON.parse(stored)
            const activeData = config[activeFilter]
            if (activeData) {
              if (activeData.sales && d && d.kpis) {
                d.kpis.filteredSalesCount = parseInt(activeData.sales, 10)
              }
              if (activeData.revenue && d && d.kpis) {
                d.kpis.filteredRevenue = parseFloat(activeData.revenue)
              }
            }
          }
        } catch {}

        setData(d)
        setLoading(false)
        setChartLoading(false)
      })
      .catch(() => {
        setLoading(false)
        setChartLoading(false)
      })
  }, [activeFilter, startDate, endDate])

  async function handleOpenLead(lead: any, tab: 'auditoria' | 'whatsapp') {
    toast.loading('Carregando dados da empresa...', { id: 'lead-view-dash' })
    try {
      const res = await fetch('/api/leads/view', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId: lead.id })
      })
      const dataJson = await res.json()
      
      if (!res.ok) {
        toast.error(dataJson?.error ?? 'Não foi possível visualizar este lead.', { id: 'lead-view-dash' })
        return
      }

      toast.dismiss('lead-view-dash')

      setSelectedLead(lead)
      setActiveTab(tab)
      setSelectedTone('casual')
      setMessageVariant(1)
      setMessageText('')

      if (tab === 'auditoria') {
        loadAuditText(lead)
      } else {
        loadMessageText(lead, 'casual', 1)
      }
    } catch {
      toast.error('Erro ao conectar com o servidor.', { id: 'lead-view-dash' })
    }
  }

  // Load audit text
  async function loadAuditText(lead: any) {
    setAuditLoading(true)
    setAuditText('')
    try {
      const res = await fetch('/api/leads/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId: lead.id })
      })
      const analysisData = await res.json()
      if (res.ok) {
        setAuditText(analysisData.analysis)
      } else {
        setAuditText('Erro ao carregar análise comercial.')
      }
    } catch {
      setAuditText('Erro ao carregar análise comercial.')
    } finally {
      setAuditLoading(false)
    }
  }

  // Load message text
  async function loadMessageText(lead: any, tone: 'casual' | 'profissional' | 'direto', variant: number) {
    setMessageLoading(true)
    setMessageText('')
    setIsGlowGold(false)
    try {
      const res = await fetch('/api/messages/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId: lead.id, tone, variant })
      })
      
      if (!res.ok || !res.body) {
        setMessageText('Erro ao gerar mensagem personalizada com IA.')
        setMessageLoading(false)
        return
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let full = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const text = decoder.decode(value, { stream: true })
        const lines = text.split('\n')
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const p = JSON.parse(line.slice(6))
              if (p.status === 'processing' && p.delta) {
                full += p.delta
                setMessageText(full)
              }
            } catch {}
          }
        }
      }
      if (full && !full.includes('Erro')) {
        setIsGlowGold(true)
        setTimeout(() => setIsGlowGold(false), 600)
        toast.success('✨ Mensagem perfeita criada!')
      }
    } catch {
      setMessageText('Erro ao gerar mensagem.')
    } finally {
      setMessageLoading(false)
    }
  }

  // Cycle message variants
  function handleNextVariant() {
    if (!selectedLead || messageLoading) return
    const nextVal = messageVariant >= 5 ? 1 : messageVariant + 1
    setMessageVariant(nextVal)
    loadMessageText(selectedLead, selectedTone, nextVal)
  }

  // Change tone
  function handleToneChange(tone: 'casual' | 'profissional' | 'direto') {
    if (!selectedLead || messageLoading) return
    setSelectedTone(tone)
    setMessageVariant(1)
    loadMessageText(selectedLead, tone, 1)
  }

  // Update lead status
  async function updateStatus(newStatus: string) {
    if (!selectedLead) return
    
    let saleValue: number | undefined = undefined
    if (newStatus === 'venda_fechada') {
      const inputVal = prompt('Digite o valor da venda fechada (R$):', '500')
      if (inputVal === null) {
        // User cancelled, reset status drop selection or simply return
        return
      }
      const parsed = parseFloat(inputVal.replace(/[^\d.,]/g, '').replace(',', '.'))
      saleValue = isNaN(parsed) ? 500 : parsed
    }

    setUpdatingStatus(true)
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          leadId: selectedLead.id, 
          status: newStatus,
          saleValue
        })
      })
      if (res.ok) {
        setSelectedLead({ ...selectedLead, status: newStatus })
        toast.success('Status do lead atualizado!')
        if (newStatus === 'venda_fechada') {
          setShowSaleModal(true)
        }
      } else {
        toast.error('Erro ao atualizar status.')
      }
    } catch {
      toast.error('Erro ao atualizar status.')
    } finally {
      setUpdatingStatus(false)
    }
  }

  function closeWelcome() { try { localStorage.setItem('lz_welcomed', '1') } catch {}; setShowWelcome(false) }

  function getInitials(name: string) {
    if (!name) return 'U'
    const parts = name.split(' ')
    const first = parts[0]?.charAt(0) || ''
    const last = parts[parts.length - 1]?.charAt(0) || ''
    return (first + last).toUpperCase()
  }

  const k = data?.kpis

  // KPI cards redesign (staggered delay & clean labels - Section 3/5)
  const kpiCards = [
    { icon: Radar, label: 'Leads Abertos Hoje', value: k?.leadsToday ?? 0, sub: `${k?.leadsToday ?? 0}/${k?.dailyLimit ?? 5} hoje`, progress: ((k?.leadsToday ?? 0) / (k?.dailyLimit || 5)) * 100, color: 'var(--purple-soft)' },
    { icon: MessageSquare, label: 'Mensagens Geradas', value: k?.totalMessages ?? 0, sub: 'Total de abordagens', color: 'var(--info)' },
    { icon: TrendingUp, label: 'Vendas', value: k?.filteredSalesCount ?? 0, sub: 'Vendas registradas no período', color: 'var(--success)' },
    { icon: DollarSign, label: 'Faturamento', value: k?.filteredRevenue ?? 0, isMoney: true, sub: 'Receita apurada no período', color: 'var(--warning)' },
  ]

  // Load fake configs on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('lz_fake_dashboard_data')
      if (saved) {
        setFakeConfig(JSON.parse(saved))
      }
    } catch {}
  }, [])



  return (
    <div>
      <PageHeader title="Seu painel de" highlight="prospecção" description="Acompanhe seus leads, mensagens e faturamentos de vendas em tempo real."
        actions={<Link href="/prospectar" className="lz-btn-primary inline-flex items-center gap-2"><Search size={16} /> Prospectar</Link>} />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {kpiCards.map((c, i) => {
          const Icon = c.icon
          return (
            <motion.div 
              key={c.label} 
              initial={{ opacity: 0, y: 15 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ duration: 0.3, delay: i * 0.08 }} 
              className="lz-card lz-card-hover p-5 cursor-pointer select-none"
              onDoubleClick={() => {
                if (me?.email !== 'admin@prospectmap.com.br') return

                if (i === 2) {
                  // Vendas
                  const current = fakeConfig[activeFilter]?.sales || k?.filteredSalesCount || 0
                  const val = prompt('Definir número de Vendas para esta visualização (deixe em branco para limpar):', current)
                  if (val !== null) {
                    const updated = {
                      ...fakeConfig,
                      [activeFilter]: {
                        ...fakeConfig[activeFilter],
                        sales: val.trim()
                      }
                    }
                    setFakeConfig(updated)
                    localStorage.setItem('lz_fake_dashboard_data', JSON.stringify(updated))
                    toast.success('Número de vendas atualizado!')
                    setTimeout(() => window.location.reload(), 300)
                  }
                } else if (i === 3) {
                  // Faturamento
                  const current = fakeConfig[activeFilter]?.revenue || k?.filteredRevenue || 0
                  const val = prompt('Definir Faturamento (R$) para esta visualização (deixe em branco para limpar):', current)
                  if (val !== null) {
                    const updated = {
                      ...fakeConfig,
                      [activeFilter]: {
                        ...fakeConfig[activeFilter],
                        revenue: val.trim()
                      }
                    }
                    setFakeConfig(updated)
                    localStorage.setItem('lz_fake_dashboard_data', JSON.stringify(updated))
                    toast.success('Faturamento atualizado!')
                    setTimeout(() => window.location.reload(), 300)
                  }
                }
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-grotesk font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>{c.label}</span>
                <Icon size={18} style={{ color: c.color }} />
              </div>
              <div className="font-jet font-bold text-4xl" style={{ color: c.color }}>
                {loading ? '—' : c.isMoney ? <CountUp value={c.value} prefix="R$ " /> : <CountUp value={c.value} />}
              </div>
              {c.progress != null && (
                <div className="h-1.5 w-full rounded-full mt-3 overflow-hidden" style={{ background: '#1e1e35' }}>
                  <div className="h-full rounded-full bg-gradient-to-r from-purple-500 to-indigo-500" style={{ width: `${Math.min(100, c.progress)}%` }} />
                </div>
              )}
              <p className="text-[10px] mt-2 font-jet" style={{ color: 'var(--text-muted)' }}>{c.sub}</p>
            </motion.div>
          )
        })}
      </div>

      {/* Seção de Gráficos e Últimas Vendas (Estilo Foto 4 do Concorrente) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Gráfico principal */}
        <div className="lg:col-span-2 lz-card p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div>
              <span className="text-xs font-grotesk font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                Faturamento
              </span>
              <h2 className="font-jet font-bold text-3xl text-glow mt-1" style={{ color: 'var(--text-primary)' }}>
                R$ {Number(data?.kpis?.filteredRevenue ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </h2>
              <p className="text-xs mt-0.5 font-jet" style={{ color: 'var(--purple-soft)' }}>
                {data?.kpis?.filteredSalesCount ?? 0} vendas filtradas
              </p>
            </div>
            
            {/* Botões de Filtro de Data (Foto 4) */}
            <div className="flex flex-wrap gap-1">
              {['hoje', 'ontem', '7dias', 'mes', 'custom'].map((f) => (
                <button
                  key={f}
                  onClick={() => setActiveFilter(f)}
                  className="px-2.5 py-1 rounded text-xs font-grotesk font-semibold transition-all"
                  style={{
                    background: activeFilter === f ? 'var(--purple-core)' : 'var(--bg-elevated)',
                    color: activeFilter === f ? '#fff' : 'var(--text-secondary)',
                    border: '1px solid var(--border-default)'
                  }}
                >
                  {f === 'hoje' ? 'Hoje' : f === 'ontem' ? 'Ontem' : f === '7dias' ? '7 dias' : f === 'mes' ? 'Este Mês' : 'Personalizado'}
                </button>
              ))}
            </div>
          </div>

          {/* Inputs de Data Personalizados */}
          {activeFilter === 'custom' && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex gap-2 mb-4 items-end bg-[var(--bg-primary)] p-3 rounded-lg border border-[var(--border-default)]">
              <div>
                <label className="block text-[9px] uppercase font-bold mb-1 text-zinc-400">Data Inicial</label>
                <input 
                  type="date" 
                  value={startDate} 
                  onChange={(e) => setStartDate(e.target.value)} 
                  className="lz-input !py-1 !px-2 text-xs" 
                />
              </div>
              <div>
                <label className="block text-[9px] uppercase font-bold mb-1 text-zinc-400">Data Final</label>
                <input 
                  type="date" 
                  value={endDate} 
                  onChange={(e) => setEndDate(e.target.value)} 
                  className="lz-input !py-1 !px-2 text-xs" 
                />
              </div>
            </motion.div>
          )}

          {/* Gráfico de Evolução */}
          <div className="h-64 w-full">
            {chartLoading ? (
              <div className="h-full w-full rounded-lg skeleton-shimmer" />
            ) : mounted && data?.salesByDay ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.salesByDay} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--purple-core)" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="var(--purple-core)" stopOpacity={0.01}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default)" vertical={false} />
                  <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={10} tickLine={false} />
                  <YAxis stroke="var(--text-muted)" fontSize={10} tickLine={false} />
                  <Tooltip contentStyle={{ background: '#0a0a18', border: '1px solid var(--border-default)', borderRadius: 10 }} labelStyle={{ color: '#fff' }} />
                  <Area type="monotone" dataKey="revenue" stroke="var(--purple-soft)" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : null}
          </div>
        </div>

        {/* Últimas Vendas (Foto 4 Coluna da Direita) */}
        <div className="lz-card p-5 flex flex-col justify-between">
          <div>
            <h2 className="font-grotesk text-lg mb-1 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              🔔 Últimas Vendas
            </h2>
            <p className="text-xs mb-4" style={{ color: 'var(--text-secondary)' }}>Transações faturadas em tempo real</p>
            
            <div className="space-y-2 max-h-[220px] overflow-y-auto scrollbar-none pr-1">
              {loading ? (
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => <div key={i} className="h-10 rounded skeleton-shimmer" />)}
                </div>
              ) : (data?.recentSales?.length ?? 0) === 0 ? (
                <p className="text-xs text-zinc-400">Nenhuma venda faturada ainda.</p>
              ) : (
                data.recentSales.map((s: any) => (
                  <div key={s.id} className="flex items-center gap-3 p-2.5 rounded-lg border border-[var(--border-default)]" style={{ background: 'var(--bg-elevated)' }}>
                    <div 
                      className="h-8 w-8 rounded-full flex items-center justify-center font-grotesk font-bold text-[10px] text-white shrink-0"
                      style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}
                    >
                      {getInitials(s.clientName)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-[11px] font-semibold truncate text-white">{s.clientName || 'Cliente'}</p>
                        <span className="text-[8px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold uppercase">Aprovada</span>
                      </div>
                      <p className="text-[10px] text-emerald-400 mt-0.5 font-jet font-semibold">VALOR R$ {Number(s.saleValue).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          
          <div className="mt-4 pt-3 border-t border-[var(--border-default)] flex items-center justify-between text-xs" style={{ color: 'var(--text-muted)' }}>
            <span>Faturamento Acumulado:</span>
            <span className="font-jet font-bold text-white">R$ {Number(data?.kpis?.allSalesRevenue ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
          </div>
        </div>
      </div>

      {/* Agenda e Top Vendedores (Foto 4 Seção Inferior) */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-6">
        {/* Agenda Interativa (Foto 2/5) */}
        <div className="lg:col-span-3 lz-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-grotesk text-lg flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              📅 Agenda
            </h2>
            <button
              onClick={() => setShowAddNote(!showAddNote)}
              className="lz-btn-secondary !py-1 !px-3 text-xs inline-flex items-center gap-1 border-[var(--purple-border)] text-[var(--purple-soft)]"
            >
              + Adicionar
            </button>
          </div>

          <div className="text-xs border-b border-[var(--border-default)] pb-2 mb-3">
            <span className="font-bold text-white">Hoje, {new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })}</span>
          </div>

          {/* Add note inline form */}
          {showAddNote && (
            <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="mb-4 space-y-2 p-3 rounded-lg border border-[var(--border-default)] bg-[var(--bg-primary)]">
              <input
                type="text"
                placeholder="Qual o compromisso ou cliente?"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                className="lz-input !py-1.5 !px-3 text-xs"
                onKeyDown={(e) => e.key === 'Enter' && addNote()}
              />
              <div className="flex gap-1.5 justify-end">
                <button onClick={() => setShowAddNote(false)} className="lz-btn-secondary !py-1 !px-2.5 text-[10px]">Cancelar</button>
                <button onClick={addNote} className="lz-btn-primary !py-1 !px-3 text-[10px]">Salvar</button>
              </div>
            </motion.div>
          )}

          {agendaNotes.length === 0 ? (
            <p className="text-xs text-zinc-400">Nenhum compromisso para hoje.</p>
          ) : (
            <div className="space-y-2">
              {agendaNotes.map((note, index) => (
                <div key={index} className="flex items-center justify-between p-2.5 rounded-lg border border-[var(--border-default)] hover:border-[var(--purple-border)] transition-colors" style={{ background: 'var(--bg-elevated)' }}>
                  <span className="text-xs text-zinc-200">{note}</span>
                  <button 
                    onClick={() => deleteNote(index)}
                    className="h-5 w-5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500 hover:text-black flex items-center justify-center text-xs transition-all"
                  >
                    ✓
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Vendedores (Faturamento Only - no sales counts! - Section 2) */}
        <div className="lg:col-span-2 lz-card p-5">
          <h2 className="font-grotesk text-lg mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            🏆 Top Vendedores
          </h2>
          {loading ? (
            <div className="space-y-2">
              {[...Array(2)].map((_, i) => <div key={i} className="h-10 rounded skeleton-shimmer" />)}
            </div>
          ) : (
            <div className="space-y-3">
              {data?.topSellers?.map((seller: any, idx: number) => (
                <div key={seller.position} className="flex items-center gap-3">
                  <span className="font-jet font-bold text-xs w-6">{seller.position}°</span>
                  
                  {/* Rotating crown on #1 position (Section 3) */}
                  <div className="relative">
                    <div className="h-7 w-7 rounded-full bg-zinc-850 text-white flex items-center justify-center font-bold text-[10px]" style={{ background: 'var(--purple-glow)' }}>
                      {getInitials(seller.name)}
                    </div>
                    {seller.position === 1 && (
                      <motion.div 
                        animate={{ rotate: 360 }}
                        transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
                        className="absolute -top-3.5 -left-1 text-yellow-500 drop-shadow"
                      >
                        👑
                      </motion.div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate text-white">{seller.name}</p>
                  </div>
                  <span className="text-xs font-jet font-bold text-emerald-400">
                    R$ {Number(seller.revenue).toLocaleString('pt-BR')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Últimos Leads Encontrados (Fully Redesigned & Interactive - Section 4/5) */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 space-y-6">
          <div className="lz-card p-5">
            <h2 className="font-grotesk text-lg mb-4 text-white">Últimos Leads Encontrados</h2>
            {loading ? (
              <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-12 rounded-lg skeleton-shimmer" />)}</div>
            ) : (data?.recentLeads?.length ?? 0) === 0 ? (
              <EmptyState icon={Radar} title="Nenhum lead ainda" subtitle="Comece a prospectar para encontrar clientes ideais."
                action={<Link href="/prospectar" className="lz-btn-primary inline-flex items-center gap-2"><Search size={16} /> Prospectar agora</Link>} />
            ) : (
              <div className="space-y-2">
                {data?.recentLeads?.map((l: any) => {
                  const Icon = nicheIcon(l.niche)
                  return (
                    <div 
                      key={l.id} 
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl border border-[var(--border-default)] hover:border-[var(--purple-border)] transition-all" 
                      style={{ background: 'var(--bg-elevated)' }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'var(--purple-glow)' }}>
                          <Icon size={16} style={{ color: 'var(--purple-soft)' }} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate text-white">{l.businessName}</p>
                          <p className="text-[10px] text-zinc-400 truncate mt-0.5">
                            {l.city} • <span className="uppercase">{NICHE_LABELS[l.niche] ?? l.niche}</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 justify-between sm:justify-end">
                        <div className="hidden xs:block">
                          <ScoreBar score={l.score} tier={l.tier} />
                        </div>
                        <TierBadge tier={l.tier} />
                        
                        {/* Interactive Visão/Ver modal opener! (Section 4) */}
                        <button 
                          onClick={() => handleOpenLead(l, 'whatsapp')} 
                          className="lz-btn-secondary !py-1.5 !px-3 text-xs inline-flex items-center gap-1 border-[var(--purple-border)] text-[var(--purple-soft)] bg-purple-950/10 hover:bg-purple-900/20"
                        >
                          <Eye size={12} /> Visão
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="lz-card p-5">
            <h2 className="font-grotesk text-lg mb-4 text-white">Seu Plano</h2>
            <div className="flex items-center gap-2 mb-4">
              <span className="lz-badge lz-badge-hot">{(me?.plan ?? 'free').toUpperCase()}</span>
              <span className="text-xs text-zinc-400 font-jet">{me?.daysActive ?? 1} dia(s) ativo</span>
            </div>
            <div className="mb-2 flex justify-between text-xs text-zinc-300">
              <span>Leads abertos hoje</span>
              <span className="font-jet">{me?.leadsUsedToday ?? 0}/{me?.dailyLimit ?? 5}</span>
            </div>
            <div className="h-1.5 w-full rounded-full overflow-hidden mb-4 bg-zinc-900 border border-zinc-800">
              <div 
                className="h-full rounded-full bg-gradient-to-r from-purple-500 to-indigo-500" 
                style={{ width: `${Math.min(100, ((me?.leadsUsedToday ?? 0) / (me?.dailyLimit || 5)) * 100)}%` }} 
              />
            </div>

          </div>
        </div>
      </div>

      {/* Shared Interactive Lead Details Modal */}
      <AnimatePresence>
        {selectedLead && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 z-50 flex items-center justify-center p-4" 
            style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
            onClick={() => setSelectedLead(null)}
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }} 
              animate={{ scale: 1, y: 0 }} 
              exit={{ scale: 0.95, opacity: 0 }} 
              onClick={(e) => e.stopPropagation()} 
              className="w-full max-w-lg p-6 relative max-h-[90vh] overflow-y-auto scrollbar-none" 
              style={{ 
                background: 'rgba(10,10,20,0.96)', 
                backdropFilter: 'blur(24px)', 
                border: '1px solid rgba(124,58,237,0.25)', 
                borderRadius: 18,
                boxShadow: '0 30px 60px rgba(0,0,0,0.8), 0 0 50px rgba(124,58,237,0.08)'
              }}
            >
              <button onClick={() => setSelectedLead(null)} className="absolute top-4 right-4 text-zinc-500 hover:text-white"><X size={20} /></button>

              <div className="mb-4">
                <h3 className="font-grotesk text-lg font-bold text-white">{selectedLead.businessName}</h3>
                <p className="text-xs text-zinc-400">📍 {selectedLead.city}</p>
              </div>

              <div className="flex border-b border-[var(--border-default)] mb-4">
                <button
                  onClick={() => { setActiveTab('whatsapp'); loadMessageText(selectedLead, selectedTone, messageVariant) }}
                  className="flex-1 py-2 text-xs font-grotesk font-bold transition-colors"
                  style={{
                    color: activeTab === 'whatsapp' ? 'var(--purple-soft)' : 'var(--text-secondary)',
                    borderBottom: activeTab === 'whatsapp' ? '2px solid var(--purple-core)' : 'none'
                  }}
                >
                  💬 Abordagem WhatsApp
                </button>
                <button
                  onClick={() => { setActiveTab('auditoria'); loadAuditText(selectedLead) }}
                  className="flex-1 py-2 text-xs font-grotesk font-bold transition-colors"
                  style={{
                    color: activeTab === 'auditoria' ? 'var(--purple-soft)' : 'var(--text-secondary)',
                    borderBottom: activeTab === 'auditoria' ? '2px solid var(--purple-core)' : 'none'
                  }}
                >
                  📋 Auditoria Comercial
                </button>
              </div>

              {activeTab === 'auditoria' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-lg border border-[var(--border-default)]" style={{ background: 'var(--bg-elevated)' }}>
                    <span className="text-xs font-grotesk font-semibold text-zinc-400">Status do Lead:</span>
                    <select 
                      value={selectedLead.status} 
                      onChange={(e) => updateStatus(e.target.value)} 
                      disabled={updatingStatus} 
                      className="lz-input !py-1.5 !px-3 text-xs w-[160px] cursor-pointer"
                    >
                      <option value="novo" style={{ background: '#0d0d1a' }}>Novo Lead</option>
                      <option value="mensagem_gerada" style={{ background: '#0d0d1a' }}>Mensagem Criada</option>
                      <option value="enviado" style={{ background: '#0d0d1a' }}>Abordagem Enviada</option>
                      <option value="respondeu" style={{ background: '#0d0d1a' }}>Cliente Respondeu</option>
                      <option value="venda_fechada" style={{ background: '#0d0d1a' }}>Venda Fechada</option>
                      <option value="ignorado" style={{ background: '#0d0d1a' }}>Ignorar Lead</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-lg border border-[var(--border-default)]" style={{ background: 'var(--bg-primary)' }}>
                      <p className="text-[10px] uppercase font-bold text-zinc-500">Meu Negócio</p>
                      <p className="font-semibold mt-1" style={{ color: selectedLead.gmbOptimized ? 'var(--success)' : 'var(--warning)' }}>
                        {selectedLead.gmbOptimized ? '✓ Ficha Otimizada' : '⚠ Sem Otimização'}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg border border-[var(--border-default)]" style={{ background: 'var(--bg-primary)' }}>
                      <p className="text-[10px] uppercase font-bold text-zinc-500">Presença Busca</p>
                      <p className="font-semibold mt-1" style={{ color: selectedLead.inTopGoogle ? 'var(--success)' : 'var(--danger)' }}>
                        {selectedLead.inTopGoogle ? '✓ Primeiras Posições' : '⚠ Fora do Topo'}
                      </p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-grotesk text-sm font-bold mb-2 uppercase tracking-wide text-[var(--purple-soft)]">
                      Análise de Proposta de Serviços
                    </h4>
                    {auditLoading ? (
                      <div className="space-y-2">
                        <div className="h-4 rounded skeleton-shimmer w-full" />
                        <div className="h-4 rounded skeleton-shimmer w-5/6" />
                      </div>
                    ) : (
                      <div className="p-4 rounded-lg text-sm leading-relaxed border border-[rgba(124,58,237,0.15)] max-h-[220px] overflow-y-auto" style={{ background: 'rgba(7,7,15,0.5)', color: 'var(--text-secondary)' }}>
                        {auditText.split('\n\n').map((para, idx) => <p key={idx} className="mb-2 last:mb-0">{para}</p>)}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'whatsapp' && (
                <div className="space-y-4">
                  <div>
                    <span className="block text-xs font-grotesk font-bold uppercase tracking-wider mb-2 text-zinc-400">
                      • Telefone do Cliente
                    </span>
                    <div className="flex gap-2 items-center">
                      <span className="font-jet font-bold text-lg text-glow tracking-wider text-white">
                        {selectedLead.phone}
                      </span>
                      <button onClick={() => { navigator.clipboard.writeText(selectedLead.phone); toast.success('Telefone copiado!') }} className="lz-btn-secondary !py-1 !px-3 text-xs ml-auto inline-flex items-center gap-1">
                        <Copy size={12} /> Copiar número
                      </button>
                    </div>
                  </div>

                  <div>
                    <span className="block text-xs font-grotesk font-bold uppercase tracking-wider mb-2.5 text-zinc-400">
                      • Tom da Mensagem
                    </span>
                    <div className="grid grid-cols-3 gap-2">
                      <button onClick={() => handleToneChange('casual')} className="p-3 rounded-xl border text-center flex flex-col items-center justify-center gap-1 transition-all" style={{ borderColor: selectedTone === 'casual' ? 'var(--purple-core)' : 'var(--border-default)', background: selectedTone === 'casual' ? 'var(--bg-elevated)' : 'transparent' }}>
                        <Smile size={16} style={{ color: selectedTone === 'casual' ? 'var(--purple-soft)' : 'var(--text-muted)' }} />
                        <span className="text-xs font-bold font-grotesk text-white">Casual</span>
                      </button>
                      <button onClick={() => handleToneChange('profissional')} className="p-3 rounded-xl border text-center flex flex-col items-center justify-center gap-1 transition-all" style={{ borderColor: selectedTone === 'profissional' ? 'var(--purple-core)' : 'var(--border-default)', background: selectedTone === 'profissional' ? 'var(--bg-elevated)' : 'transparent' }}>
                        <Briefcase size={16} style={{ color: selectedTone === 'profissional' ? 'var(--purple-soft)' : 'var(--text-muted)' }} />
                        <span className="text-xs font-bold font-grotesk text-white">Profissional</span>
                      </button>
                      <button onClick={() => handleToneChange('direto')} className="p-3 rounded-xl border text-center flex flex-col items-center justify-center gap-1 transition-all" style={{ borderColor: selectedTone === 'direto' ? 'var(--purple-core)' : 'var(--border-default)', background: selectedTone === 'direto' ? 'var(--bg-elevated)' : 'transparent' }}>
                        <Target size={16} style={{ color: selectedTone === 'direto' ? 'var(--purple-soft)' : 'var(--text-muted)' }} />
                        <span className="text-xs font-bold font-grotesk text-white">Direto</span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-grotesk font-bold uppercase tracking-wider text-zinc-400">• Modelo de Mensagem</span>
                      <button onClick={handleNextVariant} disabled={messageLoading} className="lz-btn-secondary !py-1 !px-3 text-xs inline-flex items-center gap-1.5" style={{ borderColor: 'var(--purple-border)', color: 'var(--purple-soft)' }}>
                        <RefreshCw size={12} className={messageLoading ? 'animate-spin' : ''} />
                        <span>Outro modelo {messageVariant}/5</span>
                      </button>
                    </div>

                    <div className="relative">
                      {messageLoading ? (
                        <div className="p-4 rounded-xl border border-[var(--border-default)] min-h-[120px] flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
                          <Loader2 size={24} className="animate-spin text-[var(--purple-soft)]" />
                        </div>
                      ) : (
                        <div className="relative">
                          <textarea
                            value={messageText}
                            onChange={(e) => setMessageText(e.target.value)}
                            className={`w-full p-4 rounded-xl border min-h-[120px] text-sm focus:border-[var(--purple-core)] outline-none resize-none font-inter leading-relaxed transition-all duration-300 ${
                              isGlowGold ? 'border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.55)]' : 'border-[var(--border-default)]'
                            }`}
                            style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                          />
                          <button onClick={() => { navigator.clipboard.writeText(messageText); toast.success('Mensagem copiada!') }} className="absolute bottom-3 right-3 p-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-default)] text-zinc-400 hover:text-white">
                            <Copy size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-3 mt-6 border-t border-[var(--border-default)] pt-4">
                <button 
                  onClick={() => {
                    const num = (selectedLead.phone ?? '').replace(/\D/g, '')
                    window.open(`https://wa.me/55${num}?text=${encodeURIComponent(messageText)}`, '_blank')
                    updateStatus('enviado')
                  }}
                  disabled={!messageText || messageLoading}
                  className="lz-btn-primary flex-1 inline-flex items-center justify-center gap-2 text-sm py-3"
                  style={{ background: 'var(--success)', color: '#fff', boxShadow: 'none' }}
                >
                  <MessageSquare size={16} /> Abrir WhatsApp
                </button>
                <button onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedLead.businessName + ' ' + selectedLead.city)}`, '_blank')} className="lz-btn-secondary flex-1 inline-flex items-center justify-center gap-2 text-sm">
                  <ExternalLink size={16} /> Ver no Maps
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Venda Fechada Modal (Section 3) */}
      <AnimatePresence>
        {showSaleModal && (
          <>
            <ConfettiExplosion />
            <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
              <motion.div
                initial={{ scale: 0.9, y: 30 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="w-full max-w-md p-6 text-center rounded-2xl border border-[rgba(139,92,246,0.4)] relative"
                style={{
                  background: 'rgba(10,10,24,0.98)',
                  boxShadow: '0 30px 80px rgba(0,0,0,0.95), 0 0 60px rgba(139,92,246,0.2)'
                }}
              >
                <div className="h-16 w-16 mx-auto rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-4 text-glow animate-bounce">
                  <Award size={36} />
                </div>
                
                <h3 className="font-grotesk text-2xl font-bold text-white tracking-tight">
                  🎉 VENDA FECHADA!
                </h3>
                <p className="text-sm font-semibold text-[var(--purple-soft)] mt-1 tracking-wider uppercase animate-pulse">
                  Você é incrível!
                </p>

                {/* Animated Equalizer Wave */}
                <SoundWaveAnimation />

                <p className="text-xs text-zinc-400 leading-relaxed mb-6">
                  Parabéns por fechar mais um cliente! O faturamento correspondente foi adicionado ao seu painel principal e computado no ranking. Continue prospectando e domine o mercado!
                </p>

                <button
                  onClick={() => setShowSaleModal(false)}
                  className="lz-btn-primary w-full py-3 text-xs uppercase font-bold tracking-widest bg-gradient-to-r from-emerald-500 to-teal-600 border-emerald-400 text-black hover:from-emerald-400 hover:to-teal-500"
                >
                  Continuar Prospectando 🚀
                </button>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showWelcome && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ background: 'rgba(0,0,0,0.6)' }} onClick={closeWelcome}>
            <motion.div initial={{ scale: 0.92, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92, opacity: 0 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-lg p-7 relative" style={{ background: 'rgba(10,10,20,0.96)', backdropFilter: 'blur(24px)', border: '1px solid rgba(124,58,237,0.25)', borderRadius: 18 }}>
              <button onClick={closeWelcome} className="absolute top-4 right-4" style={{ color: 'var(--text-muted)' }}><X size={20} /></button>
              <div className="flex items-center gap-2 mb-2"><Rocket size={24} style={{ color: 'var(--purple-soft)' }} /><h2 className="font-grotesk text-xl text-white">Bem-vindo ao LeadZap!</h2></div>
              <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>Em 3 passos você encontra clientes e fecha vendas:</p>
              <div className="space-y-4 mb-7">
                {[{ icon: Search, t: '1. Prospecte', d: 'Busque negócios por cidade e nicho no Google Maps.' }, { icon: Sparkles, t: '2. Gere mensagens com IA', d: 'Crie abordagens de WhatsApp personalizadas em segundos.' }, { icon: Check, t: '3. Feche vendas', d: 'Envie, acompanhe e registre suas vendas no painel.' }].map((s) => {
                  const Icon = s.icon
                  return (
                    <motion.div key={s.t} className="flex items-start gap-3" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
                      <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'var(--purple-glow)' }}><Icon size={18} style={{ color: 'var(--purple-soft)' }} /></div>
                      <div><p className="font-grotesk text-sm text-white">{s.t}</p><p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{s.d}</p></div>
                    </motion.div>
                  )
                })}
              </div>
              <Link href="/prospectar" onClick={closeWelcome} className="lz-btn-primary w-full inline-flex items-center justify-center gap-2"><Rocket size={16} /> Começar a Prospectar</Link>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function ConfettiExplosion() {
  const [particles, setParticles] = useState<any[]>([])
  useEffect(() => {
    const list = []
    const colors = ['#8b5cf6', '#a78bfa', '#f59e0b', '#d946ef', '#10b981']
    for (let i = 0; i < 60; i++) {
      list.push({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 50 + 100,
        size: Math.random() * 8 + 6,
        color: colors[Math.floor(Math.random() * colors.length)],
        delay: Math.random() * 0.5,
        duration: Math.random() * 1.5 + 1.5,
        angle: Math.random() * 360,
        drift: Math.random() * 40 - 20
      })
    }
    setParticles(list)
  }, [])

  return (
    <div className="fixed inset-0 pointer-events-none z-[99999] overflow-hidden">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ y: '100vh', x: `${p.x}vw`, rotate: 0, opacity: 1 }}
          animate={{ 
            y: '-10vh', 
            x: `${p.x + p.drift}vw`,
            rotate: p.angle + 360,
            opacity: [1, 1, 0]
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            ease: 'easeOut'
          }}
          className="absolute rounded-sm"
          style={{
            width: p.size,
            height: p.size,
            background: p.color,
            borderRadius: p.id % 2 === 0 ? '50%' : '2px'
          }}
        />
      ))}
    </div>
  )
}

function SoundWaveAnimation() {
  return (
    <div className="flex items-end justify-center gap-1.5 h-16 my-6">
      {[...Array(12)].map((_, i) => (
        <motion.span
          key={i}
          animate={{ height: [12, 56, 12] }}
          transition={{
            duration: 0.6 + Math.random() * 0.4,
            repeat: Infinity,
            delay: i * 0.05
          }}
          className="w-1.5 rounded-full bg-gradient-to-t from-[var(--purple-core)] to-[#f59e0b]"
        />
      ))}
    </div>
  )
}
