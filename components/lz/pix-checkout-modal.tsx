'use client'

import { useState, useEffect, useRef } from 'react'
import { X, Copy, Check, Loader2, PartyPopper } from 'lucide-react'
import { toast } from 'sonner'

const PLAN_LABELS: Record<string, string> = {
  mensal: 'Mensal — R$ 97,00',
  trimestral: 'Trimestral — R$ 197,00',
  anual: 'Anual — R$ 397,00 (+3 meses grátis)',
}

interface PixCheckoutModalProps {
  plan: string | null
  onClose: () => void
}

type Step = 'form' | 'qrcode' | 'success' | 'expired'

export function PixCheckoutModal({ plan, onClose }: PixCheckoutModalProps) {
  const [step, setStep] = useState<Step>('form')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [payment, setPayment] = useState<{ paymentId: string; brCode: string; brCodeBase64: string; expiresAt: string } | null>(null)
  const [secondsLeft, setSecondsLeft] = useState(0)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
      if (countdownRef.current) clearInterval(countdownRef.current)
    }
  }, [])

  if (!plan) return null

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim() || !phone.trim()) {
      toast.error('Preencha e-mail e telefone.')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/payments/pix/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), phone: phone.trim(), plan }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(data?.error || 'Erro ao gerar PIX.')
        setLoading(false)
        return
      }
      setPayment(data)
      setStep('qrcode')
      startCountdown(data.expiresAt)
      startPolling(data.paymentId)
    } catch {
      toast.error('Erro ao conectar ao servidor.')
    } finally {
      setLoading(false)
    }
  }

  function startCountdown(expiresAt: string) {
    const update = () => {
      const diff = Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000))
      setSecondsLeft(diff)
      if (diff <= 0) {
        setStep('expired')
        if (countdownRef.current) clearInterval(countdownRef.current)
        if (pollRef.current) clearInterval(pollRef.current)
      }
    }
    update()
    countdownRef.current = setInterval(update, 1000)
  }

  function startPolling(paymentId: string) {
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/payments/pix/status?id=${paymentId}`)
        const data = await res.json().catch(() => ({}))
        if (data?.status === 'paid') {
          setStep('success')
          if (pollRef.current) clearInterval(pollRef.current)
          if (countdownRef.current) clearInterval(countdownRef.current)
        } else if (data?.status === 'expired' || data?.status === 'cancelled') {
          setStep('expired')
          if (pollRef.current) clearInterval(pollRef.current)
          if (countdownRef.current) clearInterval(countdownRef.current)
        }
      } catch {
        // silent — next poll tick will retry
      }
    }, 4000)
  }

  function handleCopy() {
    if (!payment?.brCode) return
    navigator.clipboard?.writeText(payment.brCode)
      .then(() => {
        setCopied(true)
        toast.success('Código PIX copiado!')
        setTimeout(() => setCopied(false), 2000)
      })
      .catch(() => toast.error('Erro ao copiar.'))
  }

  const mm = Math.floor(secondsLeft / 60).toString().padStart(2, '0')
  const ss = (secondsLeft % 60).toString().padStart(2, '0')

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0a0a14] p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors">
          <X size={20} />
        </button>

        {step === 'form' && (
          <form onSubmit={handleGenerate} className="space-y-5">
            <div>
              <h3 className="text-lg font-bold text-white font-grotesk">Quero entrar</h3>
              <p className="text-sm text-zinc-400 mt-1">{PLAN_LABELS[plan] ?? plan}</p>
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">E-mail</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seuemail@exemplo.com"
                className="lz-input"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Telefone (WhatsApp)</label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(11) 91234-5678"
                className="lz-input"
              />
            </div>
            <button type="submit" disabled={loading} className="lz-btn-primary w-full flex items-center justify-center gap-2">
              {loading ? <Loader2 size={16} className="animate-spin" /> : null}
              Gerar PIX
            </button>
            <p className="text-[11px] text-zinc-500 text-center">Assim que o pagamento for confirmado, enviamos o acesso pro seu e-mail.</p>
          </form>
        )}

        {step === 'qrcode' && payment && (
          <div className="space-y-4 text-center">
            <div>
              <h3 className="text-lg font-bold text-white font-grotesk">Escaneie o QR Code</h3>
              <p className="text-sm text-zinc-400 mt-1">{PLAN_LABELS[plan] ?? plan}</p>
            </div>
            <div className="bg-white p-3 rounded-xl inline-block mx-auto">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={payment.brCodeBase64} alt="QR Code PIX" className="w-52 h-52" />
            </div>
            <button
              onClick={handleCopy}
              className="lz-btn-secondary w-full flex items-center justify-center gap-2 text-sm"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? 'Copiado!' : 'Copiar código PIX (Copia e Cola)'}
            </button>
            <div className="flex items-center justify-center gap-2 text-sm text-zinc-400">
              <Loader2 size={14} className="animate-spin" />
              Aguardando pagamento... expira em {mm}:{ss}
            </div>
          </div>
        )}

        {step === 'success' && (
          <div className="space-y-4 text-center py-4">
            <PartyPopper size={40} className="mx-auto text-emerald-400" />
            <h3 className="text-lg font-bold text-white font-grotesk">Pagamento confirmado!</h3>
            <p className="text-sm text-zinc-400">
              Enviamos o acesso da sua conta para <strong className="text-white">{email}</strong>. Confira sua caixa de entrada (e o spam, por garantia).
            </p>
            <a href="/login" className="lz-btn-primary w-full inline-flex items-center justify-center">
              Ir para o login
            </a>
          </div>
        )}

        {step === 'expired' && (
          <div className="space-y-4 text-center py-4">
            <h3 className="text-lg font-bold text-white font-grotesk">O QR Code expirou</h3>
            <p className="text-sm text-zinc-400">Não tem problema, é só gerar um novo.</p>
            <button
              onClick={() => { setStep('form'); setPayment(null) }}
              className="lz-btn-primary w-full"
            >
              Gerar novo PIX
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
