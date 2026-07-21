'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  ShieldAlert, Loader2, Sparkles, Layers, Trash2, RefreshCw, Database, Users, ShoppingCart, Plug, FlaskConical,
} from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader, brl } from '@/components/lz/ui'

interface AdminStatus {
  admins: { email: string; name: string | null }[]
  masterEmail: string | null
  seedSalesCount: number
  seedSalesTotal: number
  seedRevenue: { today: number; last7: number; last30: number; allTime: number }
  demoStructuresCount: number
  app: { users: number; structures: number; sales: number; integrations: number }
  caktoCheckoutUrls: Record<string, string>
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
  const [revCount, setRevCount] = useState('')

  // Estruturas demo configuráveis
  const [stCount, setStCount] = useState('9')
  const [stEbooks, setStEbooks] = useState('8')
  const [stLandings, setStLandings] = useState('2')

  // Gestão de administradores
  const [adminEmail, setAdminEmail] = useState('')

  // Resultado do setup 1-clique da Cakto (produtos + webhook + afiliados)
  const [caktoResult, setCaktoResult] = useState<{
    products: { plan: string; name: string; id: string; created: boolean; affiliateEnabled: boolean }[]
    webhook: { id: string; url: string; created: boolean; secretStored: boolean }
  } | null>(null)

  // Links de checkout da Cakto por plano (colados manualmente do painel deles)
  const [caktoUrlMensal, setCaktoUrlMensal] = useState('')
  const [caktoUrlTrimestral, setCaktoUrlTrimestral] = useState('')
  const [caktoUrlVitalicio, setCaktoUrlVitalicio] = useState('')

