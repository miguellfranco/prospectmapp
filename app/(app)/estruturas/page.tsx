'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Sparkles, Layers, ExternalLink, Trash2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader, EmptyState, TimeAgo, brl } from '@/components/lz/ui'
import { StructureStatusBadge } from '@/components/lz/ebookai-ui'

interface StructureItem {
  id: string
  niche: string
  subNiche: string | null
  title: string
  status: string
  createdAt: string
  product: { id: string; name: string; price: number | null; checkoutUrl: string | null } | null
  landingPage: { slug: string; publishedAt: string | null } | null
}

export default function EstruturasPage() {
  const [structures, setStructures] = useState<StructureItem[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  function load() {
    fetch('/api/estruturas')
      .then(async (r) => {
        const d = await r.json().catch(() => null)
        if (!r.ok) throw new Error(d?.error ?? 'Erro ao carregar estruturas.')
        setStructures(d.structures)
      })
      .catch((e) => setError(e.message))
  }

  useEffect(() => { load() }, [])

  async function handleDelete(id: string) {
    if (!window.confirm('Excluir esta estrutura? O e-book, a página de vendas e as mensagens geradas serão removidos.')) return
    setDeleting(id)
    try {
      const res = await fetch(`/api/estruturas/${id}`, { method: 'DELETE' })
      const d = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(d?.error ?? 'Erro ao excluir.')
      toast.success('Estrutura excluída.')
      setStructures((prev) => prev?.filter((s) => s.id !== id) ?? null)
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="p-6 md:p-10 pb-24 md:pb-10 max-w-7xl mx-auto">
      <PageHeader
        title="Minhas"
        highlight="Estruturas"
        description="Cada estrutura é um funil completo: e-book, produto, página de vendas e divulgação."
        actions={
          <Link href="/estruturas/nova" className="lz-btn-primary inline-flex items-center gap-2">
            <Sparkles size={16} /> Nova Estrutura
          </Link>
        }
      />

      {error && <div className="lz-card p-6 text-sm mb-6" style={{ color: 'var(--danger)' }}>{error}</div>}

      {!structures && !error && (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="animate-spin" size={28} style={{ color: 'var(--purple-core)' }} />
        </div>
      )}

      {structures && structures.length === 0 && (
        <div className="lz-card">
          <EmptyState
            icon={Layers}
            title="Nenhuma estrutura ainda"
            subtitle="Comece agora: escolha um nicho e deixe a IA construir seu primeiro infoproduto."
            action={
              <Link href="/estruturas/nova" className="lz-btn-primary inline-flex items-center gap-2">
                <Sparkles size={16} /> Criar primeira estrutura
              </Link>
            }
          />
        </div>
      )}

      {structures && structures.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {structures.map((s) => (
            <div key={s.id} className="lz-card lz-card-hover p-5 flex flex-col">
              <div className="flex items-start justify-between gap-3 mb-3">
                <span className="text-xs font-jet uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                  {s.niche}{s.subNiche ? ` · ${s.subNiche}` : ''}
                </span>
                <StructureStatusBadge status={s.status} />
              </div>

              <p className="font-semibold text-sm mb-1 line-clamp-2" style={{ color: 'var(--text-primary)' }}>
                {s.product?.name ?? s.title}
              </p>
              <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
                Criada <TimeAgo date={s.createdAt} />
              </p>

              <div className="flex items-center justify-between mt-auto pt-3" style={{ borderTop: '1px solid var(--border-default)' }}>
                <span className="font-jet text-sm" style={{ color: 'var(--purple-soft)' }}>
                  {s.product?.price != null ? brl(s.product.price) : 'sem preço'}
                </span>
                <div className="flex items-center gap-2">
                  {s.landingPage && (
                    <a
                      href={`/p/${s.landingPage.slug}`} target="_blank" rel="noreferrer"
                      className="p-2 rounded-lg transition-colors" title="Abrir página de vendas"
                      style={{ color: 'var(--success)' }}
                    >
                      <ExternalLink size={16} />
                    </a>
                  )}
                  <button
                    onClick={() => handleDelete(s.id)}
                    disabled={deleting === s.id}
                    className="p-2 rounded-lg transition-colors"
                    title="Excluir estrutura"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {deleting === s.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                  </button>
                  <Link href={`/estruturas/${s.id}`} className="lz-btn-secondary !px-4 !py-2 text-xs">
                    {s.status === 'concluida' ? 'Ver' : 'Continuar'}
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
