'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sidebar } from '@/components/lz/sidebar'
import { Search, Bell, ChevronDown, User, Settings, LogOut, Zap, ShoppingBag, X } from 'lucide-react'
import { signOut, useSession } from 'next-auth/react'
import { toast } from 'sonner'
import Link from 'next/link'

const PLAN_LABEL: Record<string, string> = { vitalicio: 'VITALÍCIO', mensal: 'MENSAL', free: 'GRÁTIS' }

interface SaleNotification {
  id: string
  amount: number
  productName: string | null
  buyerLabel: string | null
  createdAt: string
}

// Nomes fictícios pra simulação de venda (ferramenta de dev/QA, ver useEffect
// do atalho Ctrl+Alt+V mais abaixo) — nunca usados em dado real.
const FAKE_BUYER_NAMES = [
  'Priscila dos Santos', 'João Pedro Oliveira', 'Maria Clara Souza', 'Lucas Ferreira',
  'Ana Beatriz Lima', 'Rafael Martins', 'Juliana Almeida', 'Carlos Henrique Costa',
]

const fmtBRL = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

// Card de notificação de venda (nome do e-book + valor + comprador), estilo
// pop-up do canto superior — mesmo visual pra venda real e pra simulação.
function showSaleToast(s: SaleNotification) {
  toast.custom(
    (id) => (
      <div
        className="flex items-start gap-3 w-full rounded-xl border p-3 pr-8 relative shadow-2xl"
        style={{ background: 'rgba(10,10,24,0.98)', borderColor: 'var(--purple-border)', backdropFilter: 'blur(20px)' }}
      >
        <div className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(124,58,237,0.18)' }}>
          <ShoppingBag size={16} style={{ color: 'var(--purple-soft)' }} />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white truncate">{s.productName ?? 'Produto'}</p>
          <p className="text-xs text-zinc-400 truncate mt-0.5">
            {fmtBRL(s.amount)}{s.buyerLabel ? ` · ${s.buyerLabel}` : ''}
          </p>
        </div>
        <button onClick={() => toast.dismiss(id)} className="absolute top-2 right-2 text-zinc-500 hover:text-white transition-colors">
          <X size={14} />
        </button>
      </div>
    ),
    { position: 'top-right', duration: 6000 },
  )
}

