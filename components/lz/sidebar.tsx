'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import {
  Radar, Search, MessageSquare, FileText, BarChart3, Trophy, Users, Settings, LogOut, Zap,
} from 'lucide-react'

const NAV = [
  { href: '/dashboard', label: 'Painel', icon: Radar },
  { href: '/prospectar', label: 'Prospectar', icon: Search },
  { href: '/mensagens', label: 'Mensagens', icon: MessageSquare },
  { href: '/prompts', label: 'Gerador de Prompts', icon: FileText },
  { href: '/ranking', label: 'Ranking', icon: Trophy },
  { href: '/configuracoes', label: 'Configurações', icon: Settings },
]

const PLAN_LABEL: Record<string, string> = { vitalicio: 'VITALÍCIO', mensal: 'MENSAL', free: 'GRÁTIS' }

export function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession() || {}
  const [me, setMe] = useState<{ name?: string; plan?: string } | null>(null)

  useEffect(() => {
    fetch('/api/me').then((r) => (r.ok ? r.json() : null)).then((d) => d && setMe(d)).catch(() => {})
  }, [])

  const name = me?.name ?? session?.user?.name ?? 'Usuário'
  const plan = me?.plan ?? 'free'
  const initials = name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className="hidden md:flex flex-col fixed left-0 top-0 h-screen w-[240px] z-40"
        style={{ background: 'var(--bg-primary)', borderRight: '1px solid var(--border-default)' }}
      >
        <div className="px-6 py-6 flex items-center gap-2">
          <Zap size={22} style={{ color: 'var(--purple-core)' }} fill="var(--purple-core)" />
          <span className="font-grotesk font-bold text-xl text-glow" style={{ color: 'var(--text-primary)' }}>ProspectMap</span>
        </div>

        <nav className="flex-1 px-3 space-y-1 overflow-y-auto scrollbar-none">
          {NAV.map((item) => {
            const active = pathname === item.href
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 rounded-[10px] px-4 py-2.5 text-sm font-medium transition-all"
                style={{
                  background: active ? 'rgba(124,58,237,0.1)' : 'transparent',
                  color: active ? 'var(--purple-soft)' : 'var(--text-secondary)',
                  borderLeft: active ? '3px solid var(--purple-core)' : '3px solid transparent',
                }}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="p-3 mt-2" style={{ borderTop: '1px solid var(--border-default)' }}>
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="flex items-center justify-center h-9 w-9 rounded-full font-jet text-xs font-bold shrink-0"
              style={{ background: 'var(--purple-glow)', color: 'var(--purple-soft)' }}>
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{name}</p>
              <span className="lz-badge lz-badge-hot mt-0.5">{PLAN_LABEL[plan] ?? 'GRÁTIS'}</span>
            </div>
            <button onClick={() => signOut({ callbackUrl: '/login' })} title="Sair"
              className="p-2 rounded-lg transition-colors" style={{ color: 'var(--text-secondary)' }}>
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile bottom tab bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around px-1 py-2"
        style={{ background: 'rgba(7,7,15,0.95)', backdropFilter: 'blur(16px)', borderTop: '1px solid var(--border-default)' }}>
        {NAV.slice(0, 5).map((item) => {
          const active = pathname === item.href
          const Icon = item.icon
          return (
            <Link key={item.href} href={item.href} className="flex flex-col items-center gap-0.5 px-2 py-1"
              style={{ color: active ? 'var(--purple-soft)' : 'var(--text-secondary)' }}>
              <Icon size={20} />
              <span className="text-[10px] font-medium">{item.label.split(' ')[0]}</span>
            </Link>
          )
        })}
      </nav>
    </>
  )
}
