'use client'

// Componentes compartilhados do InfoBook (painel, estruturas, wizard)

export const STRUCTURE_STATUS: Record<string, { label: string; cls: string; step: number }> = {
  rascunho: { label: 'RASCUNHO', cls: 'lz-badge-cold', step: 0 },
  conteudo_gerado: { label: 'E-BOOK PRONTO', cls: 'lz-badge-warm', step: 1 },
  precificado: { label: 'PRECIFICADO', cls: 'lz-badge-warm', step: 2 },
  landing_gerada: { label: 'PÁGINA NO AR', cls: 'lz-badge-hot', step: 3 },
  concluida: { label: 'CONCLUÍDA ✅', cls: 'lz-badge-new', step: 4 },
}

export function StructureStatusBadge({ status }: { status: string }) {
  const s = STRUCTURE_STATUS[status] ?? STRUCTURE_STATUS.rascunho
  return <span className={`lz-badge ${s.cls}`}>{s.label}</span>
}

// Barra de progresso do wizard (E-book → Produto → Página → Grupos)
export function WizardProgress({ current }: { current: number }) {
  const steps = ['E-book', 'Produto', 'Página', 'Grupos']
  return (
    <div className="flex items-center justify-between max-w-2xl mx-auto mb-10">
      {steps.map((label, i) => {
        const done = i < current
        const active = i === current
        return (
          <div key={label} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-2">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold font-jet border transition-all"
                style={{
                  background: done ? 'rgba(16,185,129,0.15)' : active ? 'var(--purple-core)' : 'rgba(255,255,255,0.05)',
                  borderColor: done ? 'rgba(16,185,129,0.5)' : active ? 'var(--purple-light)' : 'rgba(255,255,255,0.1)',
                  color: done ? 'var(--success)' : active ? '#fff' : 'var(--text-muted)',
                  boxShadow: active ? '0 0 18px rgba(124,58,237,0.6)' : 'none',
                }}
              >
                {done ? '✓' : i + 1}
              </div>
              <span className="text-[11px] font-semibold" style={{ color: active ? 'var(--purple-soft)' : done ? 'var(--success)' : 'var(--text-muted)' }}>
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className="flex-1 h-px mx-2 mb-6" style={{ background: done ? 'rgba(16,185,129,0.4)' : 'var(--border-default)' }} />
            )}
          </div>
        )
      })}
    </div>
  )
}
