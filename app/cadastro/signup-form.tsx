'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { motion } from 'framer-motion'
import { Zap, Mail, Lock, User, Eye, EyeOff, Loader2, Check, Phone } from 'lucide-react'
import { toast } from 'sonner'

const PLANS = [
  {
    id: 'mensal', name: 'Mensal', price: 'R$ 97,90', period: '/mês', cta: 'Assinar Mensal', highlight: false,
    features: ['Gerador de mensagem com IA', 'Biblioteca de prompts', 'Dashboard de Vendas', 'Criação de funis com IA'],
  },
  {
    id: 'vitalicio', name: 'Semestral', price: 'R$ 197,90', period: '/semestre', cta: 'Assinar Semestral', highlight: true,
    features: ['Tudo do plano Mensal', 'Acesso completo por 6 meses', 'Suporte prioritário via WhatsApp', 'Pixel Master para sites'],
  },
  {
    id: 'anual', name: 'Anual', price: 'R$ 345,90', period: '/ano', cta: 'Assinar Anual', highlight: false,
    features: ['15 meses de acesso total (12 + 3 grátis)', 'Bônus: Suporte via WhatsApp', 'Criação de funis com IA', 'Biblioteca de prompts'],
  },
]

export function SignupForm() {
  const router = useRouter()
  const [plan, setPlan] = useState<'mensal' | 'vitalicio' | 'anual'>('vitalicio')
  const [name, setName] = useState('')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search).get('plan')
      if (p === 'mensal' || p === 'vitalicio' || p === 'anual') {
        setPlan(p as any)
      }
    }
  }, [])
  const [email, setEmail] = useState('')
  const [whatsappNumber, setWhatsappNumber] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [accept, setAccept] = useState(false)
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) { toast.error('As senhas não coincidem.'); return }
    if (password.length < 6) { toast.error('A senha deve ter pelo menos 6 caracteres.'); return }
    if (!accept) { toast.error('Você precisa aceitar os Termos de Uso.'); return }
    setLoading(true)
    try {
      const ref = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('ref') : null
      const res = await fetch('/api/signup', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, whatsappNumber, plan, referralCode: ref }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) { toast.error(data?.error ?? 'Erro ao criar conta.'); return }
      toast.success('Conta criada! Entrando...')
      const login = await signIn('credentials', { email, password, redirect: false })
      if (login?.error) { router.replace('/login') } else { router.replace('/painel') }
    } catch {
      toast.error('Erro ao criar conta. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10 radial-purple">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        className="w-full max-w-4xl">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Zap size={28} style={{ color: 'var(--purple-core)' }} fill="var(--purple-core)" />
            <span className="font-grotesk font-bold text-2xl text-glow" style={{ color: 'var(--text-primary)' }}>EbookAI</span>
          </div>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Crie sua conta e lance seu primeiro infoproduto hoje mesmo.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Plan selection */}
          <div className="space-y-4">
            <h2 className="font-grotesk text-sm" style={{ color: 'var(--text-secondary)' }}>1. ESCOLHA SEU PLANO</h2>
            {PLANS.map((p) => {
              const selected = plan === p.id
              return (
                <button type="button" key={p.id} onClick={() => setPlan(p.id as any)}
                  className="w-full text-left lz-card p-5 relative transition-all"
                  style={{ borderColor: selected ? 'var(--purple-core)' : 'var(--border-default)', boxShadow: selected ? '0 0 28px rgba(124,58,237,0.3)' : undefined }}>
                  {p.highlight && (
                    <span className="lz-badge lz-badge-hot absolute -top-2 right-4">MELHOR OFERTA</span>
                  )}
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-grotesk font-bold text-lg" style={{ color: 'var(--text-primary)' }}>{p.name}</span>
                    <div className="h-5 w-5 rounded-full flex items-center justify-center"
                      style={{ border: `2px solid ${selected ? 'var(--purple-core)' : 'var(--border-default)'}`, background: selected ? 'var(--purple-core)' : 'transparent' }}>
                      {selected && <Check size={12} color="#fff" />}
                    </div>
                  </div>
                  <div className="mb-4">
                    <span className="font-jet font-bold text-3xl" style={{ color: 'var(--purple-soft)' }}>{p.price}</span>
                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{p.period}</span>
                  </div>
                  <ul className="space-y-2">
                    {p.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                        <Check size={15} style={{ color: 'var(--success)', marginTop: 2 }} className="shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </button>
              )
            })}
          </div>

          {/* Form */}
          <div className="lz-card p-6">
            <h2 className="font-grotesk text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>2. SEUS DADOS</h2>
            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div className="relative">
                <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                <input type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome completo" className="lz-input" style={{ paddingLeft: '42px' }} />
              </div>
              <div className="relative">
                <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="E-mail" className="lz-input" style={{ paddingLeft: '42px' }} />
              </div>
              <div className="relative">
                <Phone size={18} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                <input type="text" required value={whatsappNumber} onChange={(e) => setWhatsappNumber(e.target.value)} placeholder="WhatsApp / Telefone (com DDD)" className="lz-input" style={{ paddingLeft: '42px' }} />
              </div>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                <input type={show ? 'text' : 'password'} required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Senha" className="lz-input" style={{ paddingLeft: '42px', paddingRight: '42px' }} />
                <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }}>
                  {show ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                <input type={show ? 'text' : 'password'} required value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Confirmar senha" className="lz-input" style={{ paddingLeft: '42px' }} />
              </div>
              <label className="flex items-start gap-2 text-sm cursor-pointer" style={{ color: 'var(--text-secondary)' }}>
                <input type="checkbox" checked={accept} onChange={(e) => setAccept(e.target.checked)} className="mt-1 accent-[var(--purple-core)]" />
                <span>Aceito os Termos de Uso e Política de Privacidade</span>
              </label>
              <button type="submit" disabled={loading} className="lz-btn-primary w-full flex items-center justify-center gap-2">
                {loading ? <Loader2 size={16} className="animate-spin" /> : null}
                {loading ? 'Criando...' : 'Criar minha conta'}
              </button>
            </form>
            <p className="mt-4 text-center text-sm" style={{ color: 'var(--text-secondary)' }}>
              Já tem conta? <Link href="/login" style={{ color: 'var(--purple-soft)' }}>Entrar</Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