  function syncRevenueInputs(s: AdminStatus) {
    setRevToday(fmtBr(s.seedRevenue.today))
    setRev7(fmtBr(s.seedRevenue.last7))
    setRev30(fmtBr(s.seedRevenue.last30))
    setRevAll(fmtBr(s.seedRevenue.allTime))
    setCaktoUrlMensal(s.caktoCheckoutUrls?.mensal ?? '')
    setCaktoUrlTrimestral(s.caktoCheckoutUrls?.trimestral ?? '')
    setCaktoUrlVitalicio(s.caktoCheckoutUrls?.vitalicio ?? '')
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
      if (action === 'grant-admin') { toast.success(`${d.granted} agora é administrador! 🛡`); setAdminEmail('') }
      if (action === 'revoke-admin') toast.success(`Acesso de admin removido de ${d.revoked}.`)
      if (action === 'cakto-setup') { toast.success('Cakto configurada! Produtos e webhook prontos. 🥑'); setCaktoResult(d.cakto) }
      if (action === 'set-cakto-checkout-urls') toast.success('Links de checkout salvos! O site já vai usá-los.')
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

        {/* Estruturas de demonstração — números do funil sob medida */}
        <div className="lz-card p-6 flex flex-col">
          <div className="flex items-center gap-2 mb-1">
            <FlaskConical size={16} style={{ color: 'var(--purple-soft)' }} />
            <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Funil sob medida (estruturas demo)</p>
          </div>
          <p className="text-xs mb-5" style={{ color: 'var(--text-muted)' }}>
            Controla os números do funil no painel: Estruturas, E-books gerados e Páginas no ar.
            Atual: <strong style={{ color: 'var(--purple-soft)' }}>{status.demoStructuresCount} demo</strong>. Aplicar substitui as anteriores.
          </p>

          <div className="grid grid-cols-3 gap-3 mb-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>Estruturas</label>
              <input value={stCount} onChange={(e) => setStCount(e.target.value)} className="lz-input !py-2.5 font-jet text-sm" inputMode="numeric" />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>Com e-book</label>
              <input value={stEbooks} onChange={(e) => setStEbooks(e.target.value)} className="lz-input !py-2.5 font-jet text-sm" inputMode="numeric" />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>Com página</label>
              <input value={stLandings} onChange={(e) => setStLandings(e.target.value)} className="lz-input !py-2.5 font-jet text-sm" inputMode="numeric" />
            </div>
          </div>

          <button
            onClick={() => run('seed-structures', {
              count: parseInt(stCount) || 5,
              withEbook: parseInt(stEbooks) || 0,
              withLanding: parseInt(stLandings) || 0,
            })}
            disabled={busy !== null}
            className="lz-btn-primary w-full inline-flex items-center justify-center gap-2 text-sm mt-auto"
          >
            {busy === 'seed-structures' ? <Loader2 size={15} className="animate-spin" /> : <Layers size={15} />}
            Aplicar estruturas demo
          </button>
          <p className="text-[11px] mt-2" style={{ color: 'var(--text-muted)' }}>
            Marcadas com o sub-nicho “DEMO” (máx. 100). Estruturas reais criadas no wizard somam por cima.
          </p>
        </div>
      </div>

      {/* Cakto — canal de afiliados: setup 1-clique dos produtos + webhook */}
      <div className="lz-card p-6 mb-4">
        <div className="flex items-center gap-2 mb-1">
          <Plug size={16} style={{ color: 'var(--purple-soft)' }} />
          <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Cakto — canal de afiliados (vender os planos do InfoBook)</p>
        </div>
        <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
          Um clique faz tudo que a API da Cakto permite: cria os 3 produtos dos planos (Mensal R$97, Trimestral R$197,
          Vitalício R$297), <strong style={{ color: 'var(--text-primary)' }}>ativa o programa de afiliados com 50% de comissão</strong> em
          cada um, e cadastra o webhook que ativa a conta do comprador automaticamente — sem você precisar entrar na Cakto.
          Pode clicar de novo sem medo: não duplica nada, só reforça a configuração.
        </p>

        <button
          onClick={() => run('cakto-setup')}
          disabled={busy !== null}
          className="lz-btn-primary w-full inline-flex items-center justify-center gap-2 text-sm"
        >
          {busy === 'cakto-setup' ? <Loader2 size={15} className="animate-spin" /> : <Plug size={15} />}
          Configurar Cakto agora (produtos + afiliados 50% + webhook)
        </button>

        {caktoResult && (
          <div className="mt-4 space-y-3">
            <div className="p-3 rounded-xl text-xs space-y-1.5" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)' }}>
              {caktoResult.products.map((p) => (
                <p key={p.plan} style={{ color: 'var(--text-primary)' }}>
                  ✅ {p.name} — {p.created ? 'criado agora' : 'já existia'}, afiliados {p.affiliateEnabled ? 'ativos a 50%' : '⚠️ não confirmado (veja no painel da Cakto)'}
                </p>
              ))}
              <p style={{ color: 'var(--text-primary)' }}>
                ✅ Webhook de ativação — {caktoResult.webhook.created ? 'cadastrado agora' : 'já existia'}
                {caktoResult.webhook.secretStored ? ' (secret guardado com segurança)' : ''}
              </p>
            </div>
            <div className="p-3 rounded-xl text-xs" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)', color: 'var(--text-secondary)' }}>
              <p className="font-semibold mb-1.5" style={{ color: 'var(--text-primary)' }}>Como cada afiliado é aprovado (exige revisão sua, por segurança):</p>
              <p>Quando alguém pedir para se afiliar, você aprova em <strong>app.cakto.com.br → Produtos → aba Afiliados → Solicitações</strong> — aprove a mesma pessoa nos 3 produtos, assim a comissão conta não importa qual plano ela venda.</p>
            </div>
          </div>
        )}

        <div className="h-px my-5" style={{ background: 'var(--border-default)' }} />

        <p className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Links de checkout (endereço do botão "Assinar" do site)</p>
        <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
          Isso não tem nada a ver com marcar vendas — é só dizer para onde o botão "Assinar" do site deve mandar o
          comprador. É a única coisa que a API da Cakto não entrega pronta: copie em <strong>app.cakto.com.br → Produtos → abra o produto → aba Links → "Link de checkout"</strong>{' '}
          e cole abaixo, uma vez só. As vendas continuam sendo registradas 100% sozinhas pelo webhook, seja o comprador vindo direto ou por um afiliado.
        </p>
        <div className="space-y-3 mb-4">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>Mensal — R$97</label>
            <input value={caktoUrlMensal} onChange={(e) => setCaktoUrlMensal(e.target.value)} placeholder="https://pay.cakto.com.br/..." className="lz-input !py-2.5 font-jet text-sm w-full" />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>Trimestral — R$197</label>
            <input value={caktoUrlTrimestral} onChange={(e) => setCaktoUrlTrimestral(e.target.value)} placeholder="https://pay.cakto.com.br/..." className="lz-input !py-2.5 font-jet text-sm w-full" />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>Vitalício — R$297</label>
            <input value={caktoUrlVitalicio} onChange={(e) => setCaktoUrlVitalicio(e.target.value)} placeholder="https://pay.cakto.com.br/..." className="lz-input !py-2.5 font-jet text-sm w-full" />
          </div>
        </div>
        <button
          onClick={() => run('set-cakto-checkout-urls', { mensal: caktoUrlMensal, trimestral: caktoUrlTrimestral, vitalicio: caktoUrlVitalicio })}
          disabled={busy !== null}
          className="lz-btn-primary w-full inline-flex items-center justify-center gap-2 text-sm"
        >
          {busy === 'set-cakto-checkout-urls' ? <Loader2 size={15} className="animate-spin" /> : <ShoppingCart size={15} />}
          Salvar links de checkout
        </button>
      </div>

      {/* Administradores — acesso do sócio ao Super Admin */}
      <div className="lz-card p-6 mb-4">
        <div className="flex items-center gap-2 mb-1">
          <ShieldAlert size={16} style={{ color: 'var(--purple-soft)' }} />
          <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Administradores</p>
        </div>
        <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
          Admins têm acesso a este painel (atalho Ctrl+Shift+A), ao gerenciamento de dados demo e acesso total às
          ferramentas de IA sem precisar de plano. Para adicionar seu sócio: peça para ele criar uma conta normal em{' '}
          <code>/cadastro</code> com o e-mail e a senha que ELE escolher, e digite o e-mail dele abaixo.
        </p>

        <div className="flex gap-2 mb-4">
          <input
            value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)}
            placeholder="email-do-socio@exemplo.com" type="email" className="lz-input flex-1 font-jet text-sm"
          />
          <button
            onClick={() => run('grant-admin', { email: adminEmail })}
            disabled={busy !== null || !adminEmail.trim()}
            className="lz-btn-primary !px-5 shrink-0 inline-flex items-center gap-2 text-sm"
          >
            {busy === 'grant-admin' ? <Loader2 size={14} className="animate-spin" /> : <ShieldAlert size={14} />}
            Tornar admin
          </button>
        </div>

        <div className="space-y-2">
          {status.masterEmail && (
            <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)' }}>
              <span className="text-sm font-jet truncate" style={{ color: 'var(--text-primary)' }}>{status.masterEmail}</span>
              <span className="lz-badge lz-badge-hot shrink-0">DONO</span>
            </div>
          )}
          {status.admins.filter((a) => a.email.toLowerCase() !== status.masterEmail).map((a) => (
            <div key={a.email} className="flex items-center justify-between gap-3 p-3 rounded-xl" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)' }}>
              <span className="text-sm font-jet truncate" style={{ color: 'var(--text-primary)' }}>
                {a.name ? `${a.name} · ` : ''}{a.email}
              </span>
              <button
                onClick={() => { if (window.confirm(`Remover acesso de admin de ${a.email}?`)) run('revoke-admin', { email: a.email }) }}
                disabled={busy !== null}
                className="text-xs px-3 py-1.5 rounded-lg shrink-0"
                style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.35)', color: '#f87171' }}
              >
                Remover
              </button>
            </div>
          ))}
          {status.admins.filter((a) => a.email.toLowerCase() !== status.masterEmail).length === 0 && (
            <p className="text-xs text-center py-2" style={{ color: 'var(--text-muted)' }}>Nenhum admin adicional ainda.</p>
          )}
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

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-4">
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
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>Qtd. vendas (opcional)</label>
            <input value={revCount} onChange={(e) => setRevCount(e.target.value)} placeholder="auto" className="lz-input !py-2.5 font-jet text-sm" inputMode="numeric" />
          </div>
        </div>

        <button
          onClick={() => run('set-revenue', {
            today: parseBr(revToday),
            last7: parseBr(rev7),
            last30: parseBr(rev30),
            allTime: parseBr(revAll),
            salesCount: revCount.trim() ? parseInt(revCount) : undefined,
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
