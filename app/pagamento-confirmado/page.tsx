'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Loader2, PartyPopper, AlertCircle } from 'lucide-react'

export default function PagamentoConfirmadoPage() {
  const searchParams = useSearchParams()
  const paymentId = searchParams.get('paymentId') || searchParams.get('id')
  const [status, setStatus] = useState<'checking' | 'paid' | 'pending' | 'error'>('checking')

  useEffect(() => {
    if (!paymentId) {
      setStatus('error')
      return
    }

    let attempts = 0
    const maxAttempts = 15

    const poll = async () => {
      attempts += 1
      try {
        const res = await fetch(`/api/payments/pix/status?id=${paymentId}`)
        const data = await res.json().catch(() => ({}))
        if (data?.status === 'paid') {
          setStatus('paid')
          return
        }
      } catch {
        // ignore, retry
      }
      if (attempts < maxAttempts) {
        setTimeout(poll, 3000)
      } else {
        setStatus('pending')
      }
    }

    poll()
  }, [paymentId])

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#05050b] px-4">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0a0a14] p-8 text-center space-y-4">
        {status === 'checking' && (
          <>
            <Loader2 size={40} className="mx-auto text-violet-400 animate-spin" />
            <h1 className="text-lg font-bold text-white font-grotesk">Confirmando seu pagamento...</h1>
            <p className="text-sm text-zinc-400">Isso pode levar alguns segundos.</p>
          </>
        )}
        {status === 'paid' && (
          <>
            <PartyPopper size={40} className="mx-auto text-emerald-400" />
            <h1 className="text-lg font-bold text-white font-grotesk">Pagamento confirmado!</h1>
            <p className="text-sm text-zinc-400">Enviamos o acesso da sua conta para o seu e-mail. Confira sua caixa de entrada (e o spam, por garantia).</p>
            <a href="/login" className="lz-btn-primary w-full inline-flex items-center justify-center">Ir para o login</a>
          </>
        )}
        {status === 'pending' && (
          <>
            <AlertCircle size={40} className="mx-auto text-amber-400" />
            <h1 className="text-lg font-bold text-white font-grotesk">Ainda processando</h1>
            <p className="text-sm text-zinc-400">Seu pagamento pode levar mais alguns instantes para confirmar. Você receberá o acesso por e-mail assim que for aprovado.</p>
          </>
        )}
        {status === 'error' && (
          <>
            <AlertCircle size={40} className="mx-auto text-red-400" />
            <h1 className="text-lg font-bold text-white font-grotesk">Não conseguimos identificar seu pagamento</h1>
            <p className="text-sm text-zinc-400">Se você concluiu o pagamento, o acesso será enviado por e-mail assim que confirmado.</p>
          </>
        )}
      </div>
    </div>
  )
}
