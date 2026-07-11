'use client'

import { useState, useEffect, useRef } from 'react'
import { X, Copy, Check, Loader2, PartyPopper, QrCode, CreditCard, ShieldCheck, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'

const PLAN_LABELS: Record<string, string> = {
  mensal: 'Mensal — R$ 97,00',
  trimestral: 'Trimestral — R$ 197,00',
  anual: 'Anual — R$ 397,00 (+3 meses grátis)',
}

const PLAN_INFO: Record<string, { name: string; price: string; billing: string }> = {
  mensal: { name: 'Plano Mensal', price: '97', billing: 'Cobrado a cada mês' },
  trimestral: { name: 'Plano Trimestral', price: '197', billing: 'Cobrado a cada 3 meses' },
  anual: { name: 'Plano Anual', price: '397', billing: 'Cobrado 1x por ano · +3 meses grátis' },
}

interface PixCheckoutModalProps {
  plan: string | null
  onClose: () => void
}

type Step = 'form' | 'qrcode' | 'success' | 'expired'

export function PixCheckoutModal({ plan, onClose }: PixCheckoutModalProps) {
  const [step, setStep] = useState<Step>('form')
  const [method, setMethod] = useState<'PIX' | 'CARD'>('PIX')
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
      if (method === 'CARD') {
        const res = await fetch('/api/payments/card/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.trim(), phone: phone.trim(), plan }),
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) {
          toast.error(data?.error || 'Erro ao gerar checkout de cartão.')
          setLoading(false)
          return
        }
        window.location.href = data.url
        return
      }

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
            <div className="text-center">
              <p className="text-[10px] font-bold text-violet-400 uppercase tracking-widest mb-2">{PLAN_INFO[plan]?.name ?? plan}</p>
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-zinc-500 font-semibold text-lg">R$</span>
                <span className="text-4xl font-black text-white font-grotesk">{PLAN_INFO[plan]?.price ?? ''}</span>
              </div>
              <p className="text-xs text-zinc-500 mt-1">{PLAN_INFO[plan]?.billing ?? ''}</p>
            </div>

            <div>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 text-center">Como deseja pagar?</p>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setMethod('PIX')}
                  className={`w-full p-4 rounded-xl border text-left flex items-center gap-3 transition-colors relative ${
                    method === 'PIX' ? 'border-emerald-500/60 bg-emerald-950/20' : 'border-white/10 bg-white/5 hover:bg-white/[0.07]'
                  }`}
                >
                  {method === 'PIX' && (
                    <span className="absolute -top-2 left-4 px-2 py-0.5 rounded-full bg-emerald-500 text-black text-[9px] font-black uppercase tracking-wider">
                      Recomendado
                    </span>
                  )}
                  <div className="w-9 h-9 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                    <QrCode size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white">PIX</p>
                    <p className="text-[11px] text-emerald-400">Sem taxas extras · Acesso imediato</p>
                  </div>
                  <ChevronRight size={16} className="text-zinc-500 shrink-0" />
                </button>

                <button
                  type="button"
                  onClick={() => setMethod('CARD')}
                  className={`w-full p-4 rounded-xl border text-left flex items-center gap-3 transition-colors ${
                    method === 'CARD' ? 'border-violet-500/60 bg-violet-950/20' : 'border-white/10 bg-white/5 hover:bg-white/[0.07]'
                  }`}
                >
                  <div className="w-9 h-9 rounded-lg bg-violet-500/15 border border-violet-500/30 flex items-center justify-center text-violet-300 shrink-0">
                    <CreditCard size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white">Cartão de Crédito</p>
                    <p className="text-[11px] text-zinc-400">Em até 12x · Visa, Master, Elo, Amex</p>
                  </div>
                  <ChevronRight size={16} className="text-zinc-500 shrink-0" />
                </button>
              </div>
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
              {method === 'PIX' ? 'Gerar PIX' : 'Pagar com cartão'}
            </button>
            <p className="text-[11px] text-zinc-500 text-center">
              {method === 'PIX'
                ? 'Assim que o pagamento for confirmado, enviamos o acesso pro seu e-mail.'
                : 'Você será direcionado para a página segura de pagamento e volta pra cá automaticamente.'}
            </p>
            <div className="flex items-start gap-2 p-3 rounded-lg bg-white/[0.03] border border-white/5">
              <ShieldCheck size={15} className="text-emerald-400 shrink-0 mt-0.5" />
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                <strong className="text-zinc-300">Pagamento processado com segurança pela AbacatePay</strong> — seus dados de pagamento não ficam armazenados aqui.
              </p>
            </div>
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
