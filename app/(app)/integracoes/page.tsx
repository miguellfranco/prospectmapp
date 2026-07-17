'use client'

import { useEffect, useState } from 'react'
import { CheckCircle2, Copy, Loader2, Plug, Plus, RefreshCw, Trash2, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader, EmptyState } from '@/components/lz/ui'

interface Integration {
  id: string
  provider: string
  label: string | null
  status: string
  statusMessage: string | null
  lastCheckedAt: string | null
  createdAt: string
  webhookPath: string
}

const PROVIDERS = [
  {
    id: 'kiwify',
    name: 'Kiwify',
    steps: [
      'Acesse dashboard.kiwify.com.br e faça login na sua conta Kiwify.',
      'No menu lateral, procure "Apps" (ou Configurações → Desenvolvedor) e clique em "API".',
      'Clique em "Criar chave de API" — a Kiwify vai mostrar o Client ID, o Client Secret e o Account ID.',
      'Copie e cole cada um nos campos abaixo (o Secret aparece uma única vez — copie na hora!).',
      'Clique em "Validar e salvar" — nós testamos a conexão direto com a Kiwify.',
      'Depois de salvar, copie a URL do webhook que aparece no cartão da integração e cadastre na Kiwify em Apps → Webhooks, marcando o evento "Compra aprovada" — suas vendas passam a aparecer no painel automaticamente.',
    ],
  },
  {
    id: 'hotmart',
    name: 'Hotmart',
    steps: [
      'Acesse app.hotmart.com e faça login na sua conta Hotmart.',
      'No menu, vá em "Ferramentas" e procure "Credenciais (API e SSO)".',
      'Clique em "Criar credencial" e dê um nome (ex: InfoBook).',
      'Copie o Client ID e o Client Secret e cole nos campos abaixo.',
      'Clique em "Validar e salvar" — nós testamos a conexão direto com a Hotmart.',
      'Depois de salvar, copie a URL do webhook do cartão da integração e cadastre na Hotmart em Ferramentas → Webhook (evento "Compra aprovada").',
    ],
  },
  {
    id: 'outro',
    name: 'Outro',
    steps: [
      'Use esta opção para guardar credenciais de outro gateway (Cacto, Braip, etc.).',
      'Cole o Client ID / chave e o Secret nos campos abaixo — ficam criptografados.',
      'Este provedor não tem validação automática; confira as credenciais manualmente.',
      'Depois de salvar, cadastre a URL do webhook no seu gateway para receber as vendas no painel.',
    ],
  },
]

