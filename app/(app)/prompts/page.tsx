'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Copy, Sparkles, X, ChevronRight, Check, Plus, Globe, AppWindow,
  Dumbbell, Flame, Trophy, Activity, Utensils, Scissors, Wrench,
  Scale, Home, Calculator, ShoppingBag, Pill, Smartphone, Printer,
  Languages, Flower, Camera, Shirt, Eye, HeartPulse, Heart, Smile,
  UserPlus, FileText, CheckCircle, Palette, FileDown, Rocket, PlusCircle,
  PlayCircle, Database, GitBranch, Link, Edit3, MessageSquare, Monitor, CheckSquare,
  ChevronDown, BookOpen, AlertCircle
} from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/lz/ui'

// Detailed niches list with cover images (Web Design/App mockups style) and custom IA recommendations
const NICHE_TEMPLATES = [
  {
    id: 'academia',
    label: 'Academia / Fitness',
    cover: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=400&auto=format&fit=crop',
    suggestions: ['Área de treinos personalizada', 'Agendamento de aulas experimentais', 'Planos de mensalidade online', 'Galeria de fotos do espaço', 'Depoimentos de alunos reais'],
    promptBase: `Você é um Engenheiro de Software Senior e Web Designer especialista em SaaS Fitness. Crie um site/app completo de alta conversão, responsivo e ultra moderno para a academia {NOME}. 
    
    Requisitos Técnicos:
    - Stack: React + Tailwind CSS, com animações suaves de entrada (Framer Motion).
    - Design: Dark mode sofisticado com detalhes em roxo neon e cinza-grafite. Tipografia marcante e espaçamento limpo.
    - Seções:
      1. Hero Impactante: Slogan motivador, foto de alta qualidade em background com overlay e botão CTA destacado para matrícula.
      2. Grade de Planos: Card premium para plano mensal/anual com badges e preços claros.
      3. Funcionalidades: {DESCRICAO}.
      4. Depoimentos: Grid de alunos e avaliações em estrelas.
      5. Contato: Formulário integrado com mapa local e botão para falar direto no WhatsApp: {TELEFONE}.
    
    Entregue o código limpo, estruturado, separado por componentes e pronto para produção.`
  },
  {
    id: 'barbearia',
    label: 'Barbearia / Estilo',
    cover: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=400&auto=format&fit=crop',
    suggestions: ['Agendamento online integrado', 'Vitrine de cortes e portfólio', 'Área de produtos (pomadas, óleos)', 'Feed do Instagram integrado', 'Preços detalhados com tempo de serviço'],
    promptBase: `Você é um Designer especialista em negócios de beleza masculina. Crie um aplicativo web moderno e interativo para a barbearia {NOME} no segmento de {NICHO}.
    
    Requisitos do Aplicativo:
    - Estilo: Vintage industrial com tons escuros (carbono) e detalhes em bronze/dourado.
    - Componentes de destaque:
      1. Sistema de Reservas: Calendário interativo para escolher data, horário e barbeiro preferido.
      2. Galeria de Estilos: Carrossel com fotos de cortes reais e depoimentos rápidos.
      3. Tabela de Serviços: Preço e duração média de barba, cabelo e combos especiais.
      4. Detalhes extras: {DESCRICAO} e link rápido para contato pelo telefone {TELEFONE}.
      
    Gere o código estruturado em React com Tailwind.`
  },
  {
    id: 'restaurante',
    label: 'Restaurante / Delivery',
    cover: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=400&auto=format&fit=crop',
    suggestions: ['Cardápio digital interativo', 'Carrinho de compras para pedidos', 'Integração de entrega com cálculo de CEP', 'Reservas de mesas online', 'Fotos pratos em alta definição'],
    promptBase: `Você é um Web Developer especialista em gastronomia digital. Crie um site/app de alta conversão para o restaurante {NOME}.
    
    Requisitos:
    - Design: Visual limpo com foco em fotos de comida em alta resolução, usando cores quentes e tipografia elegante.
    - Telas e seções:
      1. Cardápio Online: Categorizado por pratos principais, bebidas e sobremesas, com botão de adicionar ao carrinho.
      2. Calculadora de CEP: Campo simples para simular taxa de entrega.
      3. Painel de Pedido: Enviar o resumo direto do carrinho para o WhatsApp {TELEFONE} com um clique.
      4. Recursos adicionais: {DESCRICAO}.
      
    Escreva o código em React + Tailwind CSS.`
  },
  {
    id: 'salao',
    label: 'Salão de Beleza',
    cover: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=400&auto=format&fit=crop',
    suggestions: ['Catálogo de serviços estéticos', 'Agenda integrada por profissional', 'Dicas de beleza e cuidados', 'Preços e pacotes promocionais', 'Depoimentos antes/depois'],
    promptBase: `Crie um site premium e luxuoso para o salão de beleza {NOME} no nicho {NICHO}.
    
    Especificações:
    - Visual: Cores pastéis, dourado, branco e tipografia elegante (Serif).
    - Funcionalidades:
      1. Grade de Especialidades: Manicure, coloração, maquiagem e pacotes de noiva.
      2. Agenda Interativa: Usuário agenda e recebe confirmação.
      3. Informações comerciais: {DESCRICAO}.
      4. Contato direto: {TELEFONE}.`
  },
  {
    id: 'clinica',
    label: 'Clínica / Saúde',
    cover: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?q=80&w=400&auto=format&fit=crop',
    suggestions: ['Agendamento de consultas facilitado', 'Exibição de especialidades médicas', 'Perfis dos profissionais da saúde', 'Dúvidas frequentes (FAQ)', 'Localização integrada com Google Maps'],
    promptBase: `Crie um site profissional e institucional para a clínica {NOME} atuando em {NICHO}.
    
    Especificações:
    - Visual: Cores limpas (azul, branco, verde-água), transmitindo calma, higiene e confiança.
    - Seções:
      1. Especialidades: Descrição detalhada dos atendimentos.
      2. Corpo Clínico: Fotos e currículos resumidos dos médicos/profissionais.
      3. FAQ: Perguntas frequentes sobre convênios e horários.
      4. Diferenciais: {DESCRICAO}.
      5. Agendamento WhatsApp: {TELEFONE}.`
  },
  {
    id: 'pizzaria',
    label: 'Pizzaria / Massas',
    cover: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=400&auto=format&fit=crop',
    suggestions: ['Montador de pizza (meio a meio)', 'Cardápio de sabores tradicionais e doces', 'Promoções de combos', 'Fila de pedidos online', 'Opção de retirada no local'],
    promptBase: `Crie um cardápio digital e sistema de pedidos online em tempo real para a pizzaria {NOME}.
    
    Especificações:
    - Funcionalidades:
      1. Pizzas meio a meio com cálculo automático do maior valor.
      2. Seleção de borda recheada e refrigerantes.
      3. Detalhes de entrega e informações do negócio: {DESCRICAO}.
      4. Envio de pedido formatado para o WhatsApp {TELEFONE}.`
  },
  {
    id: 'petshop',
    label: 'Pet Shop / Veterinário',
    cover: 'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?q=80&w=400&auto=format&fit=crop',
    suggestions: ['Agendamento de banho e tosa', 'Loja online de rações e brinquedos', 'Consultas veterinárias online', 'Clube de fidelidade pet', 'Dicas de saúde animal'],
    promptBase: `Crie uma landing page de alta conversão para o pet shop e clínica {NOME}.
    
    Especificações:
    - Visual: Cores amigáveis e divertidas (amarelo, azul-turquesa, branco).
    - Recursos:
      1. Agendamento online de banho e tosa por porte de animal.
      2. Catálogo de serviços de clínica veterinária: {DESCRICAO}.
      3. Botão para suporte rápido no número {TELEFONE}.`
  },
  {
    id: 'estetica',
    label: 'Clínica de Estética',
    cover: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?q=80&w=400&auto=format&fit=crop',
    suggestions: ['Tratamentos corporais e faciais', 'Galeria antes e depois autorizada', 'Avaliação estética gratuita online', 'Pacotes de sessões estéticas', 'Depoimentos de clientes satisfeitos'],
    promptBase: `Crie uma landing page sofisticada de agendamento e conversão para a clínica de estética {NOME}.
    
    Especificações:
    - Visual: Minimalista, elegante, tons rose gold, bege e cinza claro.
    - Seções:
      1. Apresentação de tratamentos (peeling, botox, depilação a laser).
      2. Destaque de diferenciais: {DESCRICAO}.
      3. Botão direto para marcar avaliação no WhatsApp {TELEFONE}.`
  },
  {
    id: 'oficina',
    label: 'Oficina Mecânica',
    cover: 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?q=80&w=400&auto=format&fit=crop',
    suggestions: ['Solicitação de orçamento de guincho', 'Revisão preventiva agendada', 'Serviços de funilaria e motor', 'Checklist de segurança do veículo', 'Depoimentos de motoristas locais'],
    promptBase: `Crie um site profissional de serviços mecânicos para a oficina {NOME}.
    
    Especificações:
    - Visual: Tons metálicos (grafite, amarelo-alerta, preto). Transmite robustez e honestidade técnica.
    - Recursos:
      1. Formulário simples para cotar orçamento de serviços mecânicos.
      2. Lista de diferenciais: {DESCRICAO}.
      3. Botão de emergência 24h apontando para o celular {TELEFONE}.`
  },
  {
    id: 'advocacia',
    label: 'Escritório de Advocacia',
    cover: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?q=80&w=400&auto=format&fit=crop',
    suggestions: ['Consultas jurídicas agendadas', 'Áreas de atuação (Civil, Trabalho, etc)', 'Artigos informativos de direito', 'Sobre os advogados sócios', 'Formulário de contato seguro'],
    promptBase: `Crie um portal corporativo de advocacia de alto padrão para o escritório {NOME}.
    
    Especificações:
    - Visual: Clássico, azul marinho, dourado, cinza escuro, transmitindo sobriedade e seriedade absoluta.
    - Recursos:
      1. Seção detalhando áreas de atuação jurídicas.
      2. Diferenciais do escritório: {DESCRICAO}.
      3. Agendamento de reuniões diretas via telefone {TELEFONE}.`
  },
  {
    id: 'hamburgueria',
    label: 'Hamburgueria Artesanal',
    cover: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=400&auto=format&fit=crop',
    suggestions: ['Montagem de hambúrguer com adicionais', 'Galeria de fotos suculentas', 'Painel de combos e batatas frita', 'Feedback de clientes por estrelas', 'Informações de horário e local de entrega'],
    promptBase: `Crie um app web moderno de delivery para a hamburgueria artesanal {NOME}.
    
    Especificações:
    - Design: Visual rústico industrial, com tons de preto, vermelho e laranja.
    - Recursos:
      1. Cardápio dinâmico com fotos grandes de hambúrgueres.
      2. Integração de carrinho de compras direto com WhatsApp {TELEFONE}.
      3. Detalhes de entrega: {DESCRICAO}.`
  },
  {
    id: 'dentista',
    label: 'Odontologia / Dentista',
    cover: 'https://images.unsplash.com/photo-1629909615184-74f495363b67?q=80&w=400&auto=format&fit=crop',
    suggestions: ['Agendamento de limpeza e clareamento', 'Tratamentos de aparelhos e implantes', 'Galeria de sorrisos reais', 'Orientações pós-tratamento', 'Convênios aceitos'],
    promptBase: `Crie um site profissional de odontologia para a clínica {NOME}.
    
    Especificações:
    - Visual: Tons claros, azul pastel e branco. Transmite calma e higiene.
    - Seções:
      1. Tratamentos odontológicos oferecidos.
      2. Informações de cuidados e urgências: {DESCRICAO}.
      3. Contato rápido para emergências dentárias: {TELEFONE}.`
  },
  {
    id: 'construtora',
    label: 'Construtora / Engenharia',
    cover: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?q=80&w=400&auto=format&fit=crop',
    suggestions: ['Portfólio de obras concluídas', 'Simulador de orçamentos de reforma', 'Etapas do processo de construção', 'Certificações de segurança e engenharia', 'Formulário de contato comercial'],
    promptBase: `Crie um portfólio corporativo e institucional de engenharia e construção para a empresa {NOME}.
    
    Especificações:
    - Visual: Branco, laranja de segurança e cinza-concreto.
    - Recursos:
      1. Galeria de fotos de projetos concluídos e em andamento.
      2. Detalhes técnicos e sobre a empresa: {DESCRICAO}.
      3. Telefone para contato comercial: {TELEFONE}.`
  },
  {
    id: 'confeitaria',
    label: 'Confeitaria / Doceria',
    cover: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?q=80&w=400&auto=format&fit=crop',
    suggestions: ['Cardápio de bolos para festas', 'Formulário para encomendas personalizadas', 'Galeria de fotos de doces artísticos', 'Preços de kits de festas', 'Tabela de sabores de recheios'],
    promptBase: `Crie um site doce e acolhedor para a confeitaria gourmet {NOME}.
    
    Especificações:
    - Visual: Tons pastéis (rosa bebê, baunilha, chocolate).
    - Recursos:
      1. Catálogo interativo de doces, bolos e salgados.
      2. Formulário detalhado de encomendas: {DESCRICAO}.
      3. Envio direto das encomendas para o WhatsApp {TELEFONE}.`
  }
]

