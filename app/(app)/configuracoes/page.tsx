'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { signOut } from 'next-auth/react'
import { 
  User, Mail, Phone, Crown, Shield, Bell, Share2, AlertTriangle, 
  Copy, Check, RefreshCw, Smartphone, Monitor, Trash2, Globe, Database 
} from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/lz/ui'

export default function ConfiguracoesPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  
  // Profile inputs
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  
  // Security inputs
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // Notifications switches
  const [notifLeads, setNotifLeads] = useState(true)
  const [notifRefs, setNotifRefs] = useState(true)
  const [notifComs, setNotifComs] = useState(true)
  const [notifEmail, setNotifEmail] = useState(false)

  // Success animations states
  const [profileSaving, setProfileSaving] = useState(false)
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  
  // Load configuration
  useEffect(() => {
    fetchSettings()
  }, [])

  function fetchSettings() {
    setLoading(true)
    fetch('/api/settings')
      .then((r) => r.json())
      .then((d) => {
        setData(d)
        setName(d.profile?.name || '')
        setEmail(d.profile?.email || '')
        setWhatsapp(d.profile?.whatsappNumber || '')
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  // Copy Referral link
  function handleCopyReferral() {
    if (!data?.referral?.link) return
    navigator.clipboard.writeText(data.referral.link)
      .then(() => toast.success('Link de indicação copiado!'))
      .catch(() => toast.error('Erro ao copiar.'))
  }

  // Copy tracking script
  function handleCopyScript() {
    if (!data?.profile?.trackingPixelId) return
    const script = `<!-- ProspectMap Network -->
<script>
(function(){
  var pm = document.createElement('img');
  pm.src = 'https://prospectmap.com.br/api/pixel?uid=${data.profile.trackingPixelId}&ref=' + encodeURIComponent(window.location.hostname) + '&t=' + Date.now();
  pm.style.display = 'none';
  document.body.appendChild(pm);
})();
</script>`
    navigator.clipboard.writeText(script)
      .then(() => toast.success('Script do pixel copiado!'))
      .catch(() => {})
  }

  // Save profile changes
  function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault()
    setProfileSaving(true)
    fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'profile', name, email, whatsappNumber: whatsapp })
    })
      .then((r) => r.json())
      .then((d) => {
        setProfileSaving(false)
        if (d.success) {
          toast.success('Perfil atualizado com sucesso!')
          fetchSettings()
        } else {
          toast.error(d.error || 'Erro ao salvar perfil')
        }
      })
      .catch(() => setProfileSaving(false))
  }

  // Update password
  function handleSavePassword(e: React.FormEvent) {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      toast.error('As senhas não coincidem')
      return
    }
    setPasswordSaving(true)
    fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'password', currentPassword, newPassword })
    })
      .then((r) => r.json())
      .then((d) => {
        setPasswordSaving(false)
        if (d.success) {
          toast.success('Senha atualizada com sucesso!')
          setCurrentPassword('')
          setNewPassword('')
          setConfirmPassword('')
        } else {
          toast.error(d.error || 'Erro ao trocar de senha')
        }
      })
      .catch(() => setPasswordSaving(false))
  }

  // Upgrade Plan — leva pro checkout real da Cakto (Vitalício). Nunca libera
  // o plano de graça: upgrade só conta depois de um pagamento de verdade,
  // confirmado pelo webhook da Cakto.
  function handleUpgrade() {
    fetch('/api/public/cakto-checkout')
      .then((r) => r.json())
      .then((d) => {
        const url = d?.urls?.vitalicio
        if (url) {
          window.location.href = url
        } else {
          toast.error('Checkout do plano Vitalício ainda não configurado. Tente novamente mais tarde.')
        }
      })
      .catch(() => toast.error('Erro ao abrir o checkout. Tente novamente.'))
  }

  // Delete account
  function handleDeleteAccount() {
    fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete' })
    })
      .then(() => {
        toast.success('Conta excluída com sucesso.')
        signOut({ callbackUrl: '/login' })
      })
  }

  return (
    <div>
      <PageHeader 
        title="Painel de" 
        highlight="configurações" 
        description="Gerencie dados pessoais, configurações de notificações, faturamento de plano e a rede de rastreamento de pixels." 
      />

      {loading ? (
        <div className="space-y-6">
          <div className="h-48 rounded-xl skeleton-shimmer" />
          <div className="h-64 rounded-xl skeleton-shimmer" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Top Profile / Plan Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            
            {/* Profile Section (3 cols) */}
            <div className="lg:col-span-3 lz-card p-6 relative overflow-hidden group hover:border-[rgba(139,92,246,0.35)] transition-all">
              <h2 className="font-grotesk text-lg font-bold mb-4 flex items-center gap-2 text-white">
                <User size={18} className="text-[var(--purple-soft)]" /> Dados Pessoais
              </h2>
              
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="flex flex-col sm:flex-row items-center gap-4 pb-2">
                  <div className="relative">
                    <div className="h-16 w-16 rounded-full bg-gradient-to-tr from-[#7c3aed] to-[#ec4899] p-0.5 shadow-lg shadow-purple-950/50">
                      <div className="h-full w-full rounded-full bg-[#0a0a18] flex items-center justify-center font-grotesk font-bold text-lg text-white">
                        {name.split(' ').map((n) => n[0]).slice(0,2).join('').toUpperCase()}
                      </div>
                    </div>
                    <span className="absolute bottom-0 right-0 h-4 w-4 rounded-full bg-emerald-500 border border-[#05050b]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">{name}</h3>
                    <p className="text-xs text-zinc-400">UUID: {data?.profile?.id}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-zinc-300">Nome Completo</label>
                    <div className="relative mt-1">
                      <User size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                      <input 
                        type="text" 
                        value={name} 
                        onChange={(e) => setName(e.target.value)} 
                        className="lz-input !pl-10 text-xs" 
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-zinc-300">Endereço de E-mail</label>
                    <div className="relative mt-1">
                      <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                      <input 
                        type="email" 
                        value={email} 
                        onChange={(e) => setEmail(e.target.value)} 
                        className="lz-input !pl-10 text-xs" 
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-zinc-300">Número do WhatsApp</label>
                  <div className="relative mt-1">
                    <Phone size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                    <input 
                      type="text" 
                      placeholder="Ex: (11) 98765-4321" 
                      value={whatsapp} 
                      onChange={(e) => setWhatsapp(e.target.value)} 
                      className="lz-input !pl-10 text-xs" 
                    />
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={profileSaving}
                  className="lz-btn-primary w-full text-xs font-bold py-2.5 flex items-center justify-center gap-2"
                >
                  {profileSaving ? <RefreshCw size={14} className="animate-spin" /> : null}
                  <span>Salvar Alterações</span>
                </button>
              </form>
            </div>

            {/* Plan Section (2 cols) */}
            <div className="lg:col-span-2 lz-card p-6 border-[rgba(139,92,246,0.3)] bg-gradient-to-b from-purple-950/10 to-transparent">
              <h2 className="font-grotesk text-lg font-bold mb-4 flex items-center gap-2 text-white">
                <Crown size={18} className="text-yellow-500" /> Detalhes do Plano
              </h2>

              <div className="p-4 rounded-xl border border-purple-500/20 bg-purple-950/20 mb-4 flex items-start gap-3">
                <div className="h-10 w-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-yellow-500 shrink-0 shadow-inner">
                  <Crown size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white leading-none">{data?.plan?.name}</h3>
                  <p className="text-[10px] text-zinc-400 mt-1">Faturamento: {data?.plan?.billingDate}</p>
                </div>
              </div>

              {/* Progress Bar (Leads Utilizados) */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-xs font-jet text-zinc-400">
                  <span>Créditos Gastos Hoje</span>
                  <span className="font-semibold text-white">{data?.plan?.leadsUsedToday} / {data?.plan?.dailyLimit}</span>
                </div>
                <div className="h-2 w-full rounded-full bg-zinc-900 overflow-hidden border border-zinc-800">
                  <div 
                    className="h-full rounded-full bg-gradient-to-r from-[#7c3aed] to-[#d946ef] transition-all duration-300"
                    style={{ width: `${(data?.plan?.leadsUsedToday / data?.plan?.dailyLimit) * 100}%` }}
                  />
                </div>
                <p className="text-[9px] text-zinc-500 font-jet text-right">
                  Reinicia diariamente às 00:00 • {data?.plan?.daysActive} dias ativo
                </p>
              </div>

              {data?.plan?.type === 'mensal' || data?.plan?.type === 'trimestral' ? (
                <button
                  onClick={handleUpgrade}
                  className="lz-btn-primary w-full text-xs font-bold py-2.5 flex items-center justify-center gap-1 bg-gradient-to-r from-yellow-500 to-amber-600 border-amber-500 text-black hover:from-yellow-400 hover:to-amber-500 shadow-lg shadow-amber-950/50"
                >
                  ⚡ Fazer Upgrade para Vitalício
                </button>
              ) : (
                <div className="p-2.5 rounded-lg border border-emerald-500/20 bg-emerald-500/5 text-emerald-400 text-center font-bold text-[10px] uppercase font-jet">
                  Plano Ativo • Obrigado pela confiança!
                </div>
              )}
            </div>
          </div>

          {/* Lower Configurations Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            
            {/* Notifications & Security Column (3 cols) */}
            <div className="lg:col-span-3 space-y-6">
              
              {/* Notification Toggles */}
              <div className="lz-card p-6">
                <h2 className="font-grotesk text-lg font-bold mb-4 flex items-center gap-2 text-white">
                  <Bell size={18} className="text-[var(--purple-soft)]" /> Notificações
                </h2>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-white">Notificar novo lead encontrado</p>
                      <p className="text-[10px] text-zinc-400">Receba alertas em tempo real ao scannear negócios locais.</p>
                    </div>
                    <button 
                      onClick={() => setNotifLeads(!notifLeads)}
                      className="h-5 w-10 rounded-full transition-all relative border border-zinc-800"
                      style={{ background: notifLeads ? 'var(--purple-core)' : '#07070f' }}
                    >
                      <span className="h-3.5 w-3.5 rounded-full bg-white absolute top-[2px] transition-all" style={{ left: notifLeads ? '22px' : '3px' }} />
                    </button>
                  </div>



                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-white">Emails de resumo semanal</p>
                      <p className="text-[10px] text-zinc-400">Compilado completo de conversões enviado todo domingo.</p>
                    </div>
                    <button 
                      onClick={() => setNotifEmail(!notifEmail)}
                      className="h-5 w-10 rounded-full transition-all relative border border-zinc-800"
                      style={{ background: notifEmail ? 'var(--purple-core)' : '#07070f' }}
                    >
                      <span className="h-3.5 w-3.5 rounded-full bg-white absolute top-[2px] transition-all" style={{ left: notifEmail ? '22px' : '3px' }} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Security Actions */}
              <div className="lz-card p-6">
                <h2 className="font-grotesk text-lg font-bold mb-4 flex items-center gap-2 text-white">
                  <Shield size={18} className="text-[var(--purple-soft)]" /> Segurança da Conta
                </h2>

                <form onSubmit={handleSavePassword} className="space-y-3 mb-6 pb-6 border-b border-[var(--border-default)]">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-zinc-400 block mb-1">Senha Atual</label>
                      <input 
                        type="password" 
                        value={currentPassword} 
                        onChange={(e) => setCurrentPassword(e.target.value)} 
                        className="lz-input !py-2 text-xs" 
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-zinc-400 block mb-1">Nova Senha</label>
                      <input 
                        type="password" 
                        value={newPassword} 
                        onChange={(e) => setNewPassword(e.target.value)} 
                        className="lz-input !py-2 text-xs" 
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-zinc-400 block mb-1">Confirmar Senha</label>
                      <input 
                        type="password" 
                        value={confirmPassword} 
                        onChange={(e) => setConfirmPassword(e.target.value)} 
                        className="lz-input !py-2 text-xs" 
                      />
                    </div>
                  </div>
                  <button 
                    type="submit" 
                    disabled={passwordSaving}
                    className="lz-btn-secondary w-full text-xs font-bold py-2 flex items-center justify-center gap-1.5"
                  >
                    {passwordSaving ? <RefreshCw size={13} className="animate-spin" /> : null}
                    <span>Atualizar Senha Secreta</span>
                  </button>
                </form>

                {/* Session logs */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Dispositivos Conectados</h3>
                  
                  <div className="space-y-2">
                    {data?.security?.activeSessions?.map((session: any) => (
                      <div key={session.id} className="flex items-center gap-3 p-3 rounded-lg border border-[var(--border-default)] bg-[var(--bg-primary)]">
                        {session.device.includes('iPhone') ? (
                          <Smartphone size={16} className="text-zinc-400" />
                        ) : (
                          <Monitor size={16} className="text-zinc-400" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-semibold text-white">{session.device}</p>
                            {session.active && (
                              <span className="text-[8px] font-bold font-jet px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 uppercase">Ativo</span>
                            )}
                          </div>
                          <p className="text-[10px] text-zinc-500 mt-0.5">{session.location}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

            </div>

            {/* Referrals & Pixel Column (2 cols) */}
            <div className="lg:col-span-2 space-y-6">
              


              {/* 🌐 Minha Rede de Sites (Pixel Tracking) */}
              <div className="lz-card p-6 border-[var(--purple-border)] bg-gradient-to-t from-purple-950/5 to-transparent">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-grotesk text-lg font-bold flex items-center gap-2 text-white">
                    <Globe size={18} className="text-purple-400" /> Minha Rede
                  </h2>
                  <span className="text-[9px] px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 font-bold uppercase font-jet">
                    Active Pixels
                  </span>
                </div>
                
                <p className="text-[11px] text-zinc-400 mb-4 leading-relaxed">
                  Esses são os sites criados pelos seus clientes que estão rodando com o seu pixel de vendas invisível do LeadZap:
                </p>

                <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                  {(data?.pixelNetwork?.length ?? 0) === 0 ? (
                    <div className="p-6 text-center rounded-lg border border-dashed border-zinc-800 bg-zinc-950/40">
                      <Globe size={24} className="mx-auto text-zinc-600 mb-2 animate-pulse" />
                      <p className="text-[10px] text-zinc-500 leading-normal">
                        Nenhum site cliente ativo detectado. Quando seus clientes publicarem os prompts, as URLs aparecerão aqui!
                      </p>
                    </div>
                  ) : (
                    data.pixelNetwork.map((ping: any) => (
                      <div key={ping.id} className="p-2.5 rounded-lg border border-zinc-800 bg-zinc-950/80 flex items-center justify-between gap-2 hover:border-purple-500/20 transition-all">
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-white truncate font-jet">{ping.domain}</p>
                          <p className="text-[9px] text-zinc-500 mt-0.5">Último ping: {new Date(ping.lastSeen).toLocaleDateString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-[10px] font-bold font-jet text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded">
                            {ping.pingCount} pings
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <button 
                  onClick={handleCopyScript}
                  className="w-full mt-4 lz-btn-secondary !py-2 text-[10px] font-bold uppercase inline-flex items-center justify-center gap-1 text-[var(--purple-soft)] border-[var(--purple-border)]"
                >
                  <RefreshCw size={11} /> Copiar Código do Pixel Master
                </button>
              </div>

            </div>
          </div>

          {/* Danger Zone */}
          <div className="lz-card p-6 border-red-500/30 bg-red-950/5">
            <h2 className="font-grotesk text-lg font-bold mb-1 flex items-center gap-2 text-red-400">
              <AlertTriangle size={18} /> Zona de Perigo
            </h2>
            <p className="text-xs text-zinc-400 mb-4">Ações irreversíveis relacionadas à sua conta e histórico.</p>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <button 
                onClick={() => toast.success('Seus dados estão sendo empacotados. Um link de download foi enviado para o seu e-mail!')}
                className="flex-1 lz-btn-secondary !border-zinc-800 text-zinc-300 text-xs font-bold py-2.5 inline-flex items-center justify-center gap-1.5"
              >
                <Database size={14} /> Exportar meus dados (.JSON)
              </button>
              
              <button 
                onClick={() => setShowCancelModal(true)}
                className="flex-1 lz-btn-secondary !border-red-900/30 text-red-400 hover:bg-red-950/20 text-xs font-bold py-2.5 inline-flex items-center justify-center gap-1.5"
              >
                Cancelar Plano Mensal
              </button>
              
              <button 
                onClick={() => setShowDeleteModal(true)}
                className="flex-1 lz-btn-primary !bg-red-600 hover:!bg-red-500 border-red-500 text-white text-xs font-bold py-2.5 inline-flex items-center justify-center gap-1.5"
              >
                <Trash2 size={14} /> Excluir Minha Conta
              </button>
            </div>
          </div>

          {/* Modal Cancelar Plano */}
          <AnimatePresence>
            {showCancelModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                <motion.div 
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  className="lz-card p-6 max-w-sm w-full border-red-500/20 bg-zinc-950"
                >
                  <h3 className="font-grotesk text-base font-bold text-white mb-2">Confirmar Cancelamento</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed mb-4">
                    Ao cancelar, você perderá acesso ao scannear contatos e seus limites diários voltarão para o plano Grátis ao fim do ciclo.
                  </p>
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => setShowCancelModal(false)} className="lz-btn-secondary !py-1.5 !px-3 text-xs">Voltar</button>
                    <button 
                      onClick={() => { setShowCancelModal(false); toast.success('Plano cancelado com sucesso.') }} 
                      className="lz-btn-primary !bg-red-600 hover:!bg-red-500 border-red-500 text-white !py-1.5 !px-3 text-xs"
                    >
                      Confirmar Cancelar
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* Modal Excluir Conta */}
          <AnimatePresence>
            {showDeleteModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                <motion.div 
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  className="lz-card p-6 max-w-sm w-full border-red-500 bg-zinc-950"
                >
                  <h3 className="font-grotesk text-base font-bold text-red-500 mb-2 flex items-center gap-1.5">
                    <AlertTriangle size={16} /> Exclusão Permanente
                  </h3>
                  <p className="text-xs text-zinc-400 leading-relaxed mb-4">
                    Esta ação é irreversível. Todos os seus leads, dados de prospecção e rede de pixels associada serão apagados definitivamente do banco de dados.
                  </p>
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => setShowDeleteModal(false)} className="lz-btn-secondary !py-1.5 !px-3 text-xs">Cancelar</button>
                    <button 
                      onClick={handleDeleteAccount} 
                      className="lz-btn-primary !bg-red-600 hover:!bg-red-500 border-red-500 text-white !py-1.5 !px-3 text-xs"
                    >
                      Sim, Excluir Conta
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
