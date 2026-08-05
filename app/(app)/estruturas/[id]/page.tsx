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
import { buildLandingHtml } from '@/lib/landing-export'
import { buildEbookHtml } from '@/lib/ebook-export'
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
    id: string; name: string; content: string | null; designJson: string | null; accentColor: string; price: number | null
    paymentIntegrationId: string | null; checkoutUrl: string | null; coverImageDataUri: string | null
  } | null
  landingPage: {
    slug: string; primaryColor: string; secondaryColor: string; publishedAt: string | null
    headline: string; copyJson: string; priceDisplay: string | null
    userHostedUrl: string | null; netlifySiteId: string | null
  } | null
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
  const [ebookAccent, setEbookAccent] = useState('#7c3aed')
  const autoStarted = useRef(false)

  // Passo 2 — produto (só Cakto cria produto automático; Kiwify/Hotmart não
  // suportam isso na API deles — ver lib/gateways.ts)
  const [priceInput, setPriceInput] = useState('')
  const [integrations, setIntegrations] = useState<Integration[] | null>(null)
  const [checkoutInput, setCheckoutInput] = useState('')
  const [savingProduct, setSavingProduct] = useState(false)
  const [gatewayMessage, setGatewayMessage] = useState<string | null>(null)

  // Passo 3 — landing
  const [primaryColor, setPrimaryColor] = useState('#7c3aed')
  const [secondaryColor, setSecondaryColor] = useState('#05050b')
  const [painInput, setPainInput] = useState('')
  const [generatingLanding, setGeneratingLanding] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [userUrlInput, setUserUrlInput] = useState('')

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
    setEbookAccent(s.product?.accentColor ?? '#7c3aed')
    if (s.product?.price != null) setPriceInput(s.product.price.toFixed(2).replace('.', ','))
    else setPriceInput(suggestPrice(s.niche).toFixed(2).replace('.', ','))
    if (s.product?.checkoutUrl) setCheckoutInput(s.product.checkoutUrl)
    if (s.landingPage) { setPrimaryColor(s.landingPage.primaryColor); setSecondaryColor(s.landingPage.secondaryColor); setUserUrlInput(s.landingPage.userHostedUrl ?? '') }
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
      // Capa ilustrada por IA: best-effort em segundo plano, não bloqueia a
      // tela — se falhar ou demorar, o e-book já está pronto do mesmo jeito.
      fetch(`/api/estruturas/${id}/ebook/cover`, { method: 'POST' })
        .then(() => load())
        .catch(() => {})
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

  // HTML do e-book designado (capa + páginas estilo Gamma). Estruturas antigas
  // sem designJson caem na versão texto simples.
  function buildEbookPreviewHtml(): string | null {
    const p = structure?.product
    if (!p) return null
    if (p.designJson) {
      try {
        return buildEbookHtml(JSON.parse(p.designJson), ebookAccent, {
          coverImageDataUri: p.coverImageDataUri,
          niche: structure?.niche,
        })
      } catch { /* cai no texto */ }
    }
    if (p.content) {
      return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>${p.name}</title>
<style>body{font-family:Georgia,serif;max-width:720px;margin:40px auto;padding:0 24px;line-height:1.7;color:#1a1a1a}
h1,h2,h3{font-family:Arial,Helvetica,sans-serif;line-height:1.25}h1{font-size:2rem}h2{margin-top:2.2em;font-size:1.4rem}
blockquote{border-left:4px solid #7c3aed;margin:1em 0;padding:.4em 1em;background:#f7f5ff}
hr{border:none;border-top:1px solid #ddd;margin:2.5em 0}</style></head><body>${markdownToHtml(p.content)}</body></html>`
    }
    return null
  }

  // Troca a cor de destaque do e-book: preview atualiza na hora e a escolha
  // fica salva para o download e futuras visitas.
  function handleEbookColor(color: string) {
    setEbookAccent(color)
    fetch(`/api/estruturas/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ebookAccentColor: color }),
    }).catch(() => toast.error('Não foi possível salvar a cor.'))
  }

  function handleDownload() {
    const p = structure?.product
    const html = buildEbookPreviewHtml()
    if (!p || !html) return
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `${p.name.replace(/[^\w\d]+/g, '-').toLowerCase()}.html`
    a.click()
    URL.revokeObjectURL(a.href)
    toast.success('E-book baixado! Abra no navegador e use "Imprimir → Salvar como PDF" para entregar em PDF.')
  }

  // HTML autossuficiente da página de vendas — o mesmo conteúdo é usado na
  // pré-visualização embutida (iframe) e no download para o usuário hospedar
  // onde quiser (Netlify Drop, Vercel...), sem depender da gente.
  function buildExportHtml(): string | null {
    const lp = structure?.landingPage
    if (!lp) return null
    let copy: any = { headline: lp.headline }
    try { copy = { ...copy, ...JSON.parse(lp.copyJson) } } catch { /* segue só com headline */ }
    return buildLandingHtml({
      productName: structure!.product?.name ?? structure!.title,
      priceDisplay: lp.priceDisplay,
      checkoutUrl: structure!.product?.checkoutUrl ?? null,
      primaryColor: lp.primaryColor,
      secondaryColor: lp.secondaryColor,
      niche: structure!.niche,
      coverImageDataUri: structure!.product?.coverImageDataUri,
      price: structure!.product?.price,
      copy,
    })
  }

  function handleDownloadLanding() {
    const html = buildExportHtml()
    if (!html) return
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'index.html'
    a.click()
    URL.revokeObjectURL(a.href)
    toast.success('Página baixada como index.html! Coloque numa pasta e arraste em netlify.com/drop para publicar grátis.')
  }

  async function handleSaveProduct() {
    const price = parseFloat(priceInput.replace(/\./g, '').replace(',', '.'))
    if (!Number.isFinite(price) || price < 1) { toast.error('Informe um preço válido, ex: 29,90'); return }
    setSavingProduct(true)
    setGatewayMessage(null)
    try {
      const caktoIntegration = integrations?.find((i) => i.provider === 'cakto' && i.status === 'conectado')
      const res = await fetch(`/api/estruturas/${id}/produto`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          price,
          paymentIntegrationId: caktoIntegration?.id ?? null,
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
    if (!checkoutInput.trim()) {
      const confirmed = window.confirm(
        'Você ainda não colou o link de checkout. A página vai sair com o botão de compra escrito "Link de compra ainda não configurado" até você colar esse link aqui e gerar de novo. Gerar mesmo assim?'
      )
      if (!confirmed) return
    }
    setGeneratingLanding(true)
    try {
      // O link de checkout agora é editado aqui (Passo 3), não no Passo 2 —
      // salva antes de gerar a página, preservando a integração já vinculada
      // (senão zeraria o vínculo com a Cakto ao enviar sem esse campo).
      const newCheckoutUrl = checkoutInput.trim() || null
      if (newCheckoutUrl !== (structure?.product?.checkoutUrl ?? null) && structure?.product?.price != null) {
        const resProduto = await fetch(`/api/estruturas/${id}/produto`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            price: structure.product.price,
            paymentIntegrationId: structure.product.paymentIntegrationId,
            checkoutUrl: newCheckoutUrl,
          }),
        })
        const dProduto = await resProduto.json().catch(() => ({}))
        if (!resProduto.ok) throw new Error(dProduto?.error ?? 'Erro ao salvar o link de checkout.')
      }

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

  // Publica na conta Netlify do próprio usuário (integração em /integracoes)
  async function handlePublishNetlify() {
    setPublishing(true)
    try {
      const res = await fetch(`/api/estruturas/${id}/publicar`, { method: 'POST' })
      const d = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(d?.error ?? 'Falha ao publicar.')
      // O link já volta pronto na resposta (a API já salva o mesmo valor em
      // landingPage.userHostedUrl) — mostra na hora, sem precisar rolar a
      // tela até o card verde "Sua página no ar" pra achar.
      toast.success('Página publicada! 🎉', {
        description: d.url,
        duration: 15_000,
        action: d.url ? { label: 'Copiar link', onClick: () => copyText(d.url, 'Link copiado!') } : undefined,
      })
      await load()
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setPublishing(false)
    }
  }

  async function handleSaveUserUrl() {
    try {
      const res = await fetch(`/api/estruturas/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ landingUserUrl: userUrlInput.trim() }),
      })
      const d = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(d?.error ?? 'Erro ao salvar a URL.')
      toast.success('URL da sua página salva! A mensagem de divulgação vai usá-la.')
      await load()
    } catch (e: any) {
      toast.error(e.message)
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
  // URL final da página: a que o usuário publicou (Netlify dele) — páginas
  // antigas ainda hospedadas em /p/ funcionam como fallback
  const landingUrl =
    structure.landingPage?.userHostedUrl ||
    (structure.landingPage?.publishedAt ? `${baseUrl}/p/${structure.landingPage.slug}` : null)
  const landingGenerated = Boolean(structure.landingPage)
  const hasNetlify = Boolean(integrations?.some((i) => i.provider === 'netlify' && i.status === 'conectado'))

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

          {!generating && (structure.product?.designJson || structure.product?.content) && (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <h2 className="font-grotesk text-lg" style={{ color: 'var(--text-primary)' }}>{structure.product!.name}</h2>
                <div className="flex gap-2">
                  {!structure.product?.designJson && (editing ? (
                    <button onClick={handleSaveEdit} className="lz-btn-primary !px-4 !py-2 text-xs inline-flex items-center gap-1.5">
                      <Check size={14} /> Salvar edição
                    </button>
                  ) : (
                    <button onClick={() => setEditing(true)} className="lz-btn-secondary !px-4 !py-2 text-xs inline-flex items-center gap-1.5">
                      <Pencil size={14} /> Editar
                    </button>
                  ))}
                  <button onClick={handleGenerateEbook} className="lz-btn-secondary !px-4 !py-2 text-xs inline-flex items-center gap-1.5">
                    <RefreshCw size={14} /> Gerar novamente
                  </button>
                  <button onClick={handleDownload} className="lz-btn-primary !px-4 !py-2 text-xs inline-flex items-center gap-1.5">
                    <Download size={14} /> Baixar e-book
                  </button>
                </div>
              </div>

              {structure.product?.designJson && (
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                    ◎ Cor do e-book
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {LANDING_PRIMARY_COLORS.map((c) => (
                      <button
                        key={c} onClick={() => handleEbookColor(c)} title={c}
                        className="w-7 h-7 rounded-full transition-transform hover:scale-110"
                        style={{ background: c, border: ebookAccent === c ? '3px solid #fff' : '2px solid rgba(255,255,255,0.15)' }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {editing && !structure.product?.designJson ? (
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  className="lz-input min-h-[480px] font-jet text-xs leading-relaxed resize-y"
                />
              ) : (
                /* Livro designado renderizado dentro do app — mesmo HTML do download */
                <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--purple-border)', boxShadow: '0 10px 40px rgba(124,58,237,0.15)' }}>
                  <div className="h-9 flex items-center px-3 gap-2" style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-default)' }}>
                    <div className="flex gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#ef4444cc' }} />
                      <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#f59e0bcc' }} />
                      <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#10b981cc' }} />
                    </div>
                    <span className="mx-auto px-3 py-0.5 rounded text-[10px] font-jet" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)' }}>
                      seu-ebook · página por página
                    </span>
                  </div>
                  <iframe
                    title="Pré-visualização do e-book"
                    srcDoc={buildEbookPreviewHtml() ?? ''}
                    sandbox="allow-scripts"
                    className="w-full block"
                    style={{ height: 620, border: 'none', background: '#edeaf6' }}
                  />
                </div>
              )}

              <p className="text-[11px] mt-3" style={{ color: 'var(--text-muted)' }}>
                💡 Role dentro do livro para ver todas as páginas. Para entregar em PDF: baixe, abra no navegador e use Imprimir → Salvar como PDF (cada página do livro vira uma página do PDF).
              </p>

              <button onClick={() => setStep(1)} className="lz-btn-primary w-full mt-4 inline-flex items-center justify-center gap-2">
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

            {(() => {
              const caktoIntegration = integrations?.find((i) => i.provider === 'cakto' && i.status === 'conectado')
              if (integrations === null) return <div className="h-11 rounded-xl skeleton-shimmer" />
              if (caktoIntegration) {
                return (
                  <div className="p-4 rounded-xl text-sm flex items-start gap-3"
                    style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)', color: 'var(--text-secondary)' }}>
                    <Plug size={16} className="shrink-0 mt-0.5" style={{ color: 'var(--success)' }} />
                    <span>
                      Cakto conectada{caktoIntegration.label ? ` (${caktoIntegration.label})` : ''} — o produto vai ser criado
                      automaticamente lá ao cadastrar. Só falta colar o link de checkout dela abaixo.
                    </span>
                  </div>
                )
              }
              return (
                <div className="p-4 rounded-xl text-sm flex items-start gap-3"
                  style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', color: 'var(--text-secondary)' }}>
                  <Plug size={16} className="shrink-0 mt-0.5" style={{ color: 'var(--warning)' }} />
                  <span>
                    Conecte sua conta <Link href="/integracoes" className="underline" style={{ color: 'var(--purple-soft)' }}>Cakto</Link>
                    {' '}para o produto ser criado automaticamente — ou siga sem conectar e cole o link de checkout manualmente abaixo.
                  </span>
                </div>
              )
            })()}

            {gatewayMessage && (
              <div className="p-4 rounded-xl text-sm"
                style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid var(--purple-border)', color: 'var(--text-secondary)' }}>
                {gatewayMessage}
              </div>
            )}

            <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
              O link de checkout é colado na próxima tela (Página de Vendas), direto onde ele é usado no botão de compra.
            </p>

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
        <div className="max-w-2xl mx-auto">
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
                  Link de checkout <span style={{ color: 'var(--text-muted)' }}>(do produto no seu gateway)</span>
                </label>
                <input
                  value={checkoutInput} onChange={(e) => setCheckoutInput(e.target.value)}
                  placeholder="https://pay.cakto.com.br/..." className="lz-input font-jet text-xs"
                  style={!checkoutInput.trim() ? { borderColor: 'var(--warning)' } : undefined}
                />
                {checkoutInput.trim() ? (
                  <p className="text-[11px] mt-1.5" style={{ color: 'var(--text-muted)' }}>
                    O botão de compra desta página vai apontar para este link.
                  </p>
                ) : (
                  <div className="mt-2 p-3 rounded-lg text-[11px] flex items-start gap-2"
                    style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', color: 'var(--text-secondary)' }}>
                    <Plug size={13} className="shrink-0 mt-0.5" style={{ color: 'var(--warning)' }} />
                    <span>
                      Vazio ainda. Mesmo com a Cakto conectada, ela cria o produto mas NÃO entrega esse link sozinha — copie em{' '}
                      <strong style={{ color: 'var(--text-primary)' }}>app.cakto.com.br → Produtos → abra o produto → aba &quot;Links&quot;</strong> e
                      cole aqui, senão o botão de compra sai como &quot;Link de compra ainda não configurado&quot;.
                    </span>
                  </div>
                )}
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

              {landingGenerated && (
                <>
                  {/* Pré-visualização embutida — renderiza exatamente o HTML que o botão baixa */}
                  <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--purple-border)', boxShadow: '0 10px 40px rgba(124,58,237,0.15)' }}>
                    <div className="h-9 flex items-center px-3 gap-2" style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-default)' }}>
                      <div className="flex gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#ef4444cc' }} />
                        <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#f59e0bcc' }} />
                        <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#10b981cc' }} />
                      </div>
                      <span className="mx-auto px-3 py-0.5 rounded text-[10px] font-jet" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)' }}>
                        sua-pagina-de-vendas · index.html
                      </span>
                    </div>
                    <iframe
                      title="Pré-visualização da página de vendas"
                      srcDoc={buildExportHtml() ?? ''}
                      sandbox=""
                      className="w-full block"
                      style={{ height: 480, border: 'none', background: structure.landingPage?.secondaryColor ?? '#05050b' }}
                    />
                  </div>

                  {/* Publicação com 1 clique (Netlify do usuário) */}
                  {hasNetlify ? (
                    <button onClick={handlePublishNetlify} disabled={publishing} className="lz-btn-primary w-full inline-flex items-center justify-center gap-2 text-sm">
                      {publishing ? <Loader2 size={15} className="animate-spin" /> : <Globe size={15} />}
                      {structure.landingPage?.netlifySiteId ? 'Republicar na minha Netlify (mesmo endereço)' : 'Publicar na minha Netlify com 1 clique'}
                    </button>
                  ) : (
                    <div className="p-3.5 rounded-xl text-xs flex items-start gap-2.5"
                      style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid var(--purple-border)', color: 'var(--text-secondary)' }}>
                      <Globe size={15} className="shrink-0 mt-0.5" style={{ color: 'var(--purple-soft)' }} />
                      <span>
                        ⚡ Quer publicar com <strong style={{ color: 'var(--text-primary)' }}>1 clique</strong>?{' '}
                        <Link href="/integracoes" className="underline" style={{ color: 'var(--purple-soft)' }}>Conecte sua conta Netlify</Link>
                        {' '}(grátis) e o botão de publicação automática aparece aqui.
                      </span>
                    </div>
                  )}

                  <button onClick={handleDownloadLanding} className="lz-btn-secondary w-full inline-flex items-center justify-center gap-2 text-sm">
                    <Download size={15} /> Baixar página (index.html)
                  </button>

                  {/* Passo a passo de hospedagem manual */}
                  <div className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-default)' }}>
                    <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--purple-soft)' }}>
                      📋 Como publicar sua página grátis (2 minutos)
                    </p>
                    <ol className="space-y-2">
                      {[
                        'Clique em "Baixar página" acima — o arquivo index.html vai para o seu computador.',
                        'Crie uma pasta nova e coloque o index.html dentro dela.',
                        <>Acesse <a href="https://app.netlify.com/drop" target="_blank" rel="noreferrer" className="underline" style={{ color: 'var(--purple-soft)' }}>app.netlify.com/drop</a> (grátis, sem cartão de crédito) e arraste a pasta para a tela.</>,
                        'Pronto! A Netlify gera sua URL na hora (algo como seusite.netlify.app).',
                        'Copie essa URL e cole no campo abaixo — a mensagem de divulgação vai usar o SEU link.',
                      ].map((s, i) => (
                        <li key={i} className="flex items-start gap-3 text-[13px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                          <span className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 font-jet text-[10px] font-bold mt-0.5"
                            style={{ background: 'rgba(124,58,237,0.18)', color: 'var(--purple-soft)', border: '1px solid var(--purple-border)' }}>
                            {i + 1}
                          </span>
                          <span>{s}</span>
                        </li>
                      ))}
                    </ol>
                    <p className="text-[11px] mt-3" style={{ color: 'var(--text-muted)' }}>
                      Também funciona na Vercel, Hostinger ou qualquer hospedagem — é um arquivo HTML comum, 100% seu.
                    </p>
                  </div>

                  {/* URL publicada pelo usuário */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>
                      URL da sua página publicada
                    </label>
                    <div className="flex gap-2">
                      <input
                        value={userUrlInput} onChange={(e) => setUserUrlInput(e.target.value)}
                        placeholder="https://seusite.netlify.app" className="lz-input font-jet text-xs flex-1"
                      />
                      <button onClick={handleSaveUserUrl} className="lz-btn-secondary !px-4 shrink-0 text-xs">Salvar</button>
                    </div>
                  </div>

                  {landingUrl && (
                    <div className="p-4 rounded-xl flex items-center justify-between gap-3"
                      style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.3)' }}>
                      <div className="min-w-0">
                        <p className="text-[10px] uppercase tracking-wider mb-0.5" style={{ color: 'var(--text-muted)' }}>Sua página no ar</p>
                        <span className="text-xs font-jet truncate block" style={{ color: 'var(--success)' }}>{landingUrl}</span>
                      </div>
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
                </>
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
                    key={g.id} href={g.groupUrl} target="_blank" rel="noreferrer" title={g.groupName}
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
                  Os links de Facebook "(via Google)" sempre abrem — leva pra uma busca no Google já filtrada pra grupos do tema. O link "Busca direta no Facebook" é mais rápido quando funciona, mas só abre certo se você já estiver logado no Facebook nesse navegador (senão mostra "not found" — nesse caso use o link via Google). Os de WhatsApp abrem uma busca no Google já otimizada para achar links de convite reais. Navegue pelos resultados, confira o grupo antes de entrar e respeite as regras de cada comunidade.
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
                  <button onClick={handleDownloadLanding} title="Baixar index.html para hospedar onde quiser" className="lz-btn-secondary !px-3 !py-2 text-xs"><Download size={13} /></button>
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
