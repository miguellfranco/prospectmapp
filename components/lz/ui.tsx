'use client'

import { useEffect, useState } from 'react'
import {
  Utensils, Dumbbell, Scissors, Stethoscope, Pizza, PawPrint, Sparkles,
  Wrench, Scale, Home, Calculator, Building2, ShoppingBag, Flame, type LucideIcon,
} from 'lucide-react'

export const NICHE_LABELS: Record<string, string> = {
  restaurante: 'Restaurante / Saudável', academia: 'Musculação / Academia', salao: 'Salão de Beleza', barbearia: 'Barbearia',
  clinica: 'Clínica / Saúde', pizzaria: 'Pizzaria / Massas', petshop: 'Pet Shop / Veterinário', estetica: 'Clínica de Estética',
  oficina: 'Oficina Mecânica', advocacia: 'Escritório de Advocacia', imobiliaria: 'Imobiliária', contabilidade: 'Contabilidade',
  suplementos: 'Loja de Suplementos', muaythai: 'Muay Thai', jiujitsu: 'Jiu-Jitsu', funcional: 'Treino Funcional',
  pilates: 'Pilates', tatuagem: 'Estúdio de Tatuagem', loja: 'Loja de Roupas / Moda', crossfit: 'Crossfit',
  dentista: 'Dentista / Odontologia', hamburgueria: 'Hambúrgueria Artesanal'
}

export function nicheIcon(niche?: string | null): LucideIcon {
  const map: Record<string, LucideIcon> = {
    restaurante: Utensils, academia: Dumbbell, salao: Scissors, barbearia: Scissors,
    clinica: Stethoscope, pizzaria: Pizza, petshop: PawPrint, estetica: Sparkles,
    oficina: Wrench, advocacia: Scale, imobiliaria: Home, contabilidade: Calculator,
    suplementos: ShoppingBag, muaythai: Flame, jiujitsu: Flame, funcional: Dumbbell,
    pilates: Sparkles, tatuagem: Scissors, loja: ShoppingBag, crossfit: Dumbbell,
    dentista: Stethoscope, hamburgueria: Utensils
  }
  return map[(niche ?? '').toLowerCase()] ?? Building2
}

export function TierBadge({ tier }: { tier?: string | null }) {
  const t = (tier ?? 'cold').toLowerCase()
  if (t === 'hot') return <span className="lz-badge lz-badge-hot">QUENTE</span>
  if (t === 'warm') return <span className="lz-badge lz-badge-warm">MORNO</span>
  return <span className="lz-badge lz-badge-cold">FRIO</span>
}

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  novo: { label: 'NOVO', cls: 'lz-badge-new' },
  mensagem_gerada: { label: 'MSG GERADA', cls: 'lz-badge-warm' },
  enviado: { label: 'ENVIADO', cls: 'lz-badge-hot' },
  respondeu: { label: 'RESPONDEU', cls: 'lz-badge-hot' },
  venda_fechada: { label: 'VENDA ✅', cls: 'lz-badge-new' },
  ignorado: { label: 'IGNORADO', cls: 'lz-badge-cold' },
}
export function StatusBadge({ status }: { status?: string | null }) {
  const s = STATUS_MAP[(status ?? 'novo')] ?? STATUS_MAP.novo
  return <span className={`lz-badge ${s.cls}`}>{s.label}</span>
}

export function ScoreBar({ score, tier }: { score: number; tier?: string | null }) {
  const t = (tier ?? 'cold').toLowerCase()
  const color = t === 'hot' ? '#7c3aed' : t === 'warm' ? '#f59e0b' : '#44445a'
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 rounded-full overflow-hidden" style={{ background: '#1e1e35' }}>
        <div className="h-full rounded-full" style={{ width: `${(score / 10) * 100}%`, background: color }} />
      </div>
      <span className="font-jet text-xs" style={{ color }}>{score}/10</span>
    </div>
  )
}

export function PageHeader({ title, description, highlight, actions }: { title: string; description?: string; highlight?: string; actions?: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-grotesk tracking-tight" style={{ color: 'var(--text-primary)' }}>
          {title} {highlight && <span style={{ color: 'var(--purple-soft)' }}>{highlight}</span>}
        </h1>
        {description && <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>{description}</p>}
      </div>
      {actions && <div className="flex gap-3">{actions}</div>}
    </div>
  )
}

export function EmptyState({ icon: Icon, title = 'Nada aqui ainda', subtitle, action }: { icon: LucideIcon; title?: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6">
      <Icon size={64} style={{ color: 'var(--purple-core)', opacity: 0.3 }} strokeWidth={1.5} />
      <h3 className="mt-5 text-lg font-grotesk" style={{ color: 'var(--text-primary)' }}>{title}</h3>
      {subtitle && <p className="mt-1 text-sm max-w-md" style={{ color: 'var(--text-secondary)' }}>{subtitle}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}

export function TimeAgo({ date }: { date: string }) {
  const [label, setLabel] = useState('')
  useEffect(() => {
    function compute() {
      const diff = Date.now() - new Date(date).getTime()
      const m = Math.floor(diff / 60000)
      if (m < 1) return 'agora mesmo'
      if (m < 60) return `há ${m} min`
      const h = Math.floor(m / 60)
      if (h < 24) return `há ${h}h`
      const d = Math.floor(h / 24)
      return `há ${d}d`
    }
    setLabel(compute())
    const id = setInterval(() => setLabel(compute()), 60000)
    return () => clearInterval(id)
  }, [date])
  return <span suppressHydrationWarning>{label}</span>
}

export function CountUp({ value, duration = 1000, prefix = '', decimals = 0 }: { value: number; duration?: number; prefix?: string; decimals?: number }) {
  const [display, setDisplay] = useState(0)
  useEffect(() => {
    let raf = 0
    const start = performance.now()
    const to = value ?? 0
    function tick(now: number) {
      const p = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - p, 3)
      setDisplay(to * eased)
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [value, duration])
  return <span suppressHydrationWarning>{prefix}{display.toLocaleString('pt-BR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}</span>
}

export function brl(value?: number | null) {
  if (value == null) return 'R$ 0,00'
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
