'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Search, MapPin, Loader2, Phone, Star, Globe, Sparkles, 
  Check, X, Eye, ShieldAlert, Award, Instagram, MessageSquare, 
  ExternalLink, Copy, RefreshCw, Briefcase, Target, Smile
} from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader, TierBadge, ScoreBar, nicheIcon, NICHE_LABELS } from '@/components/lz/ui'

const SUB_NICHES = [
  { id: 'suplementos', label: 'Loja de Suplementos' },
  { id: 'muaythai', label: 'Muay Thai' },
  { id: 'jiujitsu', label: 'Jiu-Jitsu' },
  { id: 'funcional', label: 'Treino Funcional' },
  { id: 'academia', label: 'Musculação / Academia' },
  { id: 'pilates', label: 'Pilates' },
  { id: 'restaurante', label: 'Restaurante / Saudável' },
  { id: 'salao', label: 'Salão de Beleza' },
  { id: 'barbearia', label: 'Barbearia' },
  { id: 'dentista', label: 'Dentista / Odontologia' },
  { id: 'estetica', label: 'Clínica de Estética' },
  { id: 'petshop', label: 'Pet Shop / Veterinário' },
  { id: 'oficina', label: 'Oficina Mecânica' },
  { id: 'advocacia', label: 'Escritório de Advocacia' },
  { id: 'imobiliaria', label: 'Imobiliária' },
  { id: 'contabilidade', label: 'Contabilidade' },
  { id: 'pizzaria', label: 'Pizzaria / Massas' },
  { id: 'hamburgueria', label: 'Hambúrgueria Artesanal' },
  { id: 'tatuagem', label: 'Estúdio de Tatuagem' },
  { id: 'loja', label: 'Loja de Roupas / Moda' },
  { id: 'crossfit', label: 'Crossfit' },
  { id: 'clinica_medica', label: 'Clínica Médica' },
  { id: 'farmacia', label: 'Farmácia' },
  { id: 'celulares', label: 'Loja de Celulares / Eletrônicos' },
  { id: 'grafica', label: 'Gráfica / Impressão' },
  { id: 'escola_idiomas', label: 'Escola de Idiomas' },
  { id: 'autoescola', label: 'Autoescola / CFC' },
  { id: 'floricultura', label: 'Floricultura' },
  { id: 'escola_infantil', label: 'Escola Infantil / Creche' },
  { id: 'fotografo', label: 'Fotógrafo / Estúdio de Fotos' },
  { id: 'lavanderia', label: 'Lavanderia' },
  { id: 'padaria', label: 'Padaria / Confeitaria' },
  { id: 'otica', label: 'Ótica' }
]

const BRAZILIAN_STATES = [
  { code: 'AC', name: 'Acre' },
  { code: 'AL', name: 'Alagoas' },
  { code: 'AP', name: 'Amapá' },
  { code: 'AM', name: 'Amazonas' },
  { code: 'BA', name: 'Bahia' },
  { code: 'CE', name: 'Ceará' },
  { code: 'DF', name: 'Distrito Federal' },
  { code: 'ES', name: 'Espírito Santo' },
  { code: 'GO', name: 'Goiás' },
  { code: 'MA', name: 'Maranhão' },
  { code: 'MT', name: 'Mato Grosso' },
  { code: 'MS', name: 'Mato Grosso do Sul' },
  { code: 'MG', name: 'Minas Gerais' },
  { code: 'PA', name: 'Pará' },
  { code: 'PB', name: 'Paraíba' },
  { code: 'PR', name: 'Paraná' },
  { code: 'PE', name: 'Pernambuco' },
  { code: 'PI', name: 'Piauí' },
  { code: 'RJ', name: 'Rio de Janeiro' },
  { code: 'RN', name: 'Rio Grande do Norte' },
  { code: 'RS', name: 'Rio Grande do Sul' },
  { code: 'RO', name: 'Rondônia' },
  { code: 'RR', name: 'Roraima' },
  { code: 'SC', name: 'Santa Catarina' },
  { code: 'SP', name: 'São Paulo' },
  { code: 'SE', name: 'Sergipe' },
  { code: 'TO', name: 'Tocantins' }
]