export default function IntegracoesPage() {
  const [integrations, setIntegrations] = useState<Integration[] | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [provider, setProvider] = useState('kiwify')
  const [label, setLabel] = useState('')
  const [clientId, setClientId] = useState('')
  const [clientSecret, setClientSecret] = useState('')
  const [accountId, setAccountId] = useState('')
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState<string | null>(null)
  const [removing, setRemoving] = useState<string | null>(null)

  function load() {
    fetch('/api/integracoes')
      .then(async (r) => {
        const d = await r.json().catch(() => null)
        if (!r.ok) throw new Error(d?.error ?? 'Erro ao carregar integrações.')
        setIntegrations(d.integrations)
      })
      .catch((e) => { toast.error(e.message); setIntegrations([]) })
  }

  useEffect(() => { load() }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/integracoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, label: label.trim() || null, clientId, clientSecret, accountId: accountId.trim() || undefined }),
      })
      const d = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(d?.error ?? 'Erro ao salvar.')
      if (d.check?.ok) toast.success(d.check.message)
      else toast.warning(d.check?.message ?? 'Salvo, mas a conexão não foi validada.')
      setShowForm(false)
      setLabel(''); setClientId(''); setClientSecret(''); setAccountId('')
      load()
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleTest(id: string) {
    setTesting(id)
    try {
      const res = await fetch(`/api/integracoes/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'test' }),
      })
      const d = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(d?.error ?? 'Erro ao testar.')
      if (d.status === 'conectado') toast.success(d.message)
      else toast.warning(d.message)
      load()
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setTesting(null)
    }
  }

  async function handleRemove(id: string) {
    if (!window.confirm('Remover esta integração? Os produtos vinculados a ela deixam de receber vendas pelo webhook.')) return
    setRemoving(id)
    try {
      const res = await fetch(`/api/integracoes/${id}`, { method: 'DELETE' })
      const d = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(d?.error ?? 'Erro ao remover.')
      toast.success('Integração removida.')
      load()
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setRemoving(null)
    }
  }

  const selectedProvider = PROVIDERS.find((p) => p.id === provider)!
  const origin = typeof window !== 'undefined' ? window.location.origin : ''

  return (
    <div className="p-6 md:p-10 pb-24 md:pb-10 max-w-4xl mx-auto">
      <PageHeader
        title="Integrações de"
        highlight="Pagamento"
        description="Conecte sua conta Kiwify ou Hotmart para vincular produtos e receber as vendas no painel."
        actions={
          <button onClick={() => setShowForm((v) => !v)} className="lz-btn-primary inline-flex items-center gap-2">
            <Plus size={16} /> Conectar gateway
          </button>
        }
      />

      {showForm && (
        <form onSubmit={handleSave} className="lz-card p-6 mb-8 space-y-5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>Provedor</label>
            <div className="grid grid-cols-3 gap-3">
              {PROVIDERS.map((p) => (
                <button
                  key={p.id} type="button" onClick={() => setProvider(p.id)}
                  className="px-4 py-3 rounded-xl border text-sm font-semibold transition-all"
                  style={{
                    background: provider === p.id ? 'rgba(124,58,237,0.15)' : 'rgba(255,255,255,0.03)',
                    borderColor: provider === p.id ? 'var(--purple-core)' : 'var(--border-default)',
                    color: provider === p.id ? 'var(--purple-soft)' : 'var(--text-secondary)',
                  }}
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          {/* Passo a passo do provedor selecionado */}
          <div className="p-4 rounded-xl" style={{ background: 'rgba(124,58,237,0.06)', border: '1px solid var(--purple-border)' }}>
            <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--purple-soft)' }}>
              📋 Passo a passo — como conectar a {selectedProvider.name}
            </p>
            <ol className="space-y-2">
              {selectedProvider.steps.map((s, i) => (
                <li key={i} className="flex items-start gap-3 text-[13px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  <span className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 font-jet text-[10px] font-bold mt-0.5"
                    style={{ background: 'rgba(124,58,237,0.18)', color: 'var(--purple-soft)', border: '1px solid var(--purple-border)' }}>
                    {i + 1}
                  </span>
                  <span>{s}</span>
                </li>
              ))}
            </ol>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>Apelido (opcional)</label>
              <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Ex: Conta principal" className="lz-input" maxLength={80} />
            </div>
            {provider === 'kiwify' && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>Account ID (opcional)</label>
                <input value={accountId} onChange={(e) => setAccountId(e.target.value)} placeholder="ID da conta Kiwify" className="lz-input font-jet text-xs" />
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>Client ID</label>
              <input value={clientId} onChange={(e) => setClientId(e.target.value)} required={provider !== 'outro'} className="lz-input font-jet text-xs" autoComplete="off" />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>Client Secret</label>
              <input value={clientSecret} onChange={(e) => setClientSecret(e.target.value)} required={provider !== 'outro'} type="password" className="lz-input font-jet text-xs" autoComplete="off" />
            </div>
          </div>

          <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
            🔒 Suas credenciais são criptografadas (AES-256) antes de serem salvas e validadas direto com a API oficial do gateway.
          </p>

          <div className="flex gap-3">
            <button type="button" onClick={() => setShowForm(false)} className="lz-btn-secondary flex-1">Cancelar</button>
            <button type="submit" disabled={saving} className="lz-btn-primary flex-1 inline-flex items-center justify-center gap-2">
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Plug size={16} />}
              Validar e salvar
            </button>
          </div>
        </form>
      )}

      {integrations === null && (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="animate-spin" size={28} style={{ color: 'var(--purple-core)' }} />
        </div>
      )}

      {integrations && integrations.length === 0 && !showForm && (
        <div className="lz-card">
          <EmptyState
            icon={Plug}
            title="Nenhum gateway conectado"
            subtitle="Conecte sua conta Kiwify ou Hotmart para vincular seus produtos e acompanhar o faturamento no painel."
            action={
              <button onClick={() => setShowForm(true)} className="lz-btn-primary inline-flex items-center gap-2">
                <Plus size={16} /> Conectar gateway
              </button>
            }
          />
        </div>
      )}

      {integrations && integrations.length > 0 && (
        <div className="space-y-4">
          {integrations.map((i) => {
            const webhookUrl = `${origin}${i.webhookPath}`
            return (
              <div key={i.id} className="lz-card p-6">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ background: 'rgba(124,58,237,0.12)', border: '1px solid var(--purple-border)' }}>
                      <Plug size={18} style={{ color: 'var(--purple-soft)' }} />
                    </div>
                    <div>
                      <p className="font-semibold capitalize" style={{ color: 'var(--text-primary)' }}>
                        {i.provider}{i.label ? ` · ${i.label}` : ''}
                      </p>
                      <p className="text-xs inline-flex items-center gap-1.5 mt-0.5" style={{ color: i.status === 'conectado' ? 'var(--success)' : 'var(--danger)' }}>
                        {i.status === 'conectado' ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                        {i.status === 'conectado' ? 'Conectado' : i.statusMessage ?? 'Erro de conexão'}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleTest(i.id)} disabled={testing === i.id} className="lz-btn-secondary !px-4 !py-2 text-xs inline-flex items-center gap-1.5">
                      {testing === i.id ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
                      Testar conexão
                    </button>
                    <button onClick={() => handleRemove(i.id)} disabled={removing === i.id}
                      className="p-2.5 rounded-xl transition-colors" title="Remover"
                      style={{ color: 'var(--text-muted)', border: '1px solid var(--border-default)' }}>
                      {removing === i.id ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                    </button>
                  </div>
                </div>

                <div className="p-4 rounded-xl" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)' }}>
                  <p className="text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                    Webhook de vendas
                  </p>
                  <div className="flex items-center gap-2">
                    <code className="text-[11px] font-jet flex-1 truncate" style={{ color: 'var(--purple-soft)' }}>{webhookUrl}</code>
                    <button
                      onClick={() => { navigator.clipboard?.writeText(webhookUrl).then(() => toast.success('URL do webhook copiada!')) }}
                      className="p-2 rounded-lg shrink-0" style={{ color: 'var(--text-secondary)' }}
                    >
                      <Copy size={14} />
                    </button>
                  </div>
                  <p className="text-[11px] mt-2" style={{ color: 'var(--text-muted)' }}>
                    Cadastre esta URL nos webhooks do {i.provider === 'kiwify' ? 'painel da Kiwify (evento: Compra aprovada)' : i.provider === 'hotmart' ? 'painel da Hotmart (evento: Compra aprovada)' : 'seu gateway'} — cada venda aprovada aparece automaticamente no seu painel.
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