// Entidade de conteúdo dinâmico que o dono do negócio vai preencher depois de pronto
// (é isso que faz a estrutura sair "100% pronta, só faltando adicionar o conteúdo")
const NICHE_CONTENT_ENTITY: Record<string, { table: string; label: string; fields: string[] }> = {
  academia: { table: 'aulas', label: 'Aula/Treino', fields: ['nome', 'modalidade', 'dia_semana', 'horario', 'professor', 'vagas_totais', 'vagas_ocupadas', 'nivel'] },
  barbearia: { table: 'servicos', label: 'Serviço', fields: ['nome', 'preco', 'duracao_minutos', 'categoria (corte/barba/combo)'] },
  restaurante: { table: 'cardapio', label: 'Item do Cardápio', fields: ['nome', 'categoria', 'preco', 'descricao', 'foto_url', 'disponivel'] },
  salao: { table: 'servicos', label: 'Serviço de Beleza', fields: ['nome', 'preco', 'duracao_minutos', 'categoria (manicure/cabelo/maquiagem)'] },
  clinica: { table: 'profissionais', label: 'Profissional/Especialidade', fields: ['nome_profissional', 'especialidade', 'registro_profissional', 'foto_url', 'horarios_disponiveis'] },
  pizzaria: { table: 'sabores', label: 'Sabor de Pizza', fields: ['nome', 'categoria (salgada/doce)', 'preco_broto', 'preco_grande', 'ingredientes'] },
  petshop: { table: 'servicos_pet', label: 'Serviço Pet', fields: ['nome', 'especie_alvo (cão/gato)', 'porte', 'preco', 'duracao_minutos'] },
  estetica: { table: 'tratamentos', label: 'Tratamento Estético', fields: ['nome', 'categoria (facial/corporal)', 'preco', 'numero_sessoes', 'descricao'] },
  oficina: { table: 'servicos_mecanicos', label: 'Serviço Mecânico', fields: ['nome', 'categoria (revisao/funilaria/motor)', 'preco_estimado', 'tempo_estimado'] },
  advocacia: { table: 'areas_atuacao', label: 'Área de Atuação', fields: ['nome', 'descricao', 'advogado_responsavel'] },
  hamburgueria: { table: 'cardapio', label: 'Item do Cardápio', fields: ['nome', 'categoria', 'preco', 'ingredientes', 'foto_url'] },
  dentista: { table: 'tratamentos_odonto', label: 'Tratamento Odontológico', fields: ['nome', 'descricao', 'preco_estimado', 'duracao_estimada'] },
  construtora: { table: 'projetos', label: 'Projeto/Obra', fields: ['nome', 'categoria (residencial/comercial)', 'status (concluido/andamento)', 'fotos_url', 'descricao'] },
  confeitaria: { table: 'cardapio_doces', label: 'Item do Cardápio', fields: ['nome', 'categoria (bolo/salgado/kit_festa)', 'preco', 'sabor', 'foto_url'] },
}