const CITIES_BY_STATE: Record<string, string[]> = {
  AC: [
    'Rio Branco', 'Cruzeiro do Sul', 'Sena Madureira', 'Tarauacá', 'Feijó',
    'Brasileia', 'Senador Guiomard', 'Plácido de Castro', 'Xapuri', 'Epitaciolândia'
  ],
  AL: [
    'Maceió', 'Arapiraca', 'Rio Largo', 'Palmeira dos Índios', 'União dos Palmares',
    'Penedo', 'São Miguel dos Campos', 'Coruripe', 'Delmiro Gouveia', 'Marechal Deodoro'
  ],
  AP: [
    'Macapá', 'Santana', 'Laranjal do Jari', 'Oiapoque', 'Mazagão',
    'Porto Grande', 'Tartarugalzinho', 'Pedra Branca do Amapari', 'Vitória do Jari'
  ],
  AM: [
    'Manaus', 'Parintins', 'Itacoatiara', 'Manacapuru', 'Coari',
    'Tefé', 'Tabatinga', 'Maués', 'Iranduba', 'Humaitá'
  ],
  BA: [
    'Salvador', 'Feira de Santana', 'Vitória da Conquista', 'Camaçari', 'Itabuna',
    'Juazeiro', 'Ilhéus', 'Lauro de Freitas', 'Jequié', 'Teixeira de Freitas'
  ],
  CE: [
    'Fortaleza', 'Caucaia', 'Juazeiro do Norte', 'Maracanaú', 'Sobral',
    'Crato', 'Itapipoca', 'Maranguape', 'Iguatu', 'Quixadá'
  ],
  DF: [
    'Brasília', 'Ceilândia', 'Taguatinga', 'Samambaia', 'Plano Piloto',
    'Águas Claras', 'Gama', 'Sobradinho', 'Recanto das Emas', 'Santa Maria'
  ],
  ES: [
    'Vitória', 'Vila Velha', 'Serra', 'Cariacica', 'Cachoeiro de Itapemirim',
    'Linhares', 'São Mateus', 'Colatina', 'Guarapari', 'Aracruz'
  ],
  GO: [
    'Goiânia', 'Aparecida de Goiânia', 'Anápolis', 'Rio Verde', 'Luziânia',
    'Águas Lindas de Goiás', 'Valparaíso de Goiás', 'Trindade', 'Formosa', 'Itumbiara'
  ],
  MA: [
    'São Luís', 'Imperatriz', 'Timon', 'Caxias', 'Codó',
    'Paço do Lumiar', 'Açailândia', 'Bacabal', 'São José de Ribamar', 'Balsas'
  ],
  MT: [
    'Cuiabá', 'Várzea Grande', 'Rondonópolis', 'Sinop', 'Tangará da Serra',
    'Cáceres', 'Sorriso', 'Lucas do Rio Verde', 'Primavera do Leste', 'Barra do Garças'
  ],
  MS: [
    'Campo Grande', 'Dourados', 'Três Lagoas', 'Corumbá', 'Ponta Porã',
    'Naviraí', 'Nova Andradina', 'Aquidauana', 'Sidrolândia', 'Paranaíba'
  ],
  MG: [
    'Belo Horizonte', 'Uberlândia', 'Contagem', 'Juiz de Fora', 'Betim',
    'Montes Claros', 'Uberaba', 'Governador Valadares', 'Ipatinga', 'Divinópolis'
  ],
  PA: [
    'Belém', 'Ananindeua', 'Santarém', 'Marabá', 'Castanhal',
    'Parauapebas', 'Itaituba', 'Altamira', 'Cametá', 'Abaetetuba'
  ],
  PB: [
    'João Pessoa', 'Campina Grande', 'Santa Rita', 'Patos', 'Bayeux',
    'Cabedelo', 'Sousa', 'Cajazeiras', 'Guarabira', 'Sapé'
  ],
  PR: [
    'Curitiba', 'Londrina', 'Maringá', 'Ponta Grossa', 'Cascavel',
    'São José dos Pinhais', 'Foz do Iguaçu', 'Guarapuava', 'Paranaguá', 'Apucarana'
  ],
  PE: [
    'Recife', 'Jaboatão dos Guararapes', 'Olinda', 'Caruaru', 'Petrolina',
    'Paulista', 'Cabo de Santo Agostinho', 'Vitória de Santo Antão', 'Garanhuns', 'Igarassu'
  ],
  PI: [
    'Teresina', 'Parnaíba', 'Picos', 'Piripiri', 'Floriano',
    'Campo Maior', 'Barras', 'União', 'Altos', 'José de Freitas'
  ],
  RJ: [
    'Rio de Janeiro', 'Niterói', 'Duque de Caxias', 'São Gonçalo', 'Nova Iguaçu',
    'Petrópolis', 'Campos dos Goytacazes', 'Volta Redonda', 'Macaé', 'Cabo Frio'
  ],
  RN: [
    'Natal', 'Mossoró', 'Parnamirim', 'São Gonçalo do Amarante', 'Macaíba',
    'Ceará-Mirim', 'Caicó', 'Açu', 'Currais Novos', 'São José de Mipibu'
  ],
  RS: [
    'Porto Alegre', 'Caxias do Sul', 'Canoas', 'Pelotas', 'Santa Maria',
    'Gravataí', 'Novo Hamburgo', 'Passo Fundo', 'Rio Grande', 'Bento Gonçalves'
  ],
  RO: [
    'Porto Velho', 'Ji-Paraná', 'Ariquemes', 'Vilhena', 'Cacoal',
    'Rolim de Moura', 'Jaru', 'Guajará-Mirim', 'Ouro Preto do Oeste'
  ],
  RR: [
    'Boa Vista', 'Rorainópolis', 'Caracaraí', 'Alto Alegre', 'Pacaraima',
    'Cantá', 'Bonfim', 'Mucajaí', 'Normandia'
  ],
  SC: [
    'Florianópolis', 'Joinville', 'Blumenau', 'São José', 'Chapecó',
    'Criciúma', 'Itajaí', 'Balneário Camboriú', 'Lages', 'Palhoça'
  ],
  SP: [
    'São Paulo', 'Santos', 'Campinas', 'Bauru', 'São Bernardo do Campo',
    'Santo André', 'Guarulhos', 'Osasco', 'Ribeirão Preto', 'São José dos Campos',
    'Sorocaba', 'Jundiaí', 'Piracicaba', 'São José do Rio Preto', 'Mogi das Cruzes'
  ],
  SE: [
    'Aracaju', 'Nossa Senhora do Socorro', 'Lagarto', 'Itabaiana', 'Estância',
    'São Cristóvão', 'Tobias Barreto', 'Simão Dias', 'Capela', 'Propriá'
  ],
  TO: [
    'Palmas', 'Araguaína', 'Gurupi', 'Porto Nacional', 'Paraíso do Tocantins',
    'Colinas do Tocantins', 'Guaraí', 'Tocantinópolis', 'Dianópolis', 'Miracema do Tocantins'
  ]
}

