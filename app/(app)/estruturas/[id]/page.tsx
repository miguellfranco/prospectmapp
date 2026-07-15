'use client'

import { Suspense, useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useParams, useSearchParams } from 'next/navigation'
import {
  ArrowLeft, ArrowRight, Check, Copy, Download, ExternalLink, Facebook, Globe,
  Loader2, MessageCircle, PartyPopper, Pencil, Plug, RefreshCw, Sparkles, Tag, Wand2,
} from 'lucide-react'
import { toast } from 'sonner'
import { markdownToHtml } from '@/lib/markdown'
import { suggestPrice, LANDING_PRIMARY_COLORS, LANDING_SECONDARY_COLORS } from '@/lib/ebookai-data'
import { WizardProgress, STRUCTURE_STATUS } from '@/components/lz/ebookai-ui'
import { brl } from '@/components/lz/ui'

interface StructureDetail {
  id: string
  niche: string
  subNiche: string | null
  title: string
  status: string
  product: {
    id: string; name: string; content: string | null; price: number | null
    paymentIntegrationId: string | null; checkoutUrl: string | null
  } | null
  landingPage: { slug: string; primaryColor: string; secondaryColor: string; publishedAt: string | null } | null
  outreachGroups: { id: string; platform: string; groupName: string; groupUrl: string; country: string }[]
  outreachMessages: { id: string; generatedText: string; createdAt: string }[]
}

interface Integration {
  id: string
  provider: string
  label: string | null
  status: string
}

function copyText(text: string, okMsg: string) {
  navigator.clipboard?.writeText(text)
    .then(() => toast.success(okMsg))
    .catch(() => toast.error('Não foi possível copiar.'))
}