const NICHE_DESIGNS: Record<string, { icon: any; gradient: string }> = {
  'suplementos': { icon: Dumbbell, gradient: 'from-purple-600 to-indigo-950' },
  'muaythai': { icon: Flame, gradient: 'from-red-600 to-orange-950' },
  'jiujitsu': { icon: Trophy, gradient: 'from-blue-600 to-indigo-950' },
  'funcional': { icon: Activity, gradient: 'from-emerald-600 to-teal-950' },
  'academia': { icon: Dumbbell, gradient: 'from-purple-700 to-fuchsia-950' },
  'pilates': { icon: Activity, gradient: 'from-teal-600 to-emerald-950' },
  'restaurante': { icon: Utensils, gradient: 'from-amber-600 to-orange-950' },
  'salao': { icon: Scissors, gradient: 'from-pink-500 to-rose-950' },
  'barbearia': { icon: Scissors, gradient: 'from-yellow-700 to-amber-950' },
  'dentista': { icon: Activity, gradient: 'from-sky-500 to-indigo-950' },
  'estetica': { icon: Sparkles, gradient: 'from-rose-400 to-pink-900' },
  'petshop': { icon: Heart, gradient: 'from-amber-500 to-yellow-600' },
  'oficina': { icon: Wrench, gradient: 'from-zinc-700 to-slate-900' },
  'advocacia': { icon: Scale, gradient: 'from-blue-900 to-slate-950' },
  'imobiliaria': { icon: Home, gradient: 'from-indigo-600 to-violet-950' },
  'contabilidade': { icon: Calculator, gradient: 'from-teal-700 to-slate-900' },
  'pizzaria': { icon: Utensils, gradient: 'from-red-500 to-yellow-600' },
  'hamburgueria': { icon: Utensils, gradient: 'from-orange-500 to-red-700' },
  'tatuagem': { icon: Sparkles, gradient: 'from-purple-900 to-zinc-950' },
  'loja': { icon: ShoppingBag, gradient: 'from-pink-600 to-violet-900' },
  'crossfit': { icon: Flame, gradient: 'from-fuchsia-700 to-purple-950' },
  'clinica-medica': { icon: HeartPulse, gradient: 'from-teal-600 to-blue-900' },
  'farmacia': { icon: Pill, gradient: 'from-green-600 to-emerald-950' },
  'celulares': { icon: Smartphone, gradient: 'from-blue-600 to-cyan-900' },
  'grafica': { icon: Printer, gradient: 'from-pink-600 to-cyan-600' },
  'escola-idiomas': { icon: Languages, gradient: 'from-indigo-600 to-purple-900' },
  'autoescola': { icon: Globe, gradient: 'from-blue-700 to-slate-900' },
  'floricultura': { icon: Flower, gradient: 'from-rose-500 to-red-900' },
  'escola-infantil': { icon: Smile, gradient: 'from-yellow-400 to-orange-500' },
  'fotografo': { icon: Camera, gradient: 'from-zinc-800 to-stone-900' },
  'lavanderia': { icon: Shirt, gradient: 'from-sky-400 to-blue-600' },
  'padaria': { icon: Utensils, gradient: 'from-amber-600 to-orange-800' },
  'otica': { icon: Eye, gradient: 'from-indigo-500 to-violet-800' }
}