export default function ProspectarPage() {
  const [city, setCity] = useState('')
  const [selectedState, setSelectedState] = useState('SP')
  const [niche, setNiche] = useState('suplementos')
  const [cityInputFocused, setCityInputFocused] = useState(false)
  const [loading, setLoading] = useState(false)
  const [scanStep, setScanStep] = useState(0)
  const [scanCount, setScanCount] = useState(0)
  const [results, setResults] = useState<any[]>([])
  
  // Pagination states
  const [page, setPage] = useState(1)
  const [totalResults, setTotalResults] = useState(0)
  const [loadingMore, setLoadingMore] = useState(false)
  
  // Custom Filter Badges
  const [filterPhoneOnly, setFilterPhoneOnly] = useState(false)
  const [filterNoWebsiteOnly, setFilterNoWebsiteOnly] = useState(true) // default true since we want no site

  // Modal states
  const [selectedLead, setSelectedLead] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<'auditoria' | 'whatsapp'>('whatsapp')
  
  // AI Audit Tab states
  const [auditLoading, setAuditLoading] = useState(false)
  const [auditText, setAuditText] = useState('')

  // WhatsApp Tab states (Tone & Alternative models)
  const [selectedTone, setSelectedTone] = useState<'casual' | 'profissional' | 'direto'>('casual')
  const [messageVariant, setMessageVariant] = useState(1)
  const [messageText, setMessageText] = useState('')
  const [messageLoading, setMessageLoading] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  
  // Animation states
  const [isGlowGold, setIsGlowGold] = useState(false)
  const [showSaleModal, setShowSaleModal] = useState(false)

  // Radar scanning messages
  const scanMessages = [
    "📡 Conectando ao Google Maps Brasil...",
    "🗺️ Filtrando negócios por nicho em " + (city || "sua localidade") + "...",
    "🔍 Removendo estabelecimentos que já possuem website ativo...",
    "🌐 Verificando ranqueamento nas pesquisas locais e otimização GMB...",
    "🧠 IA analisando potencial de fechamento...",
    "✅ Prospecção finalizada com sucesso!"
  ]

  // Simulate radar
  useEffect(() => {
    if (!loading) return
    let countInterval: any
    let stepInterval: any

    setScanStep(0)
    setScanCount(0)

    stepInterval = setInterval(() => {
      setScanStep((prev) => Math.min(scanMessages.length - 1, prev + 1))
    }, 3000)

    countInterval = setInterval(() => {
      setScanCount((prev) => Math.min(38, prev + Math.floor(Math.random() * 6 + 2)))
    }, 800)

    return () => {
      clearInterval(countInterval)
      clearInterval(stepInterval)
    }
  }, [loading])

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!city.trim()) { toast.error('Informe a cidade de busca.'); return }
    setLoading(true)
    setResults([])
    setPage(1)
    setTotalResults(0)

    try {
      const stateName = BRAZILIAN_STATES.find(s => s.code === selectedState)?.name || ''
      const fullLocation = `${city}, ${selectedState}`
      const res = await fetch('/api/leads', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ city: fullLocation, niche, page: 1, limit: 5 }) 
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) { 
        toast.error(data?.error ?? 'Erro ao prospectar.'); 
        setLoading(false)
        return 
      }
      setResults(data?.leads ?? [])
      setTotalResults(data?.totalResults ?? 0)
      if (!data?.leads?.length) {
        toast.error('Nenhuma empresa real encontrada para esse nicho/cidade no momento. Tente outra cidade ou nicho.')
      } else {
        toast.success(`${data.leads.length} de ${data?.totalResults ?? data.leads.length} empresas encontradas!`)
      }
    } catch { 
      toast.error('Erro ao prospectar.') 
    } finally { 
      setLoading(false) 
    }
  }

  async function handleLoadMore() {
    if (loadingMore) return
    setLoadingMore(true)
    const nextPage = page + 1
    try {
      const stateName = BRAZILIAN_STATES.find(s => s.code === selectedState)?.name || ''
      const fullLocation = `${city}, ${selectedState}`
      const res = await fetch('/api/leads', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ city: fullLocation, niche, page: nextPage, limit: 5 }) 
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok && data?.leads) {
        setResults((prev) => [...prev, ...data.leads])
        setPage(nextPage)
        if (data.leads.length > 0) {
          toast.success(`Mais ${data.leads.length} empresas carregadas!`)
        } else {
          toast('Não há mais empresas reais para esse nicho/cidade no momento.')
        }
      } else {
        toast.error('Erro ao carregar mais empresas.')
      }
    } catch {
      toast.error('Erro ao conectar ao servidor.')
    } finally {
      setLoadingMore(false)
    }
  }

  // Triggered when clicking to open/view a lead (Limits check by click!)
  async function handleOpenLead(lead: any, tab: 'auditoria' | 'whatsapp') {
    // 1. Call the limit verification API
    toast.loading('Carregando dados da empresa...', { id: 'lead-view' })
    try {
      const res = await fetch('/api/leads/view', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId: lead.id, lead })
      })
      const data = await res.json().catch(() => ({}))
      
      if (!res.ok && data?.error && data.error.includes('Limite diário')) {
        toast.error(data.error, { id: 'lead-view' })
        return
      }

      // Mark the lead as viewed locally in results array so count updates without reloading
      setResults((prev) => prev.map((l) => l.id === lead.id ? { ...l, viewed: true } : l))
      toast.dismiss('lead-view')

      // Set states and open modal
      setSelectedLead(lead)
      setActiveTab(tab)
      setSelectedTone('casual')
      setMessageVariant(1)
      setMessageText('')

      if (tab === 'auditoria') {
        loadAuditText(lead)
      } else {
        loadMessageText(lead, 'casual', 1)
      }
    } catch {
      // In case of network errors or bypass lookups, proceed anyway for maximum resiliency
      setResults((prev) => prev.map((l) => l.id === lead.id ? { ...l, viewed: true } : l))
      toast.dismiss('lead-view')

      setSelectedLead(lead)
      setActiveTab(tab)
      setSelectedTone('casual')
      setMessageVariant(1)
      setMessageText('')

      if (tab === 'auditoria') {
        loadAuditText(lead)
      } else {
        loadMessageText(lead, 'casual', 1)
      }
    }
  }

  // Load IA audit text
  async function loadAuditText(lead: any) {
    setAuditLoading(true)
    setAuditText('')
    try {
      const res = await fetch('/api/leads/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId: lead.id, lead })
      })
      const data = await res.json()
      if (res.ok) {
        setAuditText(data.analysis)
      } else {
        setAuditText('Erro ao carregar análise comercial.')
      }
    } catch {
      setAuditText('Erro ao carregar análise comercial.')
    } finally {
      setAuditLoading(false)
    }
  }

  // Load / Generate message text by Tone and Variant
  async function loadMessageText(lead: any, tone: 'casual' | 'profissional' | 'direto', variant: number) {
    setMessageLoading(true)
    setMessageText('')
    setIsGlowGold(false)
    try {
      const res = await fetch('/api/messages/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId: lead.id, tone, variant, lead })
      })
      
      if (!res.ok || !res.body) {
        setMessageText('Erro ao gerar mensagem personalizada com IA.')
        setMessageLoading(false)
        return
      }

      // Read text stream
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let full = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const text = decoder.decode(value, { stream: true })
        const lines = text.split('\n')
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const p = JSON.parse(line.slice(6))
              if (p.status === 'processing' && p.delta) {
                full += p.delta
                setMessageText(full)
              }
            } catch {}
          }
        }
      }
      if (full && !full.includes('Erro')) {
        setIsGlowGold(true)
        setTimeout(() => setIsGlowGold(false), 600)
        toast.success('✨ Mensagem perfeita criada!')
      }
    } catch {
      setMessageText('Erro ao gerar mensagem.')
    } finally {
      setMessageLoading(false)
    }
  }

  // Cycle variants (1/5)
  function handleNextVariant() {
    if (!selectedLead || messageLoading) return
    const nextVal = messageVariant >= 5 ? 1 : messageVariant + 1
    setMessageVariant(nextVal)
    loadMessageText(selectedLead, selectedTone, nextVal)
  }

  // Change message tone
  function handleToneChange(tone: 'casual' | 'profissional' | 'direto') {
    if (!selectedLead || messageLoading) return
    setSelectedTone(tone)
    setMessageVariant(1)
    loadMessageText(selectedLead, tone, 1)
  }

  // Update lead status in modal
  async function updateStatus(newStatus: string) {
    if (!selectedLead) return
    setUpdatingStatus(true)
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId: selectedLead.id, status: newStatus })
      })
      if (res.ok) {
        setSelectedLead({ ...selectedLead, status: newStatus })
        setResults((prev) => prev.map((l) => l.id === selectedLead.id ? { ...l, status: newStatus } : l))
        toast.success('Status do lead atualizado!')
        
        if (newStatus === 'venda_fechada') {
          setShowSaleModal(true)
        }
      } else {
        toast.error('Erro ao atualizar status.')
      }
    } catch {
      toast.error('Erro ao atualizar status.')
    } finally {
      setUpdatingStatus(false)
    }
  }

  // Copy details
  function copyToClipboard(text: string, msg = 'Copiado!') {
    navigator.clipboard?.writeText(text)
      .then(() => toast.success(msg))
      .catch(() => toast.error('Erro ao copiar.'))
  }

  // Filter results client-side based on user quick filters
  const filteredResults = results.filter((l) => {
    if (filterPhoneOnly && !l.phone) return false
    if (filterNoWebsiteOnly && l.hasWebsite) return false
    return true
  })

  const filteredCities = (CITIES_BY_STATE[selectedState] || []).filter(c =>
    c.toLowerCase().includes(city.toLowerCase())
  )

  return (
    <div className="relative">
      <PageHeader 
        title="Prospecção de Negócios" 
        highlight="competidor" 
        description="Filtre e busque por negócios locais no Brasil e atinja-os diretamente no WhatsApp de forma rápida e intuitiva." 
      />

      {!loading && results.length === 0 && (
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          {/* Tags de Subnichos do Concorrente */}
          <div>
            <label className="block text-xs font-grotesk font-bold mb-2.5 uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
              Selecione o Nicho ou Comércio
            </label>
            <div className="flex flex-wrap gap-2">
              {SUB_NICHES.map((tag) => {
                const isSelected = niche === tag.id
                return (
                  <button
                    type="button"
                    key={tag.id}
                    onClick={() => setNiche(tag.id)}
                    className="px-4 py-2 rounded-full font-grotesk text-xs font-semibold transition-all duration-150 border"
                    style={{
                      borderColor: isSelected ? 'var(--purple-core)' : 'var(--border-default)',
                      background: isSelected ? 'var(--purple-glow)' : 'var(--bg-secondary)',
                      color: isSelected ? 'var(--purple-light)' : 'var(--text-primary)'
                    }}
                  >
                    {tag.label}
                  </button>
                )
              })}
            </div>
          </div>

          <form onSubmit={handleSearch} className="lz-card p-5 space-y-4">
            {/* Filtros Rápidos (Competidor) */}
            <div>
              <label className="block text-xs font-grotesk font-bold mb-2 uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                Filtros Rápidos
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setFilterPhoneOnly(!filterPhoneOnly)}
                  className="px-3 py-1.5 rounded-lg border text-xs font-grotesk font-semibold inline-flex items-center gap-1.5 transition-colors"
                  style={{
                    borderColor: filterPhoneOnly ? 'var(--purple-core)' : 'var(--border-default)',
                    background: filterPhoneOnly ? 'rgba(124, 58, 237, 0.1)' : 'transparent',
                    color: filterPhoneOnly ? 'var(--purple-soft)' : 'var(--text-secondary)'
                  }}
                >
                  <Phone size={13} /> Apenas com Telefone
                </button>
                <button
                  type="button"
                  onClick={() => setFilterNoWebsiteOnly(!filterNoWebsiteOnly)}
                  className="px-3 py-1.5 rounded-lg border text-xs font-grotesk font-semibold inline-flex items-center gap-1.5 transition-colors"
                  style={{
                    borderColor: filterNoWebsiteOnly ? 'var(--purple-core)' : 'var(--border-default)',
                    background: filterNoWebsiteOnly ? 'rgba(124, 58, 237, 0.1)' : 'transparent',
                    color: filterNoWebsiteOnly ? 'var(--purple-soft)' : 'var(--text-secondary)'
                  }}
                >
                  <Globe size={13} /> Sem Website
                </button>
              </div>
            </div>

            {/* Localidade (País + Estado + Cidade) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-grotesk font-bold mb-1.5" style={{ color: 'var(--text-secondary)' }}>País</label>
                <input readOnly value="Brasil" className="lz-input !bg-[var(--bg-elevated)] cursor-not-allowed text-glow" />
              </div>
              <div>
                <label className="block text-xs font-grotesk font-bold mb-1.5" style={{ color: 'var(--text-secondary)' }}>Estado/Região</label>
                <select 
                  value={selectedState} 
                  onChange={(e) => setSelectedState(e.target.value)} 
                  className="lz-input"
                >
                  {BRAZILIAN_STATES.map((state) => (
                    <option key={state.code} value={state.code} style={{ background: '#0d0d1a' }}>
                      {state.name} ({state.code})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-grotesk font-bold mb-1.5" style={{ color: 'var(--text-secondary)' }}>Cidade</label>
                <div className="relative">
                  <MapPin size={18} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                  <input
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    onFocus={() => setCityInputFocused(true)}
                    onBlur={() => setTimeout(() => setCityInputFocused(false), 250)}
                    placeholder="Ex: Santos, Campinas"
                    className="lz-input focus:border-[var(--purple-core)]"
                    style={{ paddingLeft: '42px' }}
                  />
                  {cityInputFocused && filteredCities.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-zinc-950 border border-zinc-800 rounded-lg max-h-48 overflow-y-auto z-50 shadow-2xl scrollbar-none">
                      {filteredCities.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onMouseDown={() => setCity(c)}
                          className="w-full text-left px-4 py-2.5 text-xs text-zinc-300 hover:bg-[var(--purple-core)]/20 hover:text-white transition-colors border-b border-zinc-900/50 last:border-0"
                        >
                          📍 {c}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={!city.trim() || loading}
              className="lz-btn-primary w-full h-[48px] inline-flex items-center justify-center gap-2"
              style={{ boxShadow: '0 0 25px rgba(124, 58, 237, 0.3)' }}
            >
              <Search size={18} />
              <span>Buscar Empresas</span>
            </button>

            <div className="text-xs p-3 rounded-lg border border-[var(--border-default)] flex gap-2 items-center" style={{ background: 'var(--bg-primary)' }}>
              <span className="text-base">💡</span>
              <p style={{ color: 'var(--text-secondary)' }}>
                <strong>Dica:</strong> Seja específico no nicho para resultados mais precisos (ex: &ldquo;muay thai&rdquo; ou &ldquo;suplementos&rdquo; ao invés de &ldquo;academia&rdquo;).
              </p>
            </div>
          </form>
        </motion.div>
      )}

      {/* Radar de Prospecção */}
      {loading && (
        <div className="lz-card p-10 text-center flex flex-col items-center justify-center min-h-[400px]">
          <div className="relative h-32 w-32 mb-8 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border border-[rgba(124,58,237,0.15)] animate-ping" />
            <div className="absolute inset-2 rounded-full border border-[rgba(124,58,237,0.2)]" />
            <div className="absolute inset-6 rounded-full border border-[rgba(124,58,237,0.3)]" />
            <div className="absolute inset-0 rounded-full border border-[var(--purple-border)] overflow-hidden">
              <div 
                className="h-full w-1/2 origin-right bg-gradient-to-l from-[rgba(124,58,237,0.25)] to-transparent" 
                style={{
                  transformOrigin: 'right center',
                  animation: 'spin 1.8s linear infinite'
                }}
              />
            </div>
            <div className="h-4 w-4 rounded-full bg-[var(--purple-core)] text-glow animate-pulse z-10" />
          </div>

          <h3 className="font-grotesk text-lg mb-2" style={{ color: 'var(--text-primary)' }}>
            Prospectando no Google Maps
          </h3>
          <p className="text-sm font-jet mb-4 animate-pulse" style={{ color: 'var(--purple-soft)' }}>
            {scanCount} empresas qualificadas encontradas...
          </p>

          <div className="max-w-md w-full p-3 rounded-lg text-left text-xs font-jet" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-default)' }}>
            <AnimatePresence mode="wait">
              <motion.p 
                key={scanStep}
                initial={{ opacity: 0, x: -10 }} 
                animate={{ opacity: 1, x: 0 }} 
                exit={{ opacity: 0, x: 10 }}
                style={{ color: 'var(--text-secondary)' }}
              >
                {scanMessages[scanStep]}
              </motion.p>
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Resultados (Layout do Competidor - Foto 3) */}
      {results.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-grotesk text-lg" style={{ color: 'var(--text-primary)' }}>
              Resultados da Prospecção - {totalResults} {totalResults === 1 ? 'empresa encontrada' : 'empresas encontradas'}
              {filteredResults.length !== results.length && (
                <span className="text-sm font-normal" style={{ color: 'var(--text-secondary)' }}>
                  {' '}({filteredResults.length} após filtros — {results.length - filteredResults.length} ocultas por já terem site ou não terem telefone)
                </span>
              )}
            </h2>
            <button 
              onClick={() => { setResults([]); setCity(''); setPage(1); setTotalResults(0) }} 
              className="lz-btn-secondary !py-1.5 !px-3 text-xs"
            >
              Nova Prospecção
            </button>
          </div>

          <div className="space-y-4">
            {filteredResults.map((l) => (
              <div 
                key={l.id} 
                className="lz-card p-5 border flex flex-col md:flex-row justify-between gap-5 relative transition-all duration-200 hover:border-[rgba(124,58,237,0.4)]"
                style={{ background: 'var(--bg-secondary)' }}
              >
                <div className="flex-1 min-w-0">
                  {/* Nome e Badges */}
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <h3 className="font-grotesk font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
                      {l.businessName}
                    </h3>
                    <span className="lz-badge lz-badge-new inline-flex items-center gap-1">
                      ★ Excelente - {l.rating ?? 'N/A'}
                    </span>
                    <span 
                      className={`lz-badge text-[10px] ${
                        l.viewed ? 'lz-badge-cold' : 'lz-badge-hot'
                      }`}
                    >
                      {l.viewed ? '● Já Prospectado' : '● Pronto para Prospectar'}
                    </span>
                  </div>

                  {/* Categoria Tag */}
                  <div className="mb-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-grotesk font-bold" style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}>
                      {NICHE_LABELS[l.niche] || l.niche}
                    </span>
                  </div>

                  {/* Endereço */}
                  <p className="text-xs mb-3 flex items-start gap-1" style={{ color: 'var(--text-secondary)' }}>
                    <span>📍</span>
                    <span>{l.city}</span>
                  </p>

                  {/* Subtexto descritivo */}
                  <p className="text-xs font-semibold mb-4" style={{ color: 'var(--purple-soft)' }}>
                    {!l.hasWebsite 
                      ? 'Sem site e boa reputação — pronto pra vender online.' 
                      : 'Possui website cadastrado.'}
                  </p>

                  {/* Ações da foto 3 */}
                  <div className="flex flex-wrap gap-2 text-xs">
                    <button 
                      onClick={() => handleOpenLead(l, 'whatsapp')} 
                      className="px-4 py-2 rounded-lg font-grotesk font-semibold inline-flex items-center gap-1.5 transition-all text-white bg-[var(--purple-core)] hover:bg-[var(--purple-light)]"
                    >
                      <MessageSquare size={13} /> WhatsApp
                    </button>
                    <button 
                      onClick={() => handleOpenLead(l, 'auditoria')} 
                      className="px-4 py-2 rounded-lg font-grotesk font-semibold inline-flex items-center gap-1.5 transition-all border border-[var(--border-default)] text-[var(--text-secondary)] hover:border-[var(--purple-core)] hover:text-white"
                    >
                      <Eye size={13} /> Ver Auditoria
                    </button>
                    {l.phone ? (
                      <a 
                        href={`tel:${l.phone.replace(/\D/g, '')}`} 
                        className="px-4 py-2 rounded-lg font-grotesk font-semibold inline-flex items-center gap-1.5 border border-[var(--border-default)] text-[var(--text-secondary)] hover:border-blue-500 hover:text-white"
                      >
                        📞 Ligar
                      </a>
                    ) : (
                      <button 
                        type="button"
                        onClick={() => toast.info('Esta empresa não possui telefone cadastrado no Google Maps.')}
                        className="px-4 py-2 rounded-lg font-grotesk font-semibold inline-flex items-center gap-1.5 border border-[var(--border-default)] text-zinc-600 cursor-not-allowed opacity-50"
                      >
                        📞 Sem Telefone
                      </button>
                    )}
                    {l.instagramUrl ? (
                      <a 
                        href={l.instagramUrl} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="px-4 py-2 rounded-lg font-grotesk font-semibold inline-flex items-center gap-1.5 border border-[var(--border-default)] text-[var(--text-secondary)] hover:border-pink-500 hover:text-white"
                      >
                        📸 Instagram
                      </a>
                    ) : (
                      <button 
                        type="button"
                        onClick={() => toast.info('Esta empresa não possui Instagram cadastrado no Google Maps.')}
                        className="px-4 py-2 rounded-lg font-grotesk font-semibold inline-flex items-center gap-1.5 border border-[var(--border-default)] text-zinc-600 cursor-not-allowed opacity-50"
                      >
                        📸 Sem Instagram
                      </button>
                    )}
                  </div>
                </div>

                {/* Score Circular lateral */}
                <div className="shrink-0 flex flex-col items-center justify-center p-3 rounded-xl border border-[var(--border-default)] md:w-32 bg-[var(--bg-primary)]">
                  <span className="text-[10px] uppercase font-bold tracking-wider" style={{ color: 'var(--text-muted)' }}>Score</span>
                  <span className="font-jet font-bold text-3xl mt-1" style={{ color: l.tier === 'hot' ? 'var(--purple-soft)' : 'var(--warning)' }}>
                    {l.score}
                  </span>
                  <TierBadge tier={l.tier} />
                </div>
              </div>
            ))}
          </div>

          {results.length < totalResults && (
            <div className="flex justify-center pt-4">
              <button
                type="button"
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="lz-btn-secondary py-3 px-6 text-sm font-grotesk font-bold inline-flex items-center justify-center gap-2 border-[var(--purple-border)] text-[var(--purple-soft)] hover:text-white hover:border-[var(--purple-core)] transition-all rounded-xl w-full"
                style={{ background: 'rgba(124,58,237,0.03)' }}
              >
                {loadingMore ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Carregando mais...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw size={16} />
                    <span>Carregar mais 5 empresas ({results.length}/{totalResults})</span>
                  </>
                )}
              </button>
            </div>
          )}
        </motion.div>
      )}

      {/* Modal Estilo Competidor (Fotos 1 & 3) */}
      <AnimatePresence>
        {selectedLead && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 z-50 flex items-center justify-center p-4" 
            style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
            onClick={() => setSelectedLead(null)}
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }} 
              animate={{ scale: 1, y: 0 }} 
              exit={{ scale: 0.95, opacity: 0 }} 
              onClick={(e) => e.stopPropagation()} 
              className="w-full max-w-lg p-6 relative max-h-[90vh] overflow-y-auto scrollbar-none" 
              style={{ 
                background: 'rgba(10,10,20,0.96)', 
                backdropFilter: 'blur(24px)', 
                border: '1px solid rgba(124,58,237,0.25)', 
                borderRadius: 18,
                boxShadow: '0 30px 60px rgba(0,0,0,0.8), 0 0 50px rgba(124,58,237,0.08)'
              }}
            >
              <button 
                onClick={() => setSelectedLead(null)} 
                className="absolute top-4 right-4" 
                style={{ color: 'var(--text-muted)' }}
              >
                <X size={20} />
              </button>

              {/* Title Header */}
              <div className="mb-4">
                <h3 className="font-grotesk text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                  {selectedLead.businessName}
                </h3>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  📍 {selectedLead.city}
                </p>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-[var(--border-default)] mb-4">
                <button
                  onClick={() => { setActiveTab('whatsapp'); loadMessageText(selectedLead, selectedTone, messageVariant) }}
                  className="flex-1 py-2 text-xs font-grotesk font-bold transition-colors"
                  style={{
                    color: activeTab === 'whatsapp' ? 'var(--purple-soft)' : 'var(--text-secondary)',
                    borderBottom: activeTab === 'whatsapp' ? '2px solid var(--purple-core)' : 'none'
                  }}
                >
                  💬 Abordagem WhatsApp
                </button>
                <button
                  onClick={() => { setActiveTab('auditoria'); loadAuditText(selectedLead) }}
                  className="flex-1 py-2 text-xs font-grotesk font-bold transition-colors"
                  style={{
                    color: activeTab === 'auditoria' ? 'var(--purple-soft)' : 'var(--text-secondary)',
                    borderBottom: activeTab === 'auditoria' ? '2px solid var(--purple-core)' : 'none'
                  }}
                >
                  📋 Auditoria Comercial
                </button>
              </div>

              {/* Tab 1: Auditoria Comercial */}
              {activeTab === 'auditoria' && (
                <div className="space-y-4">
                  {/* Status do Lead */}
                  <div className="flex items-center justify-between p-3 rounded-lg border border-[var(--border-default)]" style={{ background: 'var(--bg-elevated)' }}>
                    <span className="text-xs font-grotesk font-semibold" style={{ color: 'var(--text-secondary)' }}>Status do Lead:</span>
                    <select 
                      value={selectedLead.status} 
                      onChange={(e) => updateStatus(e.target.value)} 
                      disabled={updatingStatus} 
                      className="lz-input !py-1.5 !px-3 text-xs w-[160px] cursor-pointer"
                    >
                      <option value="novo" style={{ background: '#0d0d1a' }}>Novo Lead</option>
                      <option value="mensagem_gerada" style={{ background: '#0d0d1a' }}>Mensagem Criada</option>
                      <option value="enviado" style={{ background: '#0d0d1a' }}>Abordagem Enviada</option>
                      <option value="respondeu" style={{ background: '#0d0d1a' }}>Cliente Respondeu</option>
                      <option value="venda_fechada" style={{ background: '#0d0d1a' }}>Venda Fechada</option>
                      <option value="ignorado" style={{ background: '#0d0d1a' }}>Ignorar Lead</option>
                    </select>
                  </div>

                  {/* Ficha Google Maps e Ranking */}
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-lg border border-[var(--border-default)]" style={{ background: 'var(--bg-primary)' }}>
                      <p className="text-[10px] uppercase font-bold" style={{ color: 'var(--text-muted)' }}>Meu Negócio</p>
                      <p className="font-semibold mt-1" style={{ color: selectedLead.gmbOptimized ? 'var(--success)' : 'var(--warning)' }}>
                        {selectedLead.gmbOptimized ? '✓ Ficha Otimizada' : '⚠ Sem Otimização'}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg border border-[var(--border-default)]" style={{ background: 'var(--bg-primary)' }}>
                      <p className="text-[10px] uppercase font-bold" style={{ color: 'var(--text-muted)' }}>Presença Busca</p>
                      <p className="font-semibold mt-1" style={{ color: selectedLead.inTopGoogle ? 'var(--success)' : 'var(--danger)' }}>
                        {selectedLead.inTopGoogle ? '✓ Primeiras Posições' : '⚠ Fora do Topo'}
                      </p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-grotesk text-sm font-bold mb-2 uppercase tracking-wide" style={{ color: 'var(--purple-soft)' }}>
                      Análise de Proposta de Serviços
                    </h4>
                    {auditLoading ? (
                      <div className="space-y-2">
                        <div className="h-4 rounded skeleton-shimmer w-full" />
                        <div className="h-4 rounded skeleton-shimmer w-5/6" />
                        <div className="h-4 rounded skeleton-shimmer w-4/5" />
                      </div>
                    ) : (
                      <div 
                        className="p-4 rounded-lg text-sm leading-relaxed border border-[rgba(124,58,237,0.15)] max-h-[220px] overflow-y-auto"
                        style={{ background: 'rgba(7,7,15,0.5)', color: 'var(--text-secondary)' }}
                      >
                        {auditText.split('\n\n').map((para, idx) => (
                          <p key={idx} className="mb-2 last:mb-0">{para}</p>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Tab 2: Abordagem WhatsApp (Foto 1 do Competidor) */}
              {activeTab === 'whatsapp' && (
                <div className="space-y-4">
                  {/* Telefone do Cliente */}
                  <div>
                    <span className="block text-xs font-grotesk font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>
                      • Telefone do Cliente
                    </span>
                    <div className="flex gap-2 items-center">
                      <span className="font-jet font-bold text-lg tracking-wider" style={{ color: selectedLead.phone ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                        {selectedLead.phone || 'Não Cadastrado'}
                      </span>
                      {selectedLead.phone && (
                        <button 
                          onClick={() => copyToClipboard(selectedLead.phone, 'Telefone copiado!')}
                          className="lz-btn-secondary !py-1 !px-3 text-xs ml-auto inline-flex items-center gap-1"
                        >
                          <Copy size={12} /> Copiar número
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Tom da Mensagem */}
                  <div>
                    <span className="block text-xs font-grotesk font-bold uppercase tracking-wider mb-2.5" style={{ color: 'var(--text-secondary)' }}>
                      • Tom da Mensagem
                    </span>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => handleToneChange('casual')}
                        className="p-3 rounded-xl border text-center flex flex-col items-center justify-center gap-1 transition-all"
                        style={{
                          borderColor: selectedTone === 'casual' ? 'var(--purple-core)' : 'var(--border-default)',
                          background: selectedTone === 'casual' ? 'var(--bg-elevated)' : 'transparent'
                        }}
                      >
                        <Smile size={16} style={{ color: selectedTone === 'casual' ? 'var(--purple-soft)' : 'var(--text-muted)' }} />
                        <span className="text-xs font-bold font-grotesk" style={{ color: selectedTone === 'casual' ? 'var(--text-primary)' : 'var(--text-secondary)' }}>Casual</span>
                        <span className="text-[9px]" style={{ color: 'var(--text-muted)' }}>Leve e amigável</span>
                      </button>
                      
                      <button
                        onClick={() => handleToneChange('profissional')}
                        className="p-3 rounded-xl border text-center flex flex-col items-center justify-center gap-1 transition-all"
                        style={{
                          borderColor: selectedTone === 'profissional' ? 'var(--purple-core)' : 'var(--border-default)',
                          background: selectedTone === 'profissional' ? 'var(--bg-elevated)' : 'transparent'
                        }}
                      >
                        <Briefcase size={16} style={{ color: selectedTone === 'profissional' ? 'var(--purple-soft)' : 'var(--text-muted)' }} />
                        <span className="text-xs font-bold font-grotesk" style={{ color: selectedTone === 'profissional' ? 'var(--text-primary)' : 'var(--text-secondary)' }}>Profissional</span>
                        <span className="text-[9px]" style={{ color: 'var(--text-muted)' }}>Formal e sério</span>
                      </button>

                      <button
                        onClick={() => handleToneChange('direto')}
                        className="p-3 rounded-xl border text-center flex flex-col items-center justify-center gap-1 transition-all"
                        style={{
                          borderColor: selectedTone === 'direto' ? 'var(--purple-core)' : 'var(--border-default)',
                          background: selectedTone === 'direto' ? 'var(--bg-elevated)' : 'transparent'
                        }}
                      >
                        <Target size={16} style={{ color: selectedTone === 'direto' ? 'var(--purple-soft)' : 'var(--text-muted)' }} />
                        <span className="text-xs font-bold font-grotesk" style={{ color: selectedTone === 'direto' ? 'var(--text-primary)' : 'var(--text-secondary)' }}>Direto</span>
                        <span className="text-[9px]" style={{ color: 'var(--text-muted)' }}>Objetivo e rápido</span>
                      </button>
                    </div>
                  </div>

                  {/* Modelo de Mensagem / Outro Modelo */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-grotesk font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                        • Modelo de Mensagem
                      </span>
                      <button 
                        onClick={handleNextVariant}
                        disabled={messageLoading}
                        className="lz-btn-secondary !py-1 !px-3 text-xs inline-flex items-center gap-1.5 transition-colors"
                        style={{ borderColor: 'var(--purple-border)', color: 'var(--purple-soft)' }}
                      >
                        <RefreshCw size={12} className={messageLoading ? 'animate-spin' : ''} />
                        <span>Outro modelo {messageVariant}/5</span>
                      </button>
                    </div>

                    {/* Preview Box */}
                    <div className="relative">
                      {messageLoading ? (
                        <div className="p-4 rounded-xl border border-[var(--border-default)] min-h-[120px] flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
                          <Loader2 size={24} className="animate-spin text-[var(--purple-soft)]" />
                        </div>
                      ) : (
                        <div className="relative">
                          <textarea
                            value={messageText}
                            onChange={(e) => setMessageText(e.target.value)}
                            className={`w-full p-4 rounded-xl border min-h-[120px] text-sm focus:border-[var(--purple-core)] outline-none resize-none font-inter leading-relaxed transition-all duration-300 ${
                              isGlowGold ? 'border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.55)]' : 'border-[var(--border-default)]'
                            }`}
                            style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                          />
                          <button
                            onClick={() => copyToClipboard(messageText, 'Mensagem copiada!')}
                            className="absolute bottom-3 right-3 p-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[var(--text-secondary)] hover:text-white"
                          >
                            <Copy size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Botões de Ação Principais no Rodapé */}
              <div className="flex gap-3 mt-6 border-t border-[var(--border-default)] pt-4">
                <button 
                  onClick={() => {
                    if (!selectedLead.phone) {
                      toast.info("Esta empresa não possui telefone cadastrado no Google Maps.")
                      return
                    }
                    const num = (selectedLead.phone ?? '').replace(/\D/g, '')
                    window.open(`https://wa.me/55${num}?text=${encodeURIComponent(messageText)}`, '_blank')
                    updateStatus('enviado')
                  }}
                  disabled={!messageText || messageLoading || !selectedLead.phone}
                  className={`lz-btn-primary flex-1 inline-flex items-center justify-center gap-2 text-sm py-3 ${
                    !selectedLead.phone ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  style={{ background: selectedLead.phone ? 'var(--success)' : 'rgba(255, 255, 255, 0.05)', color: selectedLead.phone ? '#fff' : 'var(--text-muted)', boxShadow: 'none' }}
                >
                  <MessageSquare size={16} /> {selectedLead.phone ? 'Abrir WhatsApp' : 'WhatsApp Indisponível'}
                </button>
                <button 
                  onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedLead.businessName + ' ' + selectedLead.city)}`, '_blank')} 
                  className="lz-btn-secondary flex-1 inline-flex items-center justify-center gap-2 text-sm"
                >
                  <ExternalLink size={16} /> Ver no Maps
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Venda Fechada Modal (Section 3) */}
      <AnimatePresence>
        {showSaleModal && (
          <>
            <ConfettiExplosion />
            <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
              <motion.div
                initial={{ scale: 0.9, y: 30 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="w-full max-w-md p-6 text-center rounded-2xl border border-[rgba(139,92,246,0.4)] relative"
                style={{
                  background: 'rgba(10,10,24,0.98)',
                  boxShadow: '0 30px 80px rgba(0,0,0,0.95), 0 0 60px rgba(139,92,246,0.2)'
                }}
              >
                <div className="h-16 w-16 mx-auto rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-4 text-glow animate-bounce">
                  <Award size={36} />
                </div>
                
                <h3 className="font-grotesk text-2xl font-bold text-white tracking-tight">
                  🎉 VENDA FECHADA!
                </h3>
                <p className="text-sm font-semibold text-[var(--purple-soft)] mt-1 tracking-wider uppercase animate-pulse">
                  Você é incrível!
                </p>

                {/* Animated Equalizer Wave */}
                <SoundWaveAnimation />

                <p className="text-xs text-zinc-400 leading-relaxed mb-6">
                  Parabéns por fechar mais um cliente! O faturamento correspondente foi adicionado ao seu painel principal e computado no ranking. Continue prospectando e domine o mercado!
                </p>

                <button
                  onClick={() => setShowSaleModal(false)}
                  className="lz-btn-primary w-full py-3 text-xs uppercase font-bold tracking-widest bg-gradient-to-r from-emerald-500 to-teal-600 border-emerald-400 text-black hover:from-emerald-400 hover:to-teal-500"
                >
                  Continuar Prospectando 🚀
                </button>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
      
      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

function ConfettiExplosion() {
  const [particles, setParticles] = useState<any[]>([])
  useEffect(() => {
    const list = []
    const colors = ['#8b5cf6', '#a78bfa', '#f59e0b', '#d946ef', '#10b981']
    for (let i = 0; i < 60; i++) {
      list.push({
        id: i,
        x: Math.random() * 100, // percentage width
        y: Math.random() * 50 + 100,
        size: Math.random() * 8 + 6,
        color: colors[Math.floor(Math.random() * colors.length)],
        delay: Math.random() * 0.5,
        duration: Math.random() * 1.5 + 1.5,
        angle: Math.random() * 360,
        drift: Math.random() * 40 - 20
      })
    }
    setParticles(list)
  }, [])

  return (
    <div className="fixed inset-0 pointer-events-none z-[99999] overflow-hidden">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ y: '100vh', x: `${p.x}vw`, rotate: 0, opacity: 1 }}
          animate={{ 
            y: '-10vh', 
            x: `${p.x + p.drift}vw`,
            rotate: p.angle + 360,
            opacity: [1, 1, 0]
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            ease: 'easeOut'
          }}
          className="absolute rounded-sm"
          style={{
            width: p.size,
            height: p.size,
            background: p.color,
            borderRadius: p.id % 2 === 0 ? '50%' : '2px'
          }}
        />
      ))}
    </div>
  )
}

function SoundWaveAnimation() {
  return (
    <div className="flex items-end justify-center gap-1.5 h-16 my-6">
      {[...Array(12)].map((_, i) => (
        <motion.span
          key={i}
          animate={{ height: [12, 56, 12] }}
          transition={{
            duration: 0.6 + Math.random() * 0.4,
            repeat: Infinity,
            delay: i * 0.05
          }}
          className="w-1.5 rounded-full bg-gradient-to-t from-[var(--purple-core)] to-[#f59e0b]"
        />
      ))}
    </div>
  )
}

