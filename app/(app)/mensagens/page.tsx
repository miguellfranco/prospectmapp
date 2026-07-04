'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  MessageSquare, Sparkles, Loader2, Send, Copy, 
  Globe, MapPin, TrendingUp, Instagram, Check, 
  CheckCircle2, ChevronRight, Phone, RefreshCw 
} from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader, EmptyState, TierBadge, TimeAgo, nicheIcon } from '@/components/lz/ui'
import Link from 'next/link'

export default function MensagensPage() {
  const [messages, setMessages] = useState<any[]>([])
  const [leads, setLeads] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Message Generator States
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null)
  const [selectedTone, setSelectedTone] = useState<'casual' | 'profissional' | 'direto'>('casual')
  const [selectedService, setSelectedService] = useState<'site' | 'gmb' | 'trafego' | 'instagram'>('site')
  const [messageVariant, setMessageVariant] = useState<number>(1)
  const [messageText, setMessageText] = useState<string>('')
  const [generating, setGenerating] = useState<boolean>(false)

  const selectedLead = leads.find(l => l.id === selectedLeadId)

  function load() {
    setLoading(true)
    Promise.all([
      fetch('/api/messages').then((r) => (r.ok ? r.json() : { messages: [] })),
      fetch('/api/leads').then((r) => (r.ok ? r.json() : { leads: [] })),
    ]).then(([m, l]) => { 
      setMessages(m?.messages ?? [])
      const activeLeads = (l?.leads ?? []).filter((x: any) => x.status !== 'ignorado')
      setLeads(activeLeads)
      setLoading(false) 
    }).catch(() => setLoading(false))
  }

  useEffect(load, [])

  // Auto-select lead from URL search param
  useEffect(() => {
    if (typeof window !== 'undefined' && leads.length > 0) {
      const params = new URLSearchParams(window.location.search)
      const leadId = params.get('leadId')
      if (leadId && leads.some(l => l.id === leadId)) {
        setSelectedLeadId(leadId)
        // Clean URL parameter quietly
        window.history.replaceState({}, document.title, window.location.pathname)
      }
    }
  }, [leads])

  // Trigger generation automatically when parameters change
  useEffect(() => {
    if (selectedLead) {
      generate(selectedLead, selectedTone, selectedService, messageVariant)
    }
  }, [selectedLeadId, selectedTone, selectedService, messageVariant])

  async function generate(lead: any, tone: string, service: string, variant: number) {
    if (!lead) return
    setGenerating(true)
    setMessageText('')
    
    try {
      const res = await fetch('/api/messages/generate', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ 
          leadId: lead.id, 
          tone, 
          service, 
          variant,
          lead // Pass full lead details for fallback
        }) 
      })

      if (!res.ok || !res.body) { 
        toast.error('Erro ao gerar abordagem comercial.')
        setMessageText('Erro ao gerar mensagem personalizada com IA.')
        setGenerating(false)
        return 
      }

      const reader = res.body.getReader()
      const dec = new TextDecoder()
      let partial = ''
      let fullText = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        
        partial += dec.decode(value, { stream: true })
        const lines = partial.split('\n')
        partial = lines.pop() ?? ''
        
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          try { 
            const p = JSON.parse(line.slice(6))
            if (p.status === 'processing' && p.delta) {
              fullText += p.delta
              setMessageText(fullText)
            } 
            if (p.status === 'completed') {
              toast.success('Abordagem gerada!')
              // Reload history silently
              fetch('/api/messages')
                .then((r) => (r.ok ? r.json() : { messages: [] }))
                .then((m) => setMessages(m?.messages ?? []))
                .catch(() => {})
            } 
          } catch {}
        }
      }
    } catch { 
      toast.error('Erro de conexão ao gerar abordagem.') 
      setMessageText('Erro de conexão com o servidor.')
    } finally { 
      setGenerating(false) 
    }
  }

  function handleSelectLead(leadId: string) {
    setSelectedLeadId(leadId)
    // Reset parameters on new selection
    setSelectedTone('casual')
    setSelectedService('site')
    setMessageVariant(1)
  }

  function cycleVariant() {
    setMessageVariant((v) => (v >= 5 ? 1 : v + 1))
  }

  function copyMsg(text: string) { 
    navigator.clipboard?.writeText(text)
      .then(() => toast.success('Copiado para a área de transferência!'))
      .catch(() => toast.error('Erro ao copiar.')) 
  }

  function sendWhats(phone: string | null, text: string) {
    if (!phone) {
      toast.error('Telefone indisponível.')
      return
    }
    const num = phone.replace(/\D/g, '')
    window.open(`https://wa.me/55${num}?text=${encodeURIComponent(text)}`, '_blank')
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Mensagens com" 
        highlight="IA" 
        description="Gere abordagens comerciais persuasivas e personalizadas para captar clientes pelo WhatsApp." 
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* COLUNA ESQUERDA: EDITOR E PARAMETROS */}
        <div className="lg:col-span-7 space-y-6">
          <div className="lz-card p-6 flex flex-col gap-6">
            <div>
              <h2 className="font-grotesk text-lg font-bold text-white flex items-center gap-2">
                <Sparkles size={18} className="text-violet-400" /> Configure sua Abordagem
              </h2>
              <p className="text-xs text-zinc-400 mt-1">Selecione uma empresa e ajuste os parâmetros para a IA redigir.</p>
            </div>

            {/* 1. SELECIONAR EMPRESA */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">
                1. Selecionar Estabelecimento
              </label>
              {loading ? (
                <div className="h-12 rounded-xl bg-zinc-900 animate-pulse border border-white/5" />
              ) : leads.length === 0 ? (
                <div className="p-4 rounded-xl border border-dashed border-white/10 bg-[#07070f] text-center">
                  <p className="text-xs text-zinc-500 mb-3">Nenhum estabelecimento prospectado ativo.</p>
                  <Link href="/prospectar" className="lz-btn-primary !py-2 !px-4 text-xs inline-flex items-center gap-1.5">
                    Ir para Prospecção <ChevronRight size={14} />
                  </Link>
                </div>
              ) : (
                <select
                  value={selectedLeadId || ''}
                  onChange={(e) => handleSelectLead(e.target.value)}
                  className="w-full bg-[#0a0a14] border border-white/10 rounded-xl p-3.5 text-sm text-white focus:outline-none focus:border-violet-500 transition-colors"
                >
                  <option value="" disabled>Escolha um estabelecimento prospectado...</option>
                  {leads.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.businessName} ({l.city} - {l.niche})
                    </option>
                  ))}
                </select>
              )}
            </div>

            <AnimatePresence mode="wait">
              {selectedLead ? (
                <motion.div 
                  key={selectedLead.id}
                  initial={{ opacity: 0, y: 15 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  exit={{ opacity: 0, y: -15 }}
                  className="space-y-6 pt-4 border-t border-white/5"
                >
                  {/* 2. SERVIÇO FOCADO */}
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">
                      2. Qual serviço deseja oferecer? (Foco da Mensagem)
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      <button
                        onClick={() => setSelectedService('site')}
                        className={`p-3 rounded-xl border text-center flex flex-col items-center gap-2 transition-all ${
                          selectedService === 'site' 
                            ? 'border-violet-500 bg-violet-500/10 text-white shadow-[0_0_15px_rgba(124,58,237,0.15)]' 
                            : 'border-white/5 bg-[#05050a] text-zinc-400 hover:border-white/10 hover:text-white'
                        }`}
                      >
                        <Globe size={18} className={selectedService === 'site' ? 'text-violet-400' : 'text-zinc-500'} />
                        <span className="text-xs font-semibold leading-tight">Criação de Site</span>
                      </button>
                      <button
                        onClick={() => setSelectedService('gmb')}
                        className={`p-3 rounded-xl border text-center flex flex-col items-center gap-2 transition-all ${
                          selectedService === 'gmb' 
                            ? 'border-violet-500 bg-violet-500/10 text-white shadow-[0_0_15px_rgba(124,58,237,0.15)]' 
                            : 'border-white/5 bg-[#05050a] text-zinc-400 hover:border-white/10 hover:text-white'
                        }`}
                      >
                        <MapPin size={18} className={selectedService === 'gmb' ? 'text-violet-400' : 'text-zinc-500'} />
                        <span className="text-xs font-semibold leading-tight">Google Meu Negócio</span>
                      </button>
                      <button
                        onClick={() => setSelectedService('trafego')}
                        className={`p-3 rounded-xl border text-center flex flex-col items-center gap-2 transition-all ${
                          selectedService === 'trafego' 
                            ? 'border-violet-500 bg-violet-500/10 text-white shadow-[0_0_15px_rgba(124,58,237,0.15)]' 
                            : 'border-white/5 bg-[#05050a] text-zinc-400 hover:border-white/10 hover:text-white'
                        }`}
                      >
                        <TrendingUp size={18} className={selectedService === 'trafego' ? 'text-violet-400' : 'text-zinc-500'} />
                        <span className="text-xs font-semibold leading-tight">Tráfego Pago</span>
                      </button>
                      <button
                        onClick={() => setSelectedService('instagram')}
                        className={`p-3 rounded-xl border text-center flex flex-col items-center gap-2 transition-all ${
                          selectedService === 'instagram' 
                            ? 'border-violet-500 bg-violet-500/10 text-white shadow-[0_0_15px_rgba(124,58,237,0.15)]' 
                            : 'border-white/5 bg-[#05050a] text-zinc-400 hover:border-white/10 hover:text-white'
                        }`}
                      >
                        <Instagram size={18} className={selectedService === 'instagram' ? 'text-violet-400' : 'text-zinc-500'} />
                        <span className="text-xs font-semibold leading-tight">Gestão Instagram</span>
                      </button>
                    </div>
                  </div>

                  {/* 3. TOM DA ABORDAGEM */}
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">
                      3. Tom da Abordagem
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      <button
                        onClick={() => setSelectedTone('casual')}
                        className={`p-3.5 rounded-xl border text-left flex items-center gap-3 transition-all ${
                          selectedTone === 'casual'
                            ? 'border-violet-500 bg-violet-500/10 text-white shadow-[0_0_15px_rgba(124,58,237,0.15)]'
                            : 'border-white/5 bg-[#05050a] text-zinc-400 hover:border-white/10 hover:text-white'
                        }`}
                      >
                        <span className="text-xl">😊</span>
                        <div>
                          <p className="text-xs font-bold block">Casual</p>
                          <p className="text-[10px] text-zinc-500">Leve e amigável</p>
                        </div>
                      </button>
                      <button
                        onClick={() => setSelectedTone('profissional')}
                        className={`p-3.5 rounded-xl border text-left flex items-center gap-3 transition-all ${
                          selectedTone === 'profissional'
                            ? 'border-violet-500 bg-violet-500/10 text-white shadow-[0_0_15px_rgba(124,58,237,0.15)]'
                            : 'border-white/5 bg-[#05050a] text-zinc-400 hover:border-white/10 hover:text-white'
                        }`}
                      >
                        <span className="text-xl">💼</span>
                        <div>
                          <p className="text-xs font-bold block">Profissional</p>
                          <p className="text-[10px] text-zinc-500">Formal e sério</p>
                        </div>
                      </button>
                      <button
                        onClick={() => setSelectedTone('direto')}
                        className={`p-3.5 rounded-xl border text-left flex items-center gap-3 transition-all ${
                          selectedTone === 'direto'
                            ? 'border-violet-500 bg-violet-500/10 text-white shadow-[0_0_15px_rgba(124,58,237,0.15)]'
                            : 'border-white/5 bg-[#05050a] text-zinc-400 hover:border-white/10 hover:text-white'
                        }`}
                      >
                        <span className="text-xl">🎯</span>
                        <div>
                          <p className="text-xs font-bold block">Direto</p>
                          <p className="text-[10px] text-zinc-500">Objetivo e rápido</p>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* 4. MODELOS & VARIAÇÃO */}
                  <div className="flex items-center justify-between bg-[#05050a] p-3 rounded-xl border border-white/5">
                    <div>
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">
                        Modelo de Mensagem
                      </span>
                      <span className="text-xs font-semibold text-zinc-300">
                        Variação {messageVariant} de 5
                      </span>
                    </div>
                    <button
                      onClick={cycleVariant}
                      className="px-3 py-1.5 rounded-lg border border-white/10 hover:bg-white/5 text-xs text-white font-bold flex items-center gap-1.5 transition-colors"
                    >
                      <RefreshCw size={12} className={generating ? 'animate-spin' : ''} /> Outro Modelo
                    </button>
                  </div>

                  {/* 5. DADOS DE CONTATO */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">
                      Contato do Cliente
                    </span>
                    <div className="flex items-center justify-between bg-[#05050a] border border-white/5 p-4 rounded-xl">
                      <div className="flex items-center gap-2 text-white">
                        <Phone size={16} className="text-emerald-400" />
                        <span className="text-sm font-semibold tracking-wider">{selectedLead.phone || 'Sem telefone cadastrado'}</span>
                      </div>
                      {selectedLead.phone && (
                        <button
                          onClick={() => copyMsg(selectedLead.phone)}
                          className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white font-bold text-xs transition-colors flex items-center gap-1"
                        >
                          <Copy size={12} /> Copiar Número
                        </button>
                      )}
                    </div>
                  </div>

                  {/* 6. MENSAGEM GERADA */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">
                      Abordagem Gerada por IA
                    </span>
                    <div className="relative rounded-2xl border border-white/10 bg-[#040409] p-5 shadow-inner">
                      {generating && !messageText ? (
                        <div className="h-28 flex flex-col items-center justify-center gap-2">
                          <Loader2 className="animate-spin text-violet-400" size={24} />
                          <p className="text-xs text-zinc-500">A IA está escrevendo o seu pitch...</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <p className="text-sm leading-relaxed text-zinc-100 whitespace-pre-wrap">
                            {messageText || 'Selecione as opções acima para gerar sua mensagem.'}
                          </p>
                          
                          {messageText && (
                            <div className="pt-4 border-t border-white/5 flex flex-col md:flex-row gap-2 items-center justify-between">
                              <span className="text-[10px] text-zinc-500">
                                Cole o telefone no WhatsApp e envie a mensagem gerada.
                              </span>
                              <div className="flex gap-2 w-full md:w-auto">
                                <button
                                  onClick={() => copyMsg(messageText)}
                                  className="lz-btn-secondary !py-2 !px-4 text-xs flex items-center justify-center gap-1.5 w-full md:w-auto"
                                >
                                  <Copy size={14} /> Copiar Pitch
                                </button>
                                {selectedLead.phone && (
                                  <button
                                    onClick={() => sendWhats(selectedLead.phone, messageText)}
                                    className="lz-btn-primary !py-2 !px-4 !bg-emerald-600 hover:!bg-emerald-700 border-none text-xs flex items-center justify-center gap-1.5 w-full md:w-auto shadow-lg shadow-emerald-950/20"
                                  >
                                    <Send size={14} /> Abrir WhatsApp
                                  </button>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                </motion.div>
              ) : (
                <div className="h-64 flex flex-col items-center justify-center gap-3 border border-dashed border-white/5 rounded-2xl bg-[#030307]">
                  <MessageSquare size={28} className="text-zinc-600" />
                  <p className="text-sm text-zinc-500 text-center max-w-xs px-4">
                    Escolha uma empresa no menu acima para abrir o painel de criação e gerar abordagens sob medida.
                  </p>
                </div>
              )}
            </AnimatePresence>

          </div>
        </div>

        {/* COLUNA DIREITA: HISTÓRICO */}
        <div className="lg:col-span-5 space-y-6">
          <div className="lz-card p-6 flex flex-col gap-6">
            <div>
              <h2 className="font-grotesk text-lg font-bold text-white flex items-center gap-2">
                <MessageSquare size={18} className="text-violet-400" /> Últimas abordagens geradas
              </h2>
              <p className="text-xs text-zinc-400 mt-1">Histórico recente de prospecção e copys enviadas.</p>
            </div>

            {loading ? (
              <div className="space-y-2">
                <div className="h-20 rounded-xl bg-zinc-900 animate-pulse border border-white/5" />
                <div className="h-20 rounded-xl bg-zinc-900 animate-pulse border border-white/5" />
                <div className="h-20 rounded-xl bg-zinc-900 animate-pulse border border-white/5" />
              </div>
            ) : messages.length === 0 ? (
              <EmptyState 
                icon={MessageSquare} 
                title="Nenhuma mensagem gerada" 
                subtitle="O seu histórico de pitches gerados por IA aparecerá aqui." 
              />
            ) : (
              <div className="space-y-3 max-h-[640px] overflow-y-auto scrollbar-none">
                {messages.map((m) => (
                  <motion.div 
                    key={m.id} 
                    initial={{ opacity: 0, y: 8 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    className="p-4 rounded-xl border border-white/5 flex flex-col gap-3 transition-colors hover:border-white/10 cursor-pointer"
                    style={{ background: 'var(--bg-elevated)' }}
                    onClick={() => {
                      // Load back into creator if lead exists
                      if (leads.some(l => l.id === m.leadId)) {
                        setSelectedLeadId(m.leadId)
                        setMessageText(m.messageText)
                        toast.info(`Pitch para "${m.lead?.businessName}" carregado no editor!`)
                      }
                    }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-white block truncate">{m.lead?.businessName ?? 'Estabelecimento'}</span>
                        <span className="text-[10px] text-zinc-500 block truncate">{m.lead?.city ?? ''}</span>
                      </div>
                      <span className="text-[9px] font-jet text-zinc-500 shrink-0">
                        <TimeAgo date={m.generatedAt} />
                      </span>
                    </div>

                    <p className="text-xs text-zinc-300 leading-relaxed whitespace-pre-wrap line-clamp-3 bg-black/20 p-2.5 rounded-lg border border-white/5">
                      {m.messageText}
                    </p>

                    <div className="flex gap-2 justify-end" onClick={(e) => e.stopPropagation()}>
                      <button 
                        onClick={() => copyMsg(m.messageText)} 
                        className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white text-[10px] font-bold transition-colors inline-flex items-center gap-1"
                      >
                        <Copy size={10} /> Copiar
                      </button>
                      {m.lead?.phone && (
                        <button 
                          onClick={() => sendWhats(m.lead?.phone, m.messageText)} 
                          className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold transition-colors inline-flex items-center gap-1"
                        >
                          <Send size={10} /> Enviar
                        </button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