function EstruturaWizard() {
  const params = useParams<{ id: string }>()
  const searchParams = useSearchParams()
  const id = params.id

  const [structure, setStructure] = useState<StructureDetail | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState(0)

  // Passo 1 — e-book
  const [generating, setGenerating] = useState(false)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const autoStarted = useRef(false)

  // Passo 2 — produto
  const [priceInput, setPriceInput] = useState('')
  const [integrations, setIntegrations] = useState<Integration[] | null>(null)
  const [selectedIntegration, setSelectedIntegration] = useState<string>('')
  const [checkoutInput, setCheckoutInput] = useState('')
  const [savingProduct, setSavingProduct] = useState(false)
  const [gatewayMessage, setGatewayMessage] = useState<string | null>(null)

  // Passo 3 — landing
  const [primaryColor, setPrimaryColor] = useState('#7c3aed')
  const [secondaryColor, setSecondaryColor] = useState('#05050b')
  const [painInput, setPainInput] = useState('')
  const [generatingLanding, setGeneratingLanding] = useState(false)

  // Passo 4 — grupos
  const [country, setCountry] = useState('BR')
  const [discovering, setDiscovering] = useState(false)
  const [generatingMsg, setGeneratingMsg] = useState(false)
  const [msgVariant, setMsgVariant] = useState(1)
  const [finishing, setFinishing] = useState(false)

  const load = useCallback(async () => {
    const res = await fetch(`/api/estruturas/${id}`)
    const d = await res.json().catch(() => null)
    if (!res.ok) { setError(d?.error ?? 'Erro ao carregar a estrutura.'); return null }
    const s: StructureDetail = d.structure
    setStructure(s)
    setDraft(s.product?.content ?? '')
    if (s.product?.price != null) setPriceInput(s.product.price.toFixed(2).replace('.', ','))
    else setPriceInput(suggestPrice(s.niche).toFixed(2).replace('.', ','))
    if (s.product?.paymentIntegrationId) setSelectedIntegration(s.product.paymentIntegrationId)
    if (s.product?.checkoutUrl) setCheckoutInput(s.product.checkoutUrl)
    if (s.landingPage) { setPrimaryColor(s.landingPage.primaryColor); setSecondaryColor(s.landingPage.secondaryColor) }
    setPainInput(s.title)
    setStep(STRUCTURE_STATUS[s.status]?.step ?? 0)
    return s
  }, [id])

  useEffect(() => {
    load().then((s) => {
      if (s && s.status === 'rascunho' && searchParams.get('gerar') === '1' && !autoStarted.current) {
        autoStarted.current = true
        handleGenerateEbook()
      }
    })
    fetch('/api/integracoes')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setIntegrations(d.integrations))
      .catch(() => setIntegrations([]))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  async function handleGenerateEbook() {
    setGenerating(true)
    try {
      const res = await fetch(`/api/estruturas/${id}/ebook`, { method: 'POST' })
      const d = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(d?.error ?? 'Falha ao gerar o e-book.')
      toast.success('E-book gerado com sucesso!')
      await load()
      setStep(0)
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setGenerating(false)
    }
  }

  async function handleSaveEdit() {
    try {
      const res = await fetch(`/api/estruturas/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ebookContent: draft }),
      })
      const d = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(d?.error ?? 'Erro ao salvar.')
      toast.success('E-book atualizado.')
      setEditing(false)
      await load()
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  function handleDownload() {
    if (!structure?.product?.content) return
    const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>${structure.product.name}</title>
<style>body{font-family:Georgia,serif;max-width:720px;margin:40px auto;padding:0 24px;line-height:1.7;color:#1a1a1a}
h1,h2,h3{font-family:Arial,Helvetica,sans-serif;line-height:1.25}h1{font-size:2rem}h2{margin-top:2.2em;font-size:1.4rem}
blockquote{border-left:4px solid #7c3aed;margin:1em 0;padding:.4em 1em;background:#f7f5ff}
hr{border:none;border-top:1px solid #ddd;margin:2.5em 0}</style></head><body>${markdownToHtml(structure.product.content)}
<hr/><p style="color:#888;font-size:.8rem">Gerado com InfoBook</p></body></html>`
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `${structure.product.name.replace(/[^\w\d]+/g, '-').toLowerCase()}.html`
    a.click()
    URL.revokeObjectURL(a.href)
    toast.success('E-book baixado! Abra no navegador e use "Imprimir → Salvar como PDF" para gerar o PDF.')
  }

  async function handleSaveProduct() {
    const price = parseFloat(priceInput.replace(/\./g, '').replace(',', '.'))
    if (!Number.isFinite(price) || price < 1) { toast.error('Informe um preço válido, ex: 29,90'); return }
    setSavingProduct(true)
    setGatewayMessage(null)
    try {
      const res = await fetch(`/api/estruturas/${id}/produto`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          price,
          paymentIntegrationId: selectedIntegration || null,
          checkoutUrl: checkoutInput.trim() || null,
        }),
      })
      const d = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(d?.error ?? 'Erro ao cadastrar o produto.')
      if (d.gatewayMessage) setGatewayMessage(d.gatewayMessage)
      toast.success('Produto salvo!')
      await load()
      setStep(2)
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setSavingProduct(false)
    }
  }

  async function handleGenerateLanding() {
    setGeneratingLanding(true)
    try {
      const res = await fetch(`/api/estruturas/${id}/landing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pain: painInput.trim(), primaryColor, secondaryColor }),
      })
      const d = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(d?.error ?? 'Falha ao gerar a página.')
      toast.success('Página de vendas publicada!')
      await load()
      setStep(3)
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setGeneratingLanding(false)
    }
  }

  async function handleDiscoverGroups() {
    setDiscovering(true)
    try {
      const res = await fetch(`/api/estruturas/${id}/grupos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ country }),
      })
      const d = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(d?.error ?? 'Falha ao buscar comunidades.')
      toast.success('Buscas de comunidades prontas!')
      await load()
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setDiscovering(false)
    }
  }

  async function handleGenerateMessage() {
    setGeneratingMsg(true)
    try {
      const nextVariant = (msgVariant % 3) + 1
      setMsgVariant(nextVariant)
      const res = await fetch(`/api/estruturas/${id}/mensagem`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ variant: nextVariant }),
      })
      const d = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(d?.error ?? 'Falha ao gerar a mensagem.')
      await load()
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setGeneratingMsg(false)
    }
  }

  async function handleFinish() {
    setFinishing(true)
    try {
      const res = await fetch(`/api/estruturas/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'concluida' }),
      })
      if (!res.ok) throw new Error('Erro ao concluir.')
      toast.success('Estrutura concluída! 🎉')
      await load()
      setStep(4)
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setFinishing(false)
    }
  }

  if (error) {
    return (
      <div className="p-6 md:p-10 max-w-3xl mx-auto">
        <div className="lz-card p-6 text-sm" style={{ color: 'var(--danger)' }}>{error}</div>
        <Link href="/estruturas" className="lz-btn-secondary inline-flex items-center gap-2 mt-4">
          <ArrowLeft size={15} /> Voltar
        </Link>
      </div>
    )
  }

  if (!structure) {
    return (
      <div className="p-6 md:p-10 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin" size={28} style={{ color: 'var(--purple-core)' }} />
      </div>
    )
  }

  const maxStep = STRUCTURE_STATUS[structure.status]?.step ?? 0
  const latestMessage = structure.outreachMessages[0] ?? null
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
  const landingUrl = structure.landingPage ? `${baseUrl}/p/${structure.landingPage.slug}` : null

  return (
    <div className="p-6 md:p-10 pb-24 md:pb-10 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <Link href="/estruturas" className="inline-flex items-center gap-1.5 text-sm" style={{ color: 'var(--text-secondary)' }}>
          <ArrowLeft size={15} /> Minhas Estruturas
        </Link>
        <span className="lz-badge lz-badge-hot">{structure.niche}</span>
      </div>

      {step < 4 && <WizardProgress current={step} />}

      {/* ============ PASSO 1 — E-BOOK ============ */}
      {step === 0 && (
        <div>
          <div className="text-center mb-8">
            <h1 className="text-2xl font-grotesk" style={{ color: 'var(--text-primary)' }}>Criar E-book</h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{structure.title}</p>
          </div>

          {generating && (
            <div className="lz-card p-10 text-center">
              <Wand2 size={36} className="mx-auto mb-4 animate-pulse" style={{ color: 'var(--purple-soft)' }} />
              <p className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>A IA está escrevendo seu e-book...</p>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Isso leva de 20 a 50 segundos. Não feche a página.</p>
              <div className="mt-6 space-y-2 max-w-md mx-auto">
                <div className="h-3 rounded-full skeleton-shimmer" />
                <div className="h-3 rounded-full skeleton-shimmer w-4/5 mx-auto" />
                <div className="h-3 rounded-full skeleton-shimmer w-3/5 mx-auto" />
              </div>
            </div>
          )}

          {!generating && !structure.product?.content && (
            <div className="lz-card p-10 text-center">
              <Sparkles size={36} className="mx-auto mb-4" style={{ color: 'var(--purple-core)', opacity: 0.5 }} />
              <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
                Tudo pronto para gerar um e-book completo sobre <strong style={{ color: 'var(--text-primary)' }}>{structure.niche}</strong> resolvendo:
                <br /><em>“{structure.title}”</em>
              </p>
              <button onClick={handleGenerateEbook} className="lz-btn-primary inline-flex items-center gap-2">
                <Sparkles size={16} /> Gerar E-book com IA
              </button>
            </div>
          )}

          {!generating && structure.product?.content && (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <h2 className="font-grotesk text-lg" style={{ color: 'var(--text-primary)' }}>{structure.product.name}</h2>
                <div className="flex gap-2">
                  {editing ? (
                    <button onClick={handleSaveEdit} className="lz-btn-primary !px-4 !py-2 text-xs inline-flex items-center gap-1.5">
                      <Check size={14} /> Salvar edição
                    </button>
                  ) : (
                    <button onClick={() => setEditing(true)} className="lz-btn-secondary !px-4 !py-2 text-xs inline-flex items-center gap-1.5">
                      <Pencil size={14} /> Editar
                    </button>
                  )}
                  <button onClick={handleGenerateEbook} className="lz-btn-secondary !px-4 !py-2 text-xs inline-flex items-center gap-1.5">
                    <RefreshCw size={14} /> Gerar novamente
                  </button>
                  <button onClick={handleDownload} className="lz-btn-secondary !px-4 !py-2 text-xs inline-flex items-center gap-1.5">
                    <Download size={14} /> Baixar
                  </button>
                </div>
              </div>

              {editing ? (
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  className="lz-input min-h-[480px] font-jet text-xs leading-relaxed resize-y"
                />
              ) : (
                <div
                  className="lz-card p-8 max-h-[560px] overflow-y-auto prose-invert"
                  style={{ color: 'var(--text-secondary)', lineHeight: 1.8 }}
                  dangerouslySetInnerHTML={{ __html: markdownToHtml(structure.product.content) }}
                />
              )}

              <button onClick={() => setStep(1)} className="lz-btn-primary w-full mt-6 inline-flex items-center justify-center gap-2">
                Continuar para o Produto <ArrowRight size={16} />
              </button>
            </>
          )}
        </div>
      )}

      {/* ============ PASSO 2 — PRODUTO ============ */}
      {step === 1 && (
        <div className="max-w-xl mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4"
              style={{ background: 'rgba(124,58,237,0.12)', border: '1px solid var(--purple-border)' }}>
              <Tag size={22} style={{ color: 'var(--purple-soft)' }} />
            </div>
            <h1 className="text-2xl font-grotesk" style={{ color: 'var(--text-primary)' }}>Cadastro na Plataforma de Vendas</h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
              Antes de cadastrarmos, coloque o valor que você quer vender o produto.
            </p>
          </div>

          <div className="lz-card p-6 space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>
                Preço do produto (R$)
              </label>
              <input
                value={priceInput} onChange={(e) => setPriceInput(e.target.value)}
                placeholder="Ex: 29,90" className="lz-input font-jet" inputMode="decimal"
              />
              <p className="text-[11px] mt-1.5" style={{ color: 'var(--text-muted)' }}>
                Sugestão para o nicho {structure.niche}: {brl(suggestPrice(structure.niche))}
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>
                Gateway de pagamento
              </label>
              {integrations === null ? (
                <div className="h-11 rounded-xl skeleton-shimmer" />
              ) : integrations.length === 0 ? (
                <div className="p-4 rounded-xl text-sm flex items-start gap-3"
                  style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', color: 'var(--text-secondary)' }}>
                  <Plug size={16} className="shrink-0 mt-0.5" style={{ color: 'var(--warning)' }} />
                  <span>
                    Você ainda não conectou nenhum gateway.{' '}
                    <Link href="/integracoes" className="underline" style={{ color: 'var(--purple-soft)' }}>Conectar Kiwify / Hotmart</Link>
                    {' '}— ou siga sem gateway e cole o link de checkout abaixo.
                  </span>
                </div>
              ) : (
                <select value={selectedIntegration} onChange={(e) => setSelectedIntegration(e.target.value)} className="lz-input">
                  <option value="">Sem gateway (colar link manualmente)</option>
                  {integrations.map((i) => (
                    <option key={i.id} value={i.id}>
                      {(i.label || i.provider).toUpperCase()} {i.status === 'conectado' ? '· conectado' : '· com erro'}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {gatewayMessage && (
              <div className="p-4 rounded-xl text-sm"
                style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid var(--purple-border)', color: 'var(--text-secondary)' }}>
                {gatewayMessage}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>
                Link de checkout <span style={{ color: 'var(--text-muted)' }}>(do produto no seu gateway)</span>
              </label>
              <input
                value={checkoutInput} onChange={(e) => setCheckoutInput(e.target.value)}
                placeholder="https://pay.kiwify.com.br/..." className="lz-input font-jet text-xs"
              />
              <p className="text-[11px] mt-1.5" style={{ color: 'var(--text-muted)' }}>
                O botão de compra da sua página de vendas vai apontar para este link.
              </p>
            </div>

            <button onClick={handleSaveProduct} disabled={savingProduct} className="lz-btn-primary w-full inline-flex items-center justify-center gap-2">
              {savingProduct ? <Loader2 size={16} className="animate-spin" /> : <Tag size={16} />}
              Cadastrar Produto
            </button>
          </div>

          <div className="flex justify-between mt-5">
            <button onClick={() => setStep(0)} className="text-sm inline-flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
              <ArrowLeft size={14} /> Voltar
            </button>
            {maxStep >= 2 && (
              <button onClick={() => setStep(2)} className="text-sm inline-flex items-center gap-1.5" style={{ color: 'var(--purple-soft)' }}>
                Pular para a Página <ArrowRight size={14} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* ============ PASSO 3 — PÁGINA DE VENDAS ============ */}
      {step === 2 && (
        <div className="max-w-xl mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4"
              style={{ background: 'rgba(124,58,237,0.12)', border: '1px solid var(--purple-border)' }}>
              <Globe size={22} style={{ color: 'var(--purple-soft)' }} />
            </div>
            <h1 className="text-2xl font-grotesk" style={{ color: 'var(--text-primary)' }}>Página de Vendas</h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
              Preencha os dados do seu produto para gerar sua página.
            </p>
          </div>

          {generatingLanding ? (
            <div className="lz-card p-10 text-center">
              <Globe size={36} className="mx-auto mb-4 animate-pulse" style={{ color: 'var(--purple-soft)' }} />
              <p className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Escrevendo a copy e publicando sua página...</p>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Alguns segundos. Não feche a página.</p>
            </div>
          ) : (
            <div className="lz-card p-6 space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Nome do produto / nicho
                </label>
                <input value={structure.product?.name ?? structure.title} disabled className="lz-input opacity-70" />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Preço do produto
                </label>
                <input value={structure.product?.price != null ? brl(structure.product.price) : ''} disabled className="lz-input opacity-70 font-jet" />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Dor principal que o produto resolve *
                </label>
                <textarea
                  value={painInput} onChange={(e) => setPainInput(e.target.value)}
                  className="lz-input min-h-[80px] resize-y" maxLength={200}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>
                    ◎ Cor primária
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {LANDING_PRIMARY_COLORS.map((c) => (
                      <button
                        key={c} onClick={() => setPrimaryColor(c)} title={c}
                        className="w-8 h-8 rounded-full transition-transform hover:scale-110"
                        style={{ background: c, border: primaryColor === c ? '3px solid #fff' : '2px solid rgba(255,255,255,0.15)' }}
                      />
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>
                    ◎ Cor de fundo
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {LANDING_SECONDARY_COLORS.map((c) => (
                      <button
                        key={c} onClick={() => setSecondaryColor(c)} title={c}
                        className="w-8 h-8 rounded-full transition-transform hover:scale-110"
                        style={{ background: c, border: secondaryColor === c ? '3px solid var(--purple-core)' : '2px solid rgba(255,255,255,0.15)' }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <button onClick={handleGenerateLanding} disabled={!painInput.trim()} className="lz-btn-primary w-full inline-flex items-center justify-center gap-2">
                <Sparkles size={16} /> {structure.landingPage ? 'Gerar página novamente' : 'Gerar Página de Vendas'}
              </button>

              {landingUrl && (
                <div className="p-4 rounded-xl flex items-center justify-between gap-3"
                  style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.3)' }}>
                  <span className="text-xs font-jet truncate" style={{ color: 'var(--success)' }}>{landingUrl}</span>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => copyText(landingUrl, 'Link copiado!')} className="p-2 rounded-lg" style={{ color: 'var(--success)' }}>
                      <Copy size={15} />
                    </button>
                    <a href={landingUrl} target="_blank" rel="noreferrer" className="p-2 rounded-lg" style={{ color: 'var(--success)' }}>
                      <ExternalLink size={15} />
                    </a>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-between mt-5">
            <button onClick={() => setStep(1)} className="text-sm inline-flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
              <ArrowLeft size={14} /> Voltar
            </button>
            {maxStep >= 3 && (
              <button onClick={() => setStep(3)} className="text-sm inline-flex items-center gap-1.5" style={{ color: 'var(--purple-soft)' }}>
                Continuar para Grupos <ArrowRight size={14} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* ============ PASSO 4 — GRUPOS ============ */}
      {step === 3 && (
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4"
              style={{ background: 'rgba(124,58,237,0.12)', border: '1px solid var(--purple-border)' }}>
              <MessageCircle size={22} style={{ color: 'var(--purple-soft)' }} />
            </div>
            <h1 className="text-2xl font-grotesk" style={{ color: 'var(--text-primary)' }}>Divulgação</h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
              Encontre comunidades do seu nicho e gere a mensagem para postar.
            </p>
          </div>

          <div className="lz-card p-6 mb-5">
            <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
              <div className="flex-1">
                <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>
                  País do público
                </label>
                <select value={country} onChange={(e) => setCountry(e.target.value)} className="lz-input">
                  <option value="BR">🇧🇷 Brasil</option>
                  <option value="PT">🇵🇹 Portugal</option>
                  <option value="US">🇺🇸 Estados Unidos</option>
                </select>
              </div>
              <button onClick={handleDiscoverGroups} disabled={discovering} className="lz-btn-primary inline-flex items-center justify-center gap-2">
                {discovering ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                Descobrir comunidades
              </button>
            </div>

            {structure.outreachGroups.length > 0 && (
              <div className="mt-5 space-y-2 max-h-80 overflow-y-auto">
                {structure.outreachGroups.map((g) => (
                  <a
                    key={g.id} href={g.groupUrl} target="_blank" rel="noreferrer"
                    className="flex items-center gap-3 p-3 rounded-xl transition-colors hover:brightness-125"
                    style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)' }}
                  >
                    {g.platform === 'facebook'
                      ? <Facebook size={18} style={{ color: '#3b82f6' }} className="shrink-0" />
                      : <MessageCircle size={18} style={{ color: '#10b981' }} className="shrink-0" />}
                    <span className="text-sm flex-1 truncate" style={{ color: 'var(--text-primary)' }}>{g.groupName}</span>
                    <ExternalLink size={14} style={{ color: 'var(--text-muted)' }} className="shrink-0" />
                  </a>
                ))}
                <p className="text-[11px] pt-1" style={{ color: 'var(--text-muted)' }}>
                  Os links abrem a busca oficial de cada plataforma — escolha os grupos reais que combinam com seu público e participe respeitando as regras de cada comunidade.
                </p>
              </div>
            )}
          </div>

          <div className="lz-card p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Mensagem de divulgação</p>
              <button onClick={handleGenerateMessage} disabled={generatingMsg} className="lz-btn-secondary !px-4 !py-2 text-xs inline-flex items-center gap-1.5">
                {generatingMsg ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
                {latestMessage ? 'Gerar outra' : 'Gerar mensagem persuasiva'}
              </button>
            </div>

            {latestMessage ? (
              <>
                <div className="p-4 rounded-xl text-sm whitespace-pre-wrap leading-relaxed"
                  style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}>
                  {latestMessage.generatedText}
                </div>
                <button
                  onClick={() => copyText(latestMessage.generatedText, 'Mensagem copiada! Cole no grupo escolhido.')}
                  className="lz-btn-secondary w-full mt-3 inline-flex items-center justify-center gap-2 text-sm"
                >
                  <Copy size={15} /> Copiar mensagem
                </button>
              </>
            ) : (
              <p className="text-sm text-center py-6" style={{ color: 'var(--text-muted)' }}>
                Clique em “Gerar mensagem persuasiva” — a IA escreve um texto honesto e chamativo com o link da sua página.
              </p>
            )}
          </div>

          <div className="flex justify-between items-center mt-6">
            <button onClick={() => setStep(2)} className="text-sm inline-flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
              <ArrowLeft size={14} /> Voltar
            </button>
            <button onClick={handleFinish} disabled={finishing} className="lz-btn-primary inline-flex items-center gap-2">
              {finishing ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
              Concluir estrutura
            </button>
          </div>
        </div>
      )}

      {/* ============ TELA FINAL — CONCLUÍDA ============ */}
      {step === 4 && (
        <div className="max-w-xl mx-auto text-center">
          <PartyPopper size={48} className="mx-auto mb-5" style={{ color: 'var(--success)' }} />
          <h1 className="text-3xl font-grotesk mb-2" style={{ color: 'var(--text-primary)' }}>Estrutura concluída!</h1>
          <p className="text-sm mb-8" style={{ color: 'var(--text-secondary)' }}>
            Seu funil está pronto. Aqui está o resumo de tudo o que foi criado:
          </p>

          <div className="lz-card p-6 space-y-4 text-left">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>E-book</p>
                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{structure.product?.name}</p>
              </div>
              <button onClick={handleDownload} className="lz-btn-secondary !px-4 !py-2 text-xs inline-flex items-center gap-1.5 shrink-0">
                <Download size={13} /> Baixar
              </button>
            </div>

            <div className="flex items-center justify-between gap-3" style={{ borderTop: '1px solid var(--border-default)', paddingTop: '1rem' }}>
              <div>
                <p className="text-xs uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Preço</p>
                <p className="text-sm font-jet" style={{ color: 'var(--purple-soft)' }}>
                  {structure.product?.price != null ? brl(structure.product.price) : '—'}
                </p>
              </div>
              {structure.product?.checkoutUrl ? (
                <a href={structure.product.checkoutUrl} target="_blank" rel="noreferrer" className="lz-btn-secondary !px-4 !py-2 text-xs inline-flex items-center gap-1.5 shrink-0">
                  <ExternalLink size={13} /> Checkout
                </a>
              ) : (
                <span className="text-xs" style={{ color: 'var(--warning)' }}>checkout pendente</span>
              )}
            </div>

            <div className="flex items-center justify-between gap-3" style={{ borderTop: '1px solid var(--border-default)', paddingTop: '1rem' }}>
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Página de vendas</p>
                {landingUrl ? (
                  <p className="text-xs font-jet truncate" style={{ color: 'var(--success)' }}>{landingUrl}</p>
                ) : (
                  <p className="text-xs" style={{ color: 'var(--warning)' }}>não gerada</p>
                )}
              </div>
              {landingUrl && (
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => copyText(landingUrl, 'Link copiado!')} className="lz-btn-secondary !px-3 !py-2 text-xs"><Copy size={13} /></button>
                  <a href={landingUrl} target="_blank" rel="noreferrer" className="lz-btn-secondary !px-3 !py-2 text-xs"><ExternalLink size={13} /></a>
                </div>
              )}
            </div>

            {latestMessage && (
              <div style={{ borderTop: '1px solid var(--border-default)', paddingTop: '1rem' }}>
                <p className="text-xs uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>Mensagem de divulgação</p>
                <p className="text-xs whitespace-pre-wrap p-3 rounded-lg" style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}>
                  {latestMessage.generatedText}
                </p>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mt-8">
            <Link href="/painel" className="lz-btn-secondary flex-1 inline-flex items-center justify-center">Voltar ao painel</Link>
            <Link href="/estruturas/nova" className="lz-btn-primary flex-1 inline-flex items-center justify-center gap-2">
              <Sparkles size={16} /> Criar nova estrutura
            </Link>
          </div>

          <button onClick={() => setStep(3)} className="text-xs mt-6" style={{ color: 'var(--text-muted)' }}>
            ← voltar para a divulgação
          </button>
        </div>
      )}
    </div>
  )
}

export default function EstruturaPage() {
  return (
    <Suspense fallback={
      <div className="p-6 md:p-10 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin" size={28} style={{ color: 'var(--purple-core)' }} />
      </div>
    }>
      <EstruturaWizard />
    </Suspense>
  )
}