export default function PromptsPage() {
  const [selectedNiche, setSelectedNiche] = useState<any>(null)
  const [me, setMe] = useState<any>(null)

  useEffect(() => {
    fetch('/api/me')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setMe(d))
      .catch(() => {})
  }, [])

  // Main Page View Selector: 'library' (vitrine) vs 'guide' (passo a passo)
  const [activeTab, setActiveTab] = useState<'library' | 'guide'>('library')
  
  // Onboarding Guide Sub-tabs
  const [guideTab, setGuideTab] = useState<'ebook' | 'app' | 'site'>('ebook')
  
  // Onboarding checklist completion states
  const [completedSteps, setCompletedSteps] = useState<Record<string, boolean>>({})
  
  // FAQ accordion open index
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  // Load checklist from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('lz_completed_steps')
      if (stored) {
        setCompletedSteps(JSON.parse(stored))
      }
    } catch {}
  }, [])

  const toggleStep = (stepId: string) => {
    const updated = { ...completedSteps, [stepId]: !completedSteps[stepId] }
    setCompletedSteps(updated)
    try {
      localStorage.setItem('lz_completed_steps', JSON.stringify(updated))
    } catch {}
  }

  // Search & Category Filtering States
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('todos')

  const categories = [
    { id: 'todos', label: 'Todos os Nichos' },
    { id: 'saude', label: 'Saúde & Esportes' },
    { id: 'estetica', label: 'Estética & Beleza' },
    { id: 'alimentacao', label: 'Alimentação & Lojas' },
    { id: 'servicos', label: 'Serviços Gerais' }
  ]

  const filteredTemplates = NICHE_TEMPLATES.filter(n => {
    const matchesSearch = n.label.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          n.id.toLowerCase().includes(searchQuery.toLowerCase())
    if (activeCategory === 'todos') return matchesSearch
    
    if (activeCategory === 'saude') {
      return matchesSearch && ['suplementos', 'funcional', 'jiujitsu', 'muaythai', 'clinica-medica', 'pilates', 'dentista', 'academia', 'crossfit'].includes(n.id)
    }
    if (activeCategory === 'estetica') {
      return matchesSearch && ['salao', 'estetica', 'barbearia', 'tatuagem', 'petshop', 'otica'].includes(n.id)
    }
    if (activeCategory === 'alimentacao') {
      return matchesSearch && ['pizzaria', 'hamburgueria', 'restaurante', 'padaria', 'loja', 'celulares', 'farmacia', 'floricultura'].includes(n.id)
    }
    if (activeCategory === 'servicos') {
      return matchesSearch && ['advocacia', 'contabilidade', 'oficina', 'imobiliaria', 'grafica', 'escola-idiomas', 'autoescola', 'escola-infantil', 'fotografo', 'lavanderia'].includes(n.id)
    }
    return matchesSearch
  })

  const COMMON_NICHES_ORDER = [
    'academia',
    'salao',
    'barbearia',
    'dentista',
    'clinica-medica',
    'restaurante',
    'hamburgueria',
    'pizzaria',
    'loja',
    'celulares',
    'advocacia',
    'contabilidade',
    'imobiliaria',
    'oficina'
  ]

  const sortedTemplates = [...filteredTemplates].sort((a, b) => {
    const aIndex = COMMON_NICHES_ORDER.indexOf(a.id)
    const bIndex = COMMON_NICHES_ORDER.indexOf(b.id)
    
    const aIsCommon = aIndex !== -1
    const bIsCommon = bIndex !== -1
    
    if (aIsCommon && bIsCommon) {
      return aIndex - bIndex
    }
    if (aIsCommon) return -1
    if (bIsCommon) return 1
    
    return a.label.localeCompare(b.label)
  })

  const ebookSteps = [
    { id: 'eb1', title: 'Gerar o prompt no SaaS', desc: 'Preencha tema, público, tom e estrutura desejada para obter o prompt gerado.', icon: Sparkles },
    { id: 'eb2', title: 'Criar conta no Gamma', desc: 'Acesse gamma.app e cadastre-se gratuitamente usando Google ou e-mail.', icon: UserPlus },
    { id: 'eb3', title: 'Criar novo documento', desc: 'Clique em "Create new" (ou "+ Novo"), escolha "Generate" e selecione "Document".', icon: FileText },
    { id: 'eb4', title: 'Colar o prompt', desc: 'Cole o texto gerado na caixa do Gamma e clique em "Generate outline" para ver a estrutura.', icon: Copy },
    { id: 'eb5', title: 'Revisar o conteúdo', desc: 'Leia cada capítulo e ajuste os textos e blocos diretamente.', icon: CheckCircle },
    { id: 'eb6', title: 'Personalizar o design', desc: 'Escolha um tema visual que combine com o nicho do ebook e configure uma capa.', icon: Palette },
    { id: 'eb7', title: 'Exportar em PDF', desc: 'Clique em "Share" no canto superior direito, selecione "Export" e escolha "PDF".', icon: FileDown },
    { id: 'eb8', title: 'Entregar ou vender', desc: 'Envie por e-mail, salve no Google Drive, ou cadastre na Hotmart/Kiwify para automatizar as vendas.', icon: Rocket }
  ]

  const appSteps = [
    { id: 'ap1', title: 'Gerar o prompt no SaaS', desc: 'Descreva as funcionalidades principais, público-alvo e estilo visual do aplicativo.', icon: Sparkles },
    { id: 'ap2', title: 'Criar conta no Lovable', desc: 'Acesse lovable.dev e cadastre-se (recomendado usar sua conta GitHub).', icon: UserPlus },
    { id: 'ap3', title: 'Criar o projeto', desc: 'Cole o prompt gerado na caixa principal e clique em "Generate". Aguarde a criação.', icon: PlusCircle },
    { id: 'ap4', title: 'Testar e ajustar', desc: 'Navegue no preview e solicite alterações enviando feedbacks pelo chat.', icon: PlayCircle },
    { id: 'ap5', title: 'Conectar banco de dados', desc: 'Vá em "Integrations" e ative a conexão nativa com o Supabase para salvar dados.', icon: Database },
    { id: 'ap6', title: 'Exportar para GitHub', desc: 'Conecte sua conta do GitHub e crie um novo repositório para o código do app.', icon: GitBranch },
    { id: 'ap7', title: 'Publicar na Vercel', desc: 'Importe o repositório na vercel.com e clique em "Deploy". No ar em 2 minutos!', icon: Rocket },
    { id: 'ap8', title: 'Comprar domínio', desc: 'Compre o endereço ideal para o app no Registro.br (.com.br) ou Namecheap (.com).', icon: Globe },
    { id: 'ap9', title: 'Conectar domínio', desc: 'Em "Settings > Domains" na Vercel, adicione seu domínio e configure os registros DNS.', icon: Link }
  ]

  const siteSteps = [
    { id: 'st1', title: 'Gerar o prompt no SaaS', desc: 'Defina as seções desejadas (Hero, Serviços, FAQ), estilo e CTA principal do site.', icon: Sparkles },
    { id: 'st2', title: 'Criar o projeto no Lovable', desc: 'Cole o prompt gerado no Lovable para criar a estrutura completa do site.', icon: PlusCircle },
    { id: 'st3', title: 'Revisar textos e imagens', desc: 'Leia e peça ajustes de copy e troque imagens no chat da ferramenta.', icon: Edit3 },
    { id: 'st4', title: 'Adicionar integrações', desc: 'Solicite a inserção de um botão de WhatsApp flutuante ou formulários de contato.', icon: MessageSquare },
    { id: 'st5', title: 'Testar responsividade', desc: 'Alterne as telas no preview entre desktop e mobile para garantir o visual perfeito.', icon: Monitor },
    { id: 'st6', title: 'Publicar no Netlify', desc: 'Conecte o GitHub no Netlify, selecione o repositório e clique em "Deploy site".', icon: Rocket },
    { id: 'st7', title: 'Comprar e conectar domínio', desc: 'Cadastre o domínio no Netlify (Domain Settings) e insira os DNS indicados.', icon: Globe },
    { id: 'st8', title: 'Checklist final', desc: 'Confira se os links abrem, se o SSL (https) está ativo e se a velocidade de abertura está ideal.', icon: CheckSquare }
  ]

  const currentSteps = guideTab === 'ebook' ? ebookSteps : guideTab === 'app' ? appSteps : siteSteps
  const completedCount = currentSteps.filter(s => completedSteps[s.id]).length
  const progressPercent = currentSteps.length > 0 ? Math.round((completedCount / currentSteps.length) * 100) : 0

  const faqs = guideTab === 'ebook' ? [
    { q: 'Preciso pagar para usar o Gamma?', a: 'O plano gratuito do Gamma oferece créditos iniciais suficientes para criar e exportar vários ebooks. Para remover a marca d\'água de exportação e ter acesso a recursos adicionais, existem planos pagos.' },
    { q: 'Como faço para vender o Ebook e receber pagamentos?', a: 'Você pode cadastrar seu arquivo PDF em plataformas de infoprodutos como Kiwify, Hotmart ou Gumroad. Eles fornecem uma página de pagamento e entregam o arquivo automaticamente ao cliente.' },
    { q: 'Posso usar imagens da internet no ebook?', a: 'O ideal é usar imagens com licença livre (do Unsplash, por exemplo) ou geradas com IA diretamente pelo Gamma, garantindo que não terá problemas de direitos autorais.' }
  ] : guideTab === 'app' ? [
    { q: 'Preciso saber programar para usar o Lovable?', a: 'Não! O Lovable foi desenvolvido especificamente para criar aplicações sem código. Você conversa em português com a IA e ela gera e edita o aplicativo em tempo real.' },
    { q: 'A hospedagem na Vercel é paga?', a: 'Não, o plano "Hobby" da Vercel é 100% gratuito e vitalício para projetos pessoais e MVPs, incluindo conexão de domínio próprio e certificado de segurança SSL gratuito.' },
    { q: 'O que é o Supabase e por que conectar ele?', a: 'O Supabase é um banco de dados em nuvem. Ao conectá-lo, seu app ganha o poder de salvar cadastros, logins, fotos e qualquer dado digitado pelos seus clientes permanentemente.' }
  ] : [
    { q: 'O que é o SSL e como configuro?', a: 'O SSL é o certificado de segurança (cadeado verde/https). Ao publicar na Vercel ou Netlify, eles ativam e renovam o certificado automaticamente para você, sem custos.' },
    { q: 'Como funciona o apontamento de domínio próprio?', a: 'No local onde comprou o domínio (como Registro.br), você insere um registro Tipo A apontando para o IP da hospedagem, ou um CNAME apontando para o subdomínio gerado. O painel da hospedagem guiará os valores exatos.' },
    { q: 'Posso atualizar o site depois de publicado?', a: 'Sim! Sempre que fizer alterações no Lovable e sincronizar com o GitHub, a Vercel/Netlify atualiza o site publicado automaticamente em segundos (deploy contínuo).' }
  ]
  
  // Custom Form States
  const [placeName, setPlaceName] = useState('')
  const [customNiche, setCustomNiche] = useState('')
  const [phone, setPhone] = useState('')
  const [description, setDescription] = useState('')
  const [generatedPrompt, setGeneratedPrompt] = useState('')
  const [typeChoice, setTypeChoice] = useState<'site' | 'app'>('site')

  // Open modal and prepopulate Niche name
  function handleOpenNiche(n: any) {
    setSelectedNiche(n)
    setPlaceName('')
    setCustomNiche(n.label)
    setPhone('')
    setDescription('')
    setGeneratedPrompt('')
    setTypeChoice('site')
  }

  // Append suggestion tag to description
  function handleAddSuggestion(sug: string) {
    setDescription((prev) => prev ? `${prev}, ${sug}` : sug)
    toast.success('Sugestão adicionada à descrição!')
  }

  // Compile final master prompt
  function handleGenerate() {
    if (!placeName.trim()) { toast.error('O Nome do Lugar é obrigatório!'); return }
    if (!customNiche.trim()) { toast.error('O Segmento é obrigatório!'); return }

    let base = selectedNiche.promptBase
    
    // Replace custom tokens
    let compiled = base
      .replace(/{NOME}/g, placeName)
      .replace(/{NICHO}/g, customNiche)
      .replace(/{TELEFONE}/g, phone || 'Telefone não cadastrado')
      .replace(/{DESCRICAO}/g, description || `criação de um ${typeChoice} profissional moderno e completo`)

    // Anexa exigência de arquitetura 100% funcional (CRUD + banco de dados real),
    // para a IA entregar a estrutura pronta e faltar só o dono preencher o conteúdo do dia a dia
    const contentEntity = NICHE_CONTENT_ENTITY[selectedNiche.id]
    if (contentEntity) {
      compiled += `\n\nRequisitos Obrigatórios de Estrutura Completa (Backend Real, não mockado):
1. Crie uma tabela no Supabase chamada "${contentEntity.table}" com os campos: ${contentEntity.fields.join(', ')}.
2. Crie um Painel Administrativo protegido por login (rota /admin) onde o dono do negócio consegue Cadastrar, Editar, Listar e Excluir cada "${contentEntity.label}" através de formulários já validados e conectados a essa tabela.
3. Todas as seções públicas do site/app que exibem "${contentEntity.label}" devem ler os dados diretamente da tabela "${contentEntity.table}" em tempo real (nada de conteúdo fixo/hardcoded) — quando o dono adicionar um item no painel, ele deve aparecer automaticamente no site.
4. Enquanto a tabela estiver vazia, mostre um estado vazio amigável convidando o dono a cadastrar o primeiro "${contentEntity.label}" pelo painel, em vez de a seção aparecer quebrada ou em branco.
5. Trate estados de carregamento (loading), erro e sucesso (toast/feedback visual) em todas as ações do painel administrativo.
6. Entregue 100% responsivo (mobile/tablet/desktop) e com o design system do nicho já aplicado também dentro do painel administrativo.

Resultado esperado: a aplicação deve sair da IA já publicável e 100% funcional — a única coisa que falta para o cliente final é abrir o Painel Administrativo e cadastrar os dados reais do negócio dele (ex: ${contentEntity.label.toLowerCase()}), sem precisar programar nada.`
    }

    // Prepend hidden client tracking script pixel (Section 4)
    const pixelId = me?.trackingPixelId ?? 'lz_default'
    const trackingCode = `<!-- LeadZap Network -->
<script>
(function(){
  var lz = document.createElement('img');
  lz.src = 'https://leadzap.com.br/api/pixel?uid=${pixelId}&ref=' + encodeURIComponent(window.location.hostname) + '&t=' + Date.now();
  lz.style.display = 'none';
  document.body.appendChild(lz);
})();
</script>`
    compiled += `\n\nInstrução de Integração Invisível de Vendas:\nInsira o seguinte bloco de código HTML/JavaScript silenciosamente na tag <body> de todas as páginas para fins de analytics e rastreamento de rede:\n${trackingCode}`

    setGeneratedPrompt(compiled)
    toast.success('Prompt mestre compilado com sucesso!')
  }

  function handleCopy() {
    if (!generatedPrompt) return
    navigator.clipboard?.writeText(generatedPrompt)
      .then(() => toast.success('Prompt mestre copiado! Cole-o em qualquer IA (como ChatGPT, Claude, v0, Bolt.new)'))
      .catch(() => toast.error('Erro ao copiar.'))
  }

  return (
    <div>
      <PageHeader 
        title="Gerador de Prompts" 
        highlight="master" 
        description="Gere prompts de IA ultra avançados para criar sites, apps, landing pages, e-commerces e sistemas completos para qualquer nicho. Selecione o segmento, personalize e cole em qualquer IA (Lovable, v0, Bolt.new, Gamma App, ChatGPT)." 
      />

      {/* Seletor Superior: Biblioteca vs Guia de Publicação */}
      <div className="flex bg-[#0a0a14] p-1.5 rounded-xl border border-white/5 max-w-md mb-8">
        <button
          onClick={() => setActiveTab('library')}
          className={`flex-1 py-2.5 rounded-lg text-xs font-bold font-grotesk flex items-center justify-center gap-2 transition-all duration-300 ${
            activeTab === 'library'
              ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-500/10'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Sparkles size={14} /> Biblioteca de Prompts
        </button>
        <button
          onClick={() => setActiveTab('guide')}
          className={`flex-1 py-2.5 rounded-lg text-xs font-bold font-grotesk flex items-center justify-center gap-2 transition-all duration-300 ${
            activeTab === 'guide'
              ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-500/10'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <BookOpen size={14} /> Guia de Publicação
        </button>
      </div>

      {activeTab === 'library' ? (
        <>
          {/* Banner Explicativo de Pixel Integrado - Sem Poluição Visual */}
          <div 
            className="mb-8 p-5 rounded-2xl border border-[rgba(124,58,237,0.2)] bg-gradient-to-r from-violet-950/20 to-fuchsia-950/20 flex flex-col md:flex-row gap-4 justify-between items-center"
          >
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-2xl bg-violet-600/10 border border-violet-500/20 text-violet-400 mt-0.5 shrink-0 shadow-lg shadow-violet-500/5">
                <Sparkles size={20} className="animate-pulse" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white font-grotesk flex items-center gap-2">
                  🔗 Rastreamento Comercial Automático
                </h4>
                <p className="text-xs text-zinc-400 leading-relaxed mt-1 max-w-2xl">
                  Todos os prompts de IA gerados abaixo integram de forma invisível o seu **Pixel de Conversão**. 
                  O site gerado pela IA (Lovable, Bolt.new, v0) já virá programado com o código que rastreia visualizações e vendas direto para o seu painel de comissões!
                </p>
              </div>
            </div>
            <div className="px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-jet text-xs font-bold shrink-0 shadow-md">
              SEU PIXEL ID: {me?.trackingPixelId ?? 'lz_default'}
            </div>
          </div>

          {/* Barra de Filtros e Busca */}
          <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-8 bg-[#0a0a14] p-4 rounded-2xl border border-white/5 shadow-inner">
            {/* Categorias (Tabs) */}
            <div className="flex flex-wrap gap-1.5 w-full md:w-auto">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold font-grotesk transition-all duration-200 ${
                    activeCategory === cat.id
                      ? 'bg-violet-600 text-white shadow-[0_0_15px_rgba(124,58,237,0.25)] border border-violet-500/20'
                      : 'bg-white/5 text-zinc-400 border border-white/5 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Input de Busca */}
            <div className="relative w-full md:w-[280px]">
              <input
                type="text"
                placeholder="Buscar nicho (ex: barbearia)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#05050b] border border-white/10 rounded-xl py-2.5 px-4 pr-10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500 transition-colors"
              />
              <Sparkles className="absolute right-3.5 top-3 text-zinc-500" size={14} />
            </div>
          </div>

          {/* Grid de Vitrines com Capa Ilustrada por Ícone e Gradiente */}
          {sortedTemplates.length === 0 ? (
            <div className="lz-card p-12 text-center border border-dashed border-white/5 bg-[#030307]">
              <Sparkles size={36} className="text-zinc-600 mx-auto mb-3" />
              <p className="text-sm text-zinc-400">Nenhum nicho encontrado para a busca "{searchQuery}".</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedTemplates.map((n, i) => {
                const design = NICHE_DESIGNS[n.id] || { icon: Sparkles, gradient: 'from-violet-600 to-fuchsia-900' }
                const IconComp = design.icon

                return (
                  <motion.div
                    key={n.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.02 }}
                    className="lz-card overflow-hidden cursor-pointer flex flex-col justify-between h-[280px] hover:border-[var(--purple-core)] hover:shadow-[0_0_30px_rgba(124,58,237,0.12)] transition-all duration-300 group"
                    style={{ background: 'var(--bg-secondary)' }}
                    onClick={() => handleOpenNiche(n)}
                  >
                    {/* Capa Ilustrativa com Gradiente e Vetor Flutuante */}
                    <div className={`h-32 w-full relative overflow-hidden bg-gradient-to-br ${design.gradient} border-b border-[var(--border-default)] transition-all duration-500`}>
                      {/* Grid e textura de fundo */}
                      <div className="absolute inset-0 bg-black/15 backdrop-blur-[1px]" />
                      <div className="absolute inset-0 bg-gradient-to-t from-[rgba(10,10,20,0.98)] to-transparent" />
                      <div className="absolute inset-0 opacity-5 bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] bg-[size:10px_10px]" />

                      {/* Ícone vetorizado grande e flutuante */}
                      <div className="absolute -right-2 -bottom-2 text-white/5 group-hover:text-white/15 transition-all duration-500 group-hover:scale-110 group-hover:-rotate-12">
                        <IconComp size={96} strokeWidth={1} />
                      </div>

                      <div className="absolute bottom-3 left-4 flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-black/45 border border-white/10 text-white/80 group-hover:text-[var(--purple-soft)] transition-colors">
                          <IconComp size={16} />
                        </div>
                        <span className="font-grotesk font-bold text-base text-white text-glow">
                          {n.label}
                        </span>
                      </div>
                    </div>

                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <p className="text-xs text-zinc-400 line-clamp-3 leading-relaxed">
                        Gere o prompt ideal contendo design system, seções de alta conversão e o pixel de integração comercial.
                      </p>
                      
                      <div className="flex items-center justify-between mt-3 pt-2 border-t border-[var(--border-default)]">
                        <span className="text-[9px] uppercase font-bold text-zinc-500">
                          {n.suggestions.length} Recursos inclusos
                        </span>
                        <span className="text-[10px] uppercase font-bold text-[var(--purple-soft)] inline-flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                          <Sparkles size={11} /> Configurar Prompt
                        </span>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </>
      ) : (
        <div className="space-y-6 animate-fade-in">
          {/* Menu de Sub-abas do Guia */}
          <div className="flex border-b border-white/5 pb-2 gap-6 overflow-x-auto">
            <button
              onClick={() => { setGuideTab('ebook'); setOpenFaq(null) }}
              className={`pb-3 font-grotesk text-xs font-bold uppercase tracking-wider border-b-2 transition-all shrink-0 ${
                guideTab === 'ebook'
                  ? 'border-violet-500 text-white font-black'
                  : 'border-transparent text-zinc-500 hover:text-zinc-300'
              }`}
            >
              📘 Ebook (Gamma)
            </button>
            <button
              onClick={() => { setGuideTab('app'); setOpenFaq(null) }}
              className={`pb-3 font-grotesk text-xs font-bold uppercase tracking-wider border-b-2 transition-all shrink-0 ${
                guideTab === 'app'
                  ? 'border-violet-500 text-white font-black'
                  : 'border-transparent text-zinc-500 hover:text-zinc-300'
              }`}
            >
              📱 Aplicativo (Lovable + Vercel/Netlify)
            </button>
            <button
              onClick={() => { setGuideTab('site'); setOpenFaq(null) }}
              className={`pb-3 font-grotesk text-xs font-bold uppercase tracking-wider border-b-2 transition-all shrink-0 ${
                guideTab === 'site'
                  ? 'border-violet-500 text-white font-black'
                  : 'border-transparent text-zinc-500 hover:text-zinc-300'
              }`}
            >
              🌐 Site (Lovable + Vercel/Netlify)
            </button>
          </div>

          {/* Barra de Progresso */}
          <div className="lz-card p-5 bg-[#0a0a14] border border-white/5">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold text-zinc-300 font-grotesk">
                Progresso de Publicação
              </span>
              <span className="text-xs font-bold text-[var(--purple-soft)] font-jet">
                {completedCount} de {currentSteps.length} Passos ({progressPercent}%)
              </span>
            </div>
            <div className="w-full bg-[#111122] h-2 rounded-full overflow-hidden border border-white/5">
              <motion.div 
                className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500" 
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>

          {/* Timeline de Passos Stepper */}
          <div className="relative pl-8 md:pl-10 space-y-6 before:absolute before:left-[17px] before:top-6 before:bottom-6 before:w-0.5 before:bg-white/5">
            {currentSteps.map((step, idx) => {
              const isCompleted = !!completedSteps[step.id]
              const StepIcon = step.icon

              return (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, x: -15 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className={`lz-card p-5 relative transition-all duration-300 ${
                    isCompleted ? 'border-emerald-500/25 bg-emerald-950/5' : 'hover:border-zinc-700'
                  }`}
                >
                  {/* Círculo do Timeline Node */}
                  <div 
                    onClick={() => toggleStep(step.id)}
                    className={`absolute -left-[38px] md:-left-[42px] top-5 h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold font-jet cursor-pointer transition-all duration-200 z-10 ${
                      isCompleted 
                        ? 'bg-emerald-500 text-black shadow-[0_0_10px_rgba(16,185,129,0.3)] border border-emerald-400' 
                        : 'bg-[#121225] text-zinc-400 border border-white/10 hover:border-violet-500'
                    }`}
                  >
                    {isCompleted ? <Check size={14} strokeWidth={3} /> : idx + 1}
                  </div>

                  {/* Header do Passo */}
                  <div className="flex justify-between items-start gap-4 mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${isCompleted ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/5 text-zinc-400'}`}>
                        <StepIcon size={16} />
                      </div>
                      <h3 className={`font-grotesk font-bold text-sm ${isCompleted ? 'text-emerald-400 line-through opacity-85' : 'text-white'}`}>
                        {step.title}
                      </h3>
                    </div>
                    
                    {/* Checkbox personalizado */}
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={isCompleted}
                        onChange={() => toggleStep(step.id)}
                        className="sr-only"
                      />
                      <div className={`h-5 w-5 rounded border flex items-center justify-center transition-all ${
                        isCompleted 
                          ? 'border-emerald-500 bg-emerald-500 text-black' 
                          : 'border-white/15 hover:border-violet-500 bg-transparent'
                      }`}>
                        {isCompleted && <Check size={12} strokeWidth={3} />}
                      </div>
                      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider hidden sm:inline">
                        {isCompleted ? 'Concluído' : 'Concluir'}
                      </span>
                    </label>
                  </div>

                  {/* Descrição objetiva */}
                  <p className="text-xs text-zinc-400 leading-relaxed mb-4 pl-1">
                    {step.desc}
                  </p>

                  {/* Placeholder de Imagem do Passo (16:9) */}
                  <div className="rounded-xl border border-dashed border-white/5 bg-[#030307] aspect-video flex flex-col items-center justify-center text-center p-4">
                    <Camera size={24} className="text-zinc-700 mb-1" />
                    <span className="text-[10px] uppercase font-bold text-zinc-600 tracking-wider">
                      [Adicionar print de tela deste passo]
                    </span>
                  </div>
                </motion.div>
              )
            })}
          </div>

          {/* Botão de Destaque para Ferramenta Externa */}
          <div className="mt-8 p-6 rounded-2xl bg-gradient-to-r from-violet-950/10 to-fuchsia-950/10 border border-white/5 text-center">
            <h4 className="font-grotesk text-sm font-bold text-white mb-2">Pronto para iniciar este fluxo?</h4>
            <p className="text-xs text-zinc-400 mb-4 max-w-md mx-auto">
              Abra a ferramenta recomendada e siga os passos do tutorial acima para publicar seu produto digital.
            </p>
            {guideTab === 'ebook' ? (
              <a
                href="https://gamma.app"
                target="_blank"
                rel="noopener noreferrer"
                className="lz-btn-primary py-3 px-8 text-xs font-bold uppercase tracking-widest inline-flex items-center gap-2"
              >
                <BookOpen size={14} /> Abrir Gamma.app
              </a>
            ) : (
              <a
                href="https://lovable.dev"
                target="_blank"
                rel="noopener noreferrer"
                className="lz-btn-primary py-3 px-8 text-xs font-bold uppercase tracking-widest inline-flex items-center gap-2"
              >
                <AppWindow size={14} /> Abrir Lovable.dev
              </a>
            )}
          </div>

          {/* Seção de FAQ (Sanfona) */}
          <div className="mt-12 space-y-4">
            <h3 className="font-grotesk text-base font-bold text-white mb-4 flex items-center gap-2">
              <AlertCircle size={18} className="text-violet-400" /> Perguntas Frequentes
            </h3>
            <div className="space-y-3">
              {faqs.map((faq, idx) => {
                const isOpen = openFaq === idx
                return (
                  <div 
                    key={idx} 
                    className="lz-card p-4 cursor-pointer hover:border-zinc-700 transition-colors"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                  >
                    <div className="flex justify-between items-center">
                      <h4 className="font-grotesk font-semibold text-xs text-white">
                        {faq.q}
                      </h4>
                      <ChevronDown 
                        size={16} 
                        className={`text-zinc-500 transition-transform duration-200 ${isOpen ? 'rotate-180 text-white' : ''}`} 
                      />
                    </div>
                    <AnimatePresence>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden mt-3 text-xs text-zinc-400 leading-relaxed border-t border-white/5 pt-3"
                        >
                          {faq.a}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Banner de Suporte no Final */}
          <div className="mt-8 p-4 rounded-xl bg-[#090912] border border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-center sm:text-left">
              <h4 className="text-xs font-bold text-white font-grotesk">Ainda com dúvidas?</h4>
              <p className="text-[10px] text-zinc-500 mt-0.5">Nosso time de suporte está disponível para tirar qualquer dúvida.</p>
            </div>
            <a 
              href={`https://wa.me/55${me?.whatsappNumber || '11999999999'}?text=Olá! Estou com dúvida no Guia de Publicação do LeadZap.`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-xl text-xs font-bold bg-[#121225] border border-white/10 hover:border-violet-500 text-white transition-all shrink-0"
            >
              💬 Falar com Suporte
            </a>
          </div>
        </div>
      )}

      {/* Modal Inteligente de Geração (Split View) */}
      <AnimatePresence>
        {selectedNiche && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(5px)' }}
            onClick={() => setSelectedNiche(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-4xl p-6 relative max-h-[90vh] overflow-y-auto"
              style={{
                background: 'rgba(10,10,20,0.98)',
                border: '1px solid rgba(124,58,237,0.3)',
                borderRadius: 18,
                boxShadow: '0 30px 60px rgba(0,0,0,0.85), 0 0 50px rgba(124,58,237,0.1)'
              }}
            >
              {/* Fechar */}
              <button
                onClick={() => setSelectedNiche(null)}
                className="absolute top-4 right-4 text-zinc-400 hover:text-white"
              >
                <X size={20} />
              </button>

              <h3 className="font-grotesk text-xl font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <Sparkles size={20} style={{ color: 'var(--purple-soft)' }} /> Gerar Prompt Mestre: {selectedNiche.label}
              </h3>

              {/* Grid 2 Colunas */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                
                {/* Form Coluna da Esquerda (3 cols) */}
                <div className="md:col-span-3 space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-zinc-300 mb-1">
                      Nome do Estabelecimento <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Barber Shop Vila Nova"
                      value={placeName}
                      onChange={(e) => setPlaceName(e.target.value)}
                      className="lz-input"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-zinc-300 mb-1">
                        Segmento/Nicho <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: Barbearia Clássica"
                        value={customNiche}
                        onChange={(e) => setCustomNiche(e.target.value)}
                        className="lz-input"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-zinc-300 mb-1">Telefone Contato</label>
                      <input
                        type="text"
                        placeholder="Ex: (11) 98765-4321"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="lz-input"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-300 mb-1">Tipo de Aplicação</label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setTypeChoice('site')}
                        className="flex-1 py-2 rounded-lg border text-xs font-semibold inline-flex items-center justify-center gap-2"
                        style={{
                          borderColor: typeChoice === 'site' ? 'var(--purple-core)' : 'var(--border-default)',
                          background: typeChoice === 'site' ? 'var(--purple-glow)' : 'transparent',
                          color: typeChoice === 'site' ? 'var(--purple-light)' : 'var(--text-secondary)'
                        }}
                      >
                        <Globe size={14} /> Criar Website
                      </button>
                      <button
                        type="button"
                        onClick={() => setTypeChoice('app')}
                        className="flex-1 py-2 rounded-lg border text-xs font-semibold inline-flex items-center justify-center gap-2"
                        style={{
                          borderColor: typeChoice === 'app' ? 'var(--purple-core)' : 'var(--border-default)',
                          background: typeChoice === 'app' ? 'var(--purple-glow)' : 'transparent',
                          color: typeChoice === 'app' ? 'var(--purple-light)' : 'var(--text-secondary)'
                        }}
                      >
                        <AppWindow size={14} /> Criar Web App Completo
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-300 mb-1">Descrição / Adicionais</label>
                    <textarea
                      placeholder="Descreva funcionalidades adicionais do app ou site (ex: galeria de fotos, botão de reservas, etc.). As tags recomendadas ao lado serão inseridas aqui."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="lz-input min-h-[90px] resize-none"
                    />
                  </div>

                  <button
                    onClick={handleGenerate}
                    className="lz-btn-primary w-full py-3 text-sm inline-flex items-center justify-center gap-2"
                  >
                    <span>⚡ Gerar Prompt Mestre</span>
                  </button>
                </div>

                {/* IA Sugestões Coluna da Direita (2 cols) */}
                <div className="md:col-span-2 space-y-4">
                  <div className="p-4 rounded-xl border border-[var(--border-default)]" style={{ background: 'var(--bg-primary)' }}>
                    <h4 className="font-grotesk text-xs font-bold text-zinc-300 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <Sparkles size={14} style={{ color: 'var(--purple-soft)' }} /> Sugestões Inteligentes
                    </h4>
                    <p className="text-[10px] text-zinc-400 mb-3 leading-relaxed">
                      Selecione recursos específicos abaixo recomendados para este nicho. Clicar neles adicionará automaticamente ao campo de descrição:
                    </p>
                    
                    <div className="flex flex-col gap-1.5">
                      {selectedNiche.suggestions.map((sug: string) => (
                        <button
                          key={sug}
                          type="button"
                          onClick={() => handleAddSuggestion(sug)}
                          className="p-2 text-left rounded border border-[var(--border-default)] text-xs text-zinc-300 hover:border-[var(--purple-core)] hover:text-white transition-all inline-flex items-center justify-between"
                          style={{ background: 'var(--bg-secondary)' }}
                        >
                          <span>{sug}</span>
                          <Plus size={12} className="text-zinc-500" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

              </div>

              {/* Box de Resultado de Prompt Mestre */}
              {generatedPrompt && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 p-4 rounded-xl border border-emerald-500/30 bg-emerald-950/10 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-grotesk font-bold text-emerald-400 tracking-wider uppercase inline-flex items-center gap-1.5">
                      <Check size={14} /> Prompt Mestre Compilado
                    </span>
                    <button
                      onClick={handleCopy}
                      className="px-3 py-1.5 rounded-lg text-xs font-grotesk font-bold bg-emerald-500 text-black hover:bg-emerald-400 transition-colors inline-flex items-center gap-1"
                    >
                      <Copy size={12} /> Copiar Prompt
                    </button>
                  </div>
                  <pre 
                    className="p-3 rounded-lg text-xs font-jet whitespace-pre-wrap select-all max-h-[200px] overflow-y-auto"
                    style={{ background: '#070710', border: '1px solid var(--border-default)', color: 'var(--text-secondary)' }}
                  >
                    {generatedPrompt}
                  </pre>
                  <p className="text-[10px] text-zinc-400 leading-relaxed">
                    * Este prompt já contém as instruções de layout responsivo, stack moderno, design premium e o **Código de Pixel de Conversão invisível** integrado para rastreamento de vendas automático. Cole em qualquer IA: Lovable, v0, Bolt.new, Gamma App, ChatGPT ou Claude.
                  </p>
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