function timeAgo(iso: string): string {
  const diffMin = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000))
  if (diffMin < 1) return 'agora'
  if (diffMin < 60) return `há ${diffMin} min`
  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24) return `há ${diffH}h`
  return `há ${Math.floor(diffH / 24)}d`
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession() || {}
  const [me, setMe] = useState<{ name?: string; plan?: string; email?: string; isAdmin?: boolean } | null>(null)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [sales, setSales] = useState<SaleNotification[]>([])
  const [unreadNotifications, setUnreadNotifications] = useState(0)
  const cursorRef = useRef<string | null>(null)
  const bootstrapped = useRef(false)
  const lastFakeNameRef = useRef<string | null>(null)
  const simulatingRef = useRef(false)

  useEffect(() => {
    fetch('/api/me')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setMe(d))
      .catch(() => {})
  }, [])

  // Vendas de verdade (webhook dos gateways) → toast + sino em tempo real.
  // Só existe alguma coisa aqui se o usuário tiver um gateway conectado que
  // já mandou pelo menos uma venda paga — sem isso o endpoint sempre volta
  // vazio, então o sino nunca acende sozinho.
  useEffect(() => {
    async function poll() {
      const qs = cursorRef.current ? `?after=${encodeURIComponent(cursorRef.current)}` : ''
      const res = await fetch(`/api/sales/recent${qs}`).catch(() => null)
      if (!res?.ok) return
      const d = await res.json().catch(() => null)
      const raw: Array<{ id: string; amount: number; productName: string | null; buyerEmail: string | null; createdAt: string }> = d?.sales ?? []
      if (!raw.length) return
      const novas: SaleNotification[] = raw.map((s) => ({ id: s.id, amount: s.amount, productName: s.productName, buyerLabel: s.buyerEmail, createdAt: s.createdAt }))

      cursorRef.current = novas[novas.length - 1].createdAt

      if (!bootstrapped.current) {
        // Primeira carga: só popula o histórico do sino, sem toast nem contador
        // (senão toda venda antiga apareceria como "nova" ao abrir o app).
        bootstrapped.current = true
        setSales(novas.slice().reverse())
        return
      }

      setSales((prev) => [...novas.slice().reverse(), ...prev].slice(0, 20))
      setUnreadNotifications((n) => n + novas.length)
      for (const s of novas) showSaleToast(s)
    }
    poll()
    const id = setInterval(poll, 25_000)
    return () => clearInterval(id)
  }, [])

  // Ferramenta de dev/QA: Ctrl+Alt+V simula a MESMA notificação visual de uma
  // venda real, só pra testar a interface. Só existe pra administradores;
  // não cria pedido, não grava venda, não chama gateway de pagamento — tudo
  // fica em memória no navegador e some ao recarregar a página. Usa o nome
  // e o preço reais do último e-book gerado no sistema (leitura, sem escrita).
  useEffect(() => {
    if (!me?.isAdmin) return
    async function simulateSale() {
      if (simulatingRef.current) return // já tem uma rodando — ignora até terminar
      simulatingRef.current = true
      try {
        const res = await fetch('/api/admin/last-ebook').catch(() => null)
        if (!res?.ok) return
        const d = await res.json().catch(() => null)
        const lastEbook: { name: string; price: number } | null = d?.lastEbook ?? null
        if (!lastEbook) {
          toast.error('Simulação: nenhum e-book com preço configurado ainda.')
          return
        }
        let fakeName = FAKE_BUYER_NAMES[Math.floor(Math.random() * FAKE_BUYER_NAMES.length)]
        if (FAKE_BUYER_NAMES.length > 1) {
          while (fakeName === lastFakeNameRef.current) {
            fakeName = FAKE_BUYER_NAMES[Math.floor(Math.random() * FAKE_BUYER_NAMES.length)]
          }
        }
        lastFakeNameRef.current = fakeName

        const fake: SaleNotification = {
          id: `sim-${Date.now()}`,
          amount: lastEbook.price,
          productName: lastEbook.name,
          buyerLabel: fakeName,
          createdAt: new Date().toISOString(),
        }
        setSales((prev) => [fake, ...prev].slice(0, 20))
        setUnreadNotifications((n) => n + 1)
        showSaleToast(fake)
        // Painel (se estiver aberto) escuta esse evento pra dar um "empurrão"
        // visual nos números — só em memória, nunca grava nada; some ao
        // recarregar a página, igual o resto dessa simulação.
        window.dispatchEvent(new CustomEvent('ib:simulated-sale', { detail: { amount: fake.amount } }))
      } finally {
        simulatingRef.current = false
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      // e.repeat descarta os eventos repetidos que o navegador dispara
      // sozinho enquanto as teclas ficam seguradas (era a causa da "rajada"
      // de notificações de uma vez só).
      if (e.repeat) return
      if (e.ctrlKey && e.altKey && e.key.toLowerCase() === 'v') {
        e.preventDefault()
        simulateSale()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [me?.isAdmin])

  const name = me?.name ?? session?.user?.name ?? 'Usuário'
  const plan = me?.plan ?? 'free'
  const initials = name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()

  return (
    <div style={{ background: 'var(--bg-primary)', minHeight: '100vh' }}>
      <Sidebar />
      
      <div className="md:ml-[240px] min-h-screen flex flex-col">
        {/* Premium Top Navbar */}
        <header 
          className="sticky top-0 z-30 h-16 flex items-center justify-between px-5 md:px-8 border-b border-[var(--border-default)]"
          style={{ background: 'rgba(7,7,15,0.85)', backdropFilter: 'blur(16px)' }}
        >
          {/* Left Side: Brand Logo (visible on mobile only) or empty container */}
          <div className="flex items-center gap-2">
            <div className="md:hidden flex items-center gap-2">
              <Zap size={18} style={{ color: 'var(--purple-core)' }} fill="var(--purple-core)" />
              <span className="font-grotesk font-bold text-base text-glow text-white">LeadZap</span>
            </div>
            <div className="hidden md:flex items-center gap-2">
              <span className="h-2 w-2 rounded-full pulse-dot" style={{ background: 'var(--success)' }} />
              <span className="text-[10px] font-jet text-zinc-400 tracking-wider">NETWORK STATUS: ONLINE</span>
            </div>
          </div>

          {/* Center Side: Premium Search bar with CMD+K hint */}
          <div className="hidden sm:flex items-center relative max-w-md w-full mx-8">
            <Search size={15} className="absolute left-3.5 text-zinc-400" />
            <input 
              type="text" 
              placeholder="Buscar leads, mensagens..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="lz-input !py-2 !pl-10 !pr-16 text-xs w-full"
            />
            <span className="absolute right-3 px-1.5 py-0.5 rounded text-[9px] font-jet font-semibold text-zinc-500 border border-zinc-800 bg-zinc-950">
              cmd K
            </span>
          </div>

          {/* Right Side: Notifications Bell + Plan Badge + Avatar Dropdown */}
          <div className="flex items-center gap-4">
            {/* Notification Bell — vendas reais recebidas via webhook */}
            <div className="relative">
              <button
                onClick={() => { setNotifOpen(!notifOpen); setUnreadNotifications(0) }}
                className="relative p-2 rounded-lg hover:bg-zinc-900/60 transition-colors text-zinc-300 hover:text-white"
              >
                <Bell size={18} />
                {unreadNotifications > 0 && (
                  <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                )}
              </button>

              <AnimatePresence>
                {notifOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 5 }}
                      className="absolute right-0 mt-2 w-72 max-h-80 overflow-y-auto rounded-xl border border-[var(--border-default)] shadow-2xl p-1 z-50"
                      style={{ background: 'rgba(10,10,24,0.98)', backdropFilter: 'blur(20px)' }}
                    >
                      <div className="px-3 py-2 border-b border-zinc-850">
                        <p className="text-xs font-bold text-white">Vendas recentes</p>
                      </div>
                      {sales.length === 0 ? (
                        <p className="px-3 py-4 text-xs text-zinc-500">Nenhuma venda registrada ainda.</p>
                      ) : (
                        sales.map((s) => (
                          <div key={s.id} className="flex items-start gap-2.5 px-3 py-2.5 rounded-lg hover:bg-zinc-900 transition-colors">
                            <div className="h-7 w-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(124,58,237,0.15)' }}>
                              <ShoppingBag size={13} style={{ color: 'var(--purple-soft)' }} />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs text-white truncate">{s.productName ?? 'Produto'}</p>
                              <p className="text-[11px] text-zinc-400 truncate">
                                {fmtBRL(s.amount)} · {timeAgo(s.createdAt)}{s.buyerLabel ? ` · ${s.buyerLabel}` : ''}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Plan Badge */}
            <span className="lz-badge lz-badge-hot hidden xs:inline-flex text-[10px] py-1 px-2.5 rounded-full">
              {PLAN_LABEL[plan] ?? 'GRÁTIS'}
            </span>

            {/* Avatar Dropdown */}
            <div className="relative">
              <button 
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 p-1 rounded-full hover:bg-zinc-900/60 transition-colors border border-transparent hover:border-zinc-850"
              >
                <div 
                  className="h-8 w-8 rounded-full flex items-center justify-center font-grotesk font-bold text-xs text-white shadow-lg"
                  style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)' }}
                >
                  {initials}
                </div>
                <ChevronDown size={14} className="text-zinc-400 hidden xs:inline" />
              </button>

              <AnimatePresence>
                {dropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 5 }}
                      className="absolute right-0 mt-2 w-48 rounded-xl border border-[var(--border-default)] shadow-2xl p-1 z-50"
                      style={{ background: 'rgba(10,10,24,0.98)', backdropFilter: 'blur(20px)' }}
                    >
                      <div className="px-3 py-2 border-b border-zinc-850">
                        <p className="text-xs font-bold text-white truncate">{name}</p>
                        <p className="text-[10px] text-zinc-400 truncate mt-0.5">{me?.email ?? 'admin@leadzap.com.br'}</p>
                      </div>

                      <Link 
                        href="/configuracoes" 
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 text-xs text-zinc-300 hover:text-white rounded-lg hover:bg-zinc-900 transition-colors mt-1"
                      >
                        <User size={13} />
                        <span>Meu Perfil</span>
                      </Link>

                      <Link 
                        href="/configuracoes" 
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 text-xs text-zinc-300 hover:text-white rounded-lg hover:bg-zinc-900 transition-colors"
                      >
                        <Settings size={13} />
                        <span>Configurações</span>
                      </Link>

                      <button 
                        onClick={() => { setDropdownOpen(false); signOut({ callbackUrl: '/login' }) }}
                        className="flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:text-red-300 rounded-lg hover:bg-red-950/20 transition-colors w-full text-left"
                      >
                        <LogOut size={13} />
                        <span>Sair</span>
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <motion.main
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="flex-1 p-5 md:p-8 pb-24 md:pb-8 max-w-[1200px] mx-auto w-full"
        >
          {children}
        </motion.main>
      </div>
    </div>
  )
}
