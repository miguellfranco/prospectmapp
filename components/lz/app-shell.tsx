'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sidebar } from '@/components/lz/sidebar'
import { Search, Bell, ChevronDown, User, Settings, LogOut, Zap } from 'lucide-react'
import { signOut, useSession } from 'next-auth/react'
import Link from 'next/link'

const PLAN_LABEL: Record<string, string> = { vitalicio: 'VITALÍCIO', mensal: 'MENSAL', free: 'GRÁTIS' }

export function AppShell({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession() || {}
  const [me, setMe] = useState<{ name?: string; plan?: string; email?: string } | null>(null)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [unreadNotifications, setUnreadNotifications] = useState(3)

  useEffect(() => {
    fetch('/api/me')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setMe(d))
      .catch(() => {})
  }, [])

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
            {/* Notification Bell */}
            <button 
              onClick={() => setUnreadNotifications(0)}
              className="relative p-2 rounded-lg hover:bg-zinc-900/60 transition-colors text-zinc-300 hover:text-white"
            >
              <Bell size={18} />
              {unreadNotifications > 0 && (
                <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500 animate-pulse" />
              )}
            </button>

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
