'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, BookOpen, Loader2, PencilLine, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { NICHES } from '@/lib/ebookai-data'
import { WizardProgress } from '@/components/lz/ebookai-ui'

// Tela de criação de estrutura — espelho dos prints de referência:
// grade de nichos → grade de sub-nichos (dores) → "Gerar E-book com IA".
export default function NovaEstruturaPage() {
  const router = useRouter()
  const [nicheId, setNicheId] = useState<string | null>(null)
  const [customNiche, setCustomNiche] = useState('')
  const [useCustomNiche, setUseCustomNiche] = useState(false)
  const [subNiche, setSubNiche] = useState<string | null>(null)
  const [customPain, setCustomPain] = useState('')
  const [useCustomPain, setUseCustomPain] = useState(false)
  const [creating, setCreating] = useState(false)

  const niche = NICHES.find((n) => n.id === nicheId) ?? null
  const nicheLabel = useCustomNiche ? customNiche.trim() : niche?.label ?? ''
  const pain = useCustomPain ? customPain.trim() : subNiche ?? ''
  const canGenerate = Boolean(nicheLabel && pain)

  async function handleCreate() {
    if (!canGenerate) return
    setCreating(true)
    try {
      const res = await fetch('/api/estruturas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          niche: nicheLabel,
          subNiche: useCustomPain ? null : subNiche,
          title: pain,
        }),
      })
      const d = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(d?.error ?? 'Erro ao criar a estrutura.')
      // ?gerar=1 → a página do wizard dispara a geração do e-book automaticamente
      router.push(`/estruturas/${d.structure.id}?gerar=1`)
    } catch (e: any) {
      toast.error(e.message)
      setCreating(false)
    }
  }

  return (
    <div className="p-6 md:p-10 pb-24 md:pb-10 max-w-4xl mx-auto">
      <WizardProgress current={0} />

      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4"
          style={{ background: 'rgba(124,58,237,0.12)', border: '1px solid var(--purple-border)' }}>
          <BookOpen size={22} style={{ color: 'var(--purple-soft)' }} />
        </div>
        <h1 className="text-2xl md:text-3xl font-grotesk" style={{ color: 'var(--text-primary)' }}>Criar E-book</h1>
        <p className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>
          Escolha o nicho e o sub-nicho — a IA entrega o e-book pronto.
        </p>
      </div>

      {/* Passo A: nicho */}
      {!nicheId && !useCustomNiche && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {NICHES.map((n) => (
              <button
                key={n.id}
                onClick={() => { setNicheId(n.id); setSubNiche(null); setUseCustomPain(false) }}
                className="px-4 py-3.5 rounded-xl border text-sm font-medium text-center transition-all hover:-translate-y-0.5"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  borderColor: 'var(--border-default)',
                  color: 'var(--text-secondary)',
                }}
              >
                {n.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => setUseCustomNiche(true)}
            className="mt-4 w-full px-4 py-3 rounded-xl border border-dashed text-sm inline-flex items-center justify-center gap-2 transition-colors"
            style={{ borderColor: 'var(--purple-border)', color: 'var(--purple-soft)', background: 'transparent' }}
          >
            <PencilLine size={15} /> Meu nicho não está na lista — digitar outro
          </button>
        </>
      )}

      {useCustomNiche && !nicheLabel && (
        <div className="lz-card p-6 max-w-xl mx-auto">
          <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>
            Qual é o seu nicho?
          </label>
          <input
            autoFocus value={customNiche} onChange={(e) => setCustomNiche(e.target.value)}
            placeholder="Ex: Fotografia com celular" className="lz-input" maxLength={80}
          />
          <div className="flex gap-3 mt-4">
            <button onClick={() => { setUseCustomNiche(false); setCustomNiche('') }} className="lz-btn-secondary flex-1 inline-flex items-center justify-center gap-2">
              <ArrowLeft size={15} /> Voltar
            </button>
          </div>
        </div>
      )}

      {/* Passo B: sub-nicho / dor principal */}
      {(niche || (useCustomNiche && nicheLabel)) && (
        <>
          <div className="flex items-center gap-3 mb-5">
            <button
              onClick={() => { setNicheId(null); setUseCustomNiche(false); setCustomNiche(''); setSubNiche(null); setUseCustomPain(false); setCustomPain('') }}
              className="inline-flex items-center gap-1.5 text-sm transition-colors"
              style={{ color: 'var(--text-secondary)' }}
            >
              <ArrowLeft size={15} /> Voltar
            </button>
            <span className="lz-badge lz-badge-hot">{nicheLabel}</span>
          </div>

          <p className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
            Selecione um sub-nicho <span style={{ color: 'var(--text-muted)' }}>(a dor principal que o e-book resolve)</span>
          </p>

          {niche && !useCustomPain && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {niche.subNiches.map((sn) => {
                const active = subNiche === sn
                return (
                  <button
                    key={sn}
                    onClick={() => setSubNiche(sn)}
                    className="px-4 py-3.5 rounded-xl border text-sm text-left transition-all"
                    style={{
                      background: active ? 'rgba(124,58,237,0.15)' : 'rgba(255,255,255,0.03)',
                      borderColor: active ? 'var(--purple-core)' : 'var(--border-default)',
                      color: active ? 'var(--purple-soft)' : 'var(--text-secondary)',
                      boxShadow: active ? '0 0 16px rgba(124,58,237,0.25)' : 'none',
                    }}
                  >
                    {sn}
                  </button>
                )
              })}
            </div>
          )}

          {!useCustomPain ? (
            <button
              onClick={() => { setUseCustomPain(true); setSubNiche(null) }}
              className="mt-4 w-full px-4 py-3 rounded-xl border border-dashed text-sm inline-flex items-center justify-center gap-2 transition-colors"
              style={{ borderColor: 'var(--purple-border)', color: 'var(--purple-soft)', background: 'transparent' }}
            >
              <PencilLine size={15} /> Escrever minha própria dor principal
            </button>
          ) : (
            <div className="mt-4">
              <textarea
                autoFocus value={customPain} onChange={(e) => setCustomPain(e.target.value)}
                placeholder="Ex: secar barriga em casa com treinos curtos, mais plano alimentar de 21 dias com receitas fitness"
                className="lz-input min-h-[90px] resize-y" maxLength={200}
              />
              <button onClick={() => { setUseCustomPain(false); setCustomPain('') }} className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
                ← prefiro escolher da lista
              </button>
            </div>
          )}

          <button
            onClick={handleCreate}
            disabled={!canGenerate || creating}
            className="lz-btn-primary w-full mt-8 inline-flex items-center justify-center gap-2 text-base !py-4"
          >
            {creating ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
            {creating ? 'Criando estrutura...' : 'Gerar E-book com IA'}
          </button>
        </>
      )}
    </div>
  )
}
