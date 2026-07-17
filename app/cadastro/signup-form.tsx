'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { motion } from 'framer-motion'
import { Zap, Mail, Lock, User, Eye, EyeOff, Loader2, Phone, Sparkles } from 'lucide-react'
import { toast } from 'sonner'

// Cadastro cria a conta SEM plano (free). A assinatura acontece no checkout
// da página inicial — o plano só ativa após pagamento confirmado.
export function SignupForm() {
  const router = useRouter()
  const [name, setName] = useState('')
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
        body: JSON.stringify({ name, email, password, whatsappNumber, referralCode: ref }),
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
        className="w-full max-w-md">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Zap size={28} style={{ color: 'var(--purple-core)' }} fill="var(--purple-core)" />
            <span className="font-grotesk font-bold text-2xl text-glow" style={{ color: 'var(--text-primary)' }}>InfoBook</span>
          </div>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Crie sua conta para acessar a plataforma.</p>
        </div>

        <div className="lz-card p-6">
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

          <div className="mt-4 p-3 rounded-xl flex items-start gap-2.5 text-xs"
            style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid var(--purple-border)', color: 'var(--text-secondary)' }}>
            <Sparkles size={14} className="shrink-0 mt-0.5" style={{ color: 'var(--purple-soft)' }} />
            <span>
              A geração de infoprodutos com IA é liberada após assinar um plano.{' '}
              <Link href="/#planos" className="underline" style={{ color: 'var(--purple-soft)' }}>Ver planos</Link>
              {' '}— ao pagar com o mesmo e-mail, o acesso ativa na hora.
            </span>
          </div>

          <p className="mt-4 text-center text-sm" style={{ color: 'var(--text-secondary)' }}>
            Já tem conta? <Link href="/login" style={{ color: 'var(--purple-soft)' }}>Entrar</Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
