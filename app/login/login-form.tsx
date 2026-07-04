'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { motion } from 'framer-motion'
import { Zap, Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export function LoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await signIn('credentials', { email, password, redirect: false })
      if (res?.error) {
        toast.error('E-mail ou senha incorretos.')
      } else {
        toast.success('Bem-vindo de volta!')
        router.replace('/dashboard')
      }
    } catch {
      toast.error('Erro ao entrar. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 radial-purple">
      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        className="w-full max-w-md lz-card p-8"
      >
        <div className="flex flex-col items-center text-center mb-8">
          <div className="flex items-center gap-2 mb-3">
            <Zap size={28} style={{ color: 'var(--purple-core)' }} fill="var(--purple-core)" />
            <span className="font-grotesk font-bold text-2xl text-glow" style={{ color: 'var(--text-primary)' }}>ProspectMap</span>
          </div>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Prospecção inteligente. Resultado real.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-grotesk mb-1.5" style={{ color: 'var(--text-secondary)' }}>E-MAIL</label>
            <div className="relative">
              <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="voce@email.com" className="lz-input" style={{ paddingLeft: '42px' }} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-grotesk mb-1.5" style={{ color: 'var(--text-secondary)' }}>SENHA</label>
            <div className="relative">
              <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
              <input type={show ? 'text' : 'password'} required value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••" className="lz-input" style={{ paddingLeft: '42px', paddingRight: '42px' }} />
              <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }}>
                {show ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <button type="submit" disabled={loading} className="lz-btn-primary w-full flex items-center justify-center gap-2">
            {loading ? <Loader2 size={16} className="animate-spin" /> : null}
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <div className="mt-6 flex flex-col items-center gap-2 text-sm">
          <Link href="/cadastro" style={{ color: 'var(--text-secondary)' }}>
            Não tem conta? <span style={{ color: 'var(--purple-soft)' }}>Cadastre-se</span>
          </Link>
          <button type="button" onClick={() => toast('Entre em contato com o suporte para redefinir sua senha.')} style={{ color: 'var(--text-muted)' }}>
            Esqueci minha senha
          </button>
        </div>
      </motion.div>
    </div>
  )
}
