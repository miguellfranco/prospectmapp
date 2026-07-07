'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles, UserPlus, FileText, UploadCloud, CheckCircle, Palette, FileDown, Rocket,
  PlusCircle, PlayCircle, Database, GitBranch, Globe, Link as LinkIcon, MessageSquare,
  Monitor, CheckSquare, Check, ChevronDown, AlertCircle, BookOpen, AppWindow,
} from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/lz/ui'

type MockupKind = 'form' | 'input' | 'chat' | 'dashboard' | 'deploy' | 'settings' | 'checklist'

type Step = {
  id: string
  title: string
  desc: string
  icon: any
  mockup: MockupKind
}

const ebookSteps: Step[] = [
  { id: 'eb1', title: 'Gerar o prompt no SaaS', desc: 'Preencha tema, público-alvo, tom de voz e a estrutura desejada do ebook na aba "Gerador de Prompts" para obter um prompt pronto e detalhado.', icon: Sparkles, mockup: 'input' },
  { id: 'eb2', title: 'Criar conta no Gamma', desc: 'Acesse gamma.app e cadastre-se gratuitamente usando sua conta Google ou e-mail. O plano gratuito já é suficiente para começar.', icon: UserPlus, mockup: 'form' },
  { id: 'eb3', title: 'Criar novo documento', desc: 'Dentro do Gamma, clique em "Create new" (ou "+ Novo"), escolha a opção "Generate" e selecione o formato "Document".', icon: FileText, mockup: 'dashboard' },
  { id: 'eb4', title: 'Colar o prompt', desc: 'Cole o prompt gerado no SaaS dentro da caixa de texto do Gamma e clique em "Generate outline" para a IA montar a estrutura de capítulos.', icon: UploadCloud, mockup: 'input' },
  { id: 'eb5', title: 'Revisar o conteúdo', desc: 'Leia cada capítulo gerado e ajuste textos, exemplos e informações diretamente nos blocos de edição do Gamma.', icon: CheckCircle, mockup: 'chat' },
  { id: 'eb6', title: 'Personalizar o design', desc: 'Escolha um tema visual que combine com o assunto do ebook, ajuste as cores e adicione uma capa de destaque.', icon: Palette, mockup: 'settings' },
  { id: 'eb7', title: 'Exportar em PDF', desc: 'Clique em "Share" no canto superior direito, selecione "Export" e escolha o formato "PDF" para baixar o arquivo final.', icon: FileDown, mockup: 'deploy' },
  { id: 'eb8', title: 'Entregar ou vender', desc: 'Envie o PDF por e-mail, disponibilize no Google Drive, ou cadastre o produto na Hotmart/Kiwify/Gumroad para vender automaticamente.', icon: Rocket, mockup: 'deploy' },
]

const appSteps: Step[] = [
  { id: 'ap1', title: 'Gerar o prompt no SaaS', desc: 'Descreva as funcionalidades principais, o público-alvo e o estilo visual desejado do aplicativo na aba "Gerador de Prompts".', icon: Sparkles, mockup: 'input' },
  { id: 'ap2', title: 'Criar conta no Lovable', desc: 'Acesse lovable.dev e cadastre-se — recomendado usar sua conta do GitHub para já facilitar a exportação do código depois.', icon: UserPlus, mockup: 'form' },
  { id: 'ap3', title: 'Criar o projeto', desc: 'Cole o prompt gerado na caixa principal do Lovable e clique em "Generate". Aguarde a IA montar a primeira versão do app.', icon: PlusCircle, mockup: 'input' },
  { id: 'ap4', title: 'Testar e ajustar', desc: 'Navegue pelo preview interativo e peça alterações diretamente pelo chat, como "mude a cor do botão" ou "adicione uma tela de login".', icon: PlayCircle, mockup: 'chat' },
  { id: 'ap5', title: 'Conectar banco de dados', desc: 'Se o app precisa salvar dados (cadastros, pedidos, etc.), vá em "Integrations" e ative a conexão nativa com o Supabase.', icon: Database, mockup: 'settings' },
  { id: 'ap6', title: 'Exportar para GitHub', desc: 'Conecte sua conta do GitHub dentro do Lovable e crie um novo repositório para armazenar o código do seu app.', icon: GitBranch, mockup: 'settings' },
  { id: 'ap7', title: 'Publicar na Vercel', desc: 'Importe o repositório em vercel.com e clique em "Deploy". Em poucos minutos seu app já estará no ar com um link público.', icon: Rocket, mockup: 'deploy' },
  { id: 'ap8', title: 'Comprar domínio', desc: 'Compre o endereço ideal para o seu app no Registro.br (domínios .com.br) ou Namecheap/GoDaddy (domínios internacionais).', icon: Globe, mockup: 'form' },
  { id: 'ap9', title: 'Conectar domínio', desc: 'Em "Settings > Domains" na Vercel, adicione seu domínio próprio e configure os registros DNS indicados pelo painel.', icon: LinkIcon, mockup: 'settings' },
]

const siteSteps: Step[] = [
  { id: 'st1', title: 'Gerar o prompt no SaaS', desc: 'Defina as seções desejadas (Hero, Serviços, Depoimentos, FAQ), o estilo visual e o CTA principal do site.', icon: Sparkles, mockup: 'input' },
  { id: 'st2', title: 'Criar o projeto no Lovable', desc: 'Cole o prompt gerado no Lovable e clique em "Generate" para a IA criar a estrutura completa do site.', icon: PlusCircle, mockup: 'input' },
  { id: 'st3', title: 'Revisar textos e imagens', desc: 'Leia todo o conteúdo gerado e peça ajustes de copy, títulos e imagens diretamente pelo chat da ferramenta.', icon: CheckCircle, mockup: 'chat' },
  { id: 'st4', title: 'Adicionar integrações', desc: 'Solicite a inserção de um botão de WhatsApp flutuante, formulário de contato ou mapa de localização, se necessário.', icon: MessageSquare, mockup: 'settings' },
  { id: 'st5', title: 'Testar responsividade', desc: 'Alterne entre as visualizações desktop e mobile no preview para garantir que o site fique perfeito em qualquer tela.', icon: Monitor, mockup: 'dashboard' },
  { id: 'st6', title: 'Publicar no Netlify', desc: 'Conecte sua conta do GitHub ao Netlify, selecione o repositório do projeto e clique em "Deploy site".', icon: Rocket, mockup: 'deploy' },
  { id: 'st7', title: 'Comprar e conectar domínio', desc: 'Registre o domínio desejado e, no painel do Netlify em "Domain Settings", insira os registros DNS indicados.', icon: Globe, mockup: 'form' },
  { id: 'st8', title: 'Checklist final', desc: 'Confira se todos os links abrem corretamente, se o certificado SSL (cadeado) está ativo e se o site carrega rápido.', icon: CheckSquare, mockup: 'checklist' },
]

const TABS = [
  { id: 'ebook', label: 'Ebook', emoji: '📘', tool: 'Gamma', toolUrl: 'https://gamma.app', steps: ebookSteps, gradient: 'from-amber-600 to-orange-950' },
  { id: 'app', label: 'App', emoji: '📱', tool: 'Lovable', toolUrl: 'https://lovable.dev', steps: appSteps, gradient: 'from-violet-600 to-fuchsia-950' },
  { id: 'site', label: 'Site', emoji: '🌐', tool: 'Lovable', toolUrl: 'https://lovable.dev', steps: siteSteps, gradient: 'from-blue-600 to-cyan-950' },
] as const

type TabId = (typeof TABS)[number]['id']

const FAQS: Record<TabId, { q: string; a: string }[]> = {
  ebook: [
    { q: 'Preciso saber programar?', a: 'Não. Todo o processo é feito colando o prompt gerado dentro do Gamma — a própria IA monta o texto, o design e a estrutura dos capítulos para você.' },
    { q: 'É pago?', a: 'O plano gratuito do Gamma já oferece créditos suficientes para criar e exportar vários ebooks. Planos pagos só são necessários se quiser remover a marca d\'água ou liberar mais exportações.' },
    { q: 'Posso vender o ebook depois de pronto?', a: 'Sim. Depois de exportar em PDF, é só cadastrar o arquivo em plataformas como Hotmart, Kiwify ou Gumroad, que cuidam do pagamento e da entrega automática.' },
  ],
  app: [
    { q: 'Preciso saber programar?', a: 'Não. O Lovable foi criado justamente para gerar aplicativos sem código — você conversa em português com a IA e ela cria e ajusta o app em tempo real.' },
    { q: 'É pago?', a: 'O Lovable tem um plano gratuito para começar. A hospedagem na Vercel também é gratuita (plano "Hobby"), incluindo domínio próprio e certificado de segurança SSL.' },
    { q: 'Por que preciso conectar um banco de dados?', a: 'O Supabase é quem guarda de forma permanente os cadastros, logins e informações que os usuários do seu app vão preencher — sem ele, os dados se perdem ao atualizar a página.' },
  ],
  site: [
    { q: 'Preciso saber programar?', a: 'Não. Assim como no app, o site inteiro é gerado a partir do prompt — você só revisa textos e imagens pelo chat, sem precisar escrever nenhuma linha de código.' },
    { q: 'É pago?', a: 'Não. O Netlify oferece hospedagem gratuita para esse tipo de site, incluindo certificado SSL automático. Você só paga se decidir registrar um domínio próprio.' },
    { q: 'Posso atualizar o site depois de publicado?', a: 'Sim! Toda vez que você pedir uma alteração no Lovable e ele sincronizar com o GitHub, o Netlify atualiza o site publicado automaticamente em poucos segundos.' },
  ],
}

const STORAGE_KEY = 'lz_central_publicacao_steps'

// Barra sólida usada dentro dos mockups (simula uma linha de texto/UI) — cor sempre opaca, nunca translúcida
function Bar({ w = '100%', h = 'h-2.5', tone = 'bg-gray-300' }: { w?: string; h?: string; tone?: string }) {
  return <div className={`${h} rounded-full ${tone} shrink-0`} style={{ width: w }} />
}

// "Miolo" da janela de navegador — varia por tipo de passo. Fundo claro sólido (não gradiente translúcido)
// pra parecer de fato uma tela de aplicativo, com boa leitura em qualquer contraste.
function MockupScene({ kind }: { kind: MockupKind }) {
  if (kind === 'form') {
    return (
      <div className="h-full w-full flex items-center justify-center bg-[#dbdee6] p-4">
        <div className="w-[75%] max-w-[240px] rounded-lg bg-white border border-gray-300 shadow p-4 flex flex-col gap-2.5">
          <Bar w="50%" h="h-3" tone="bg-gray-700" />
          <div className="h-7 rounded-md bg-gray-100 border border-gray-300 mt-1" />
          <div className="h-7 rounded-md bg-gray-100 border border-gray-300" />
          <div className="h-8 rounded-md bg-violet-600 mt-1.5" />
        </div>
      </div>
    )
  }
  if (kind === 'input') {
    return (
      <div className="h-full w-full flex flex-col gap-2.5 bg-[#dbdee6] p-4">
        <Bar w="40%" h="h-3" tone="bg-gray-700" />
        <div className="flex-1 rounded-lg bg-white border border-gray-300 shadow p-3 flex flex-col gap-2 justify-center">
          <Bar w="90%" tone="bg-gray-300" />
          <Bar w="75%" tone="bg-gray-300" />
          <Bar w="55%" tone="bg-gray-300" />
        </div>
        <div className="self-end h-8 w-24 rounded-md bg-violet-600" />
      </div>
    )
  }
  if (kind === 'chat') {
    return (
      <div className="h-full w-full flex gap-2.5 bg-[#dbdee6] p-4">
        <div className="w-[30%] rounded-lg bg-white border border-gray-300 shadow p-2.5 flex flex-col gap-2">
          <Bar w="85%" tone="bg-gray-500" />
          <Bar w="65%" tone="bg-gray-300" />
          <Bar w="75%" tone="bg-gray-300" />
        </div>
        <div className="flex-1 flex flex-col gap-2.5 justify-end">
          <div className="self-start max-w-[80%] rounded-lg rounded-bl-sm bg-gray-100 border border-gray-300 shadow px-3 py-2.5 flex flex-col gap-1.5">
            <Bar w="95px" tone="bg-gray-400" />
            <Bar w="60px" tone="bg-gray-400" />
          </div>
          <div className="self-end max-w-[80%] rounded-lg rounded-br-sm bg-violet-600 shadow px-3 py-2.5 flex flex-col gap-1.5">
            <Bar w="75px" tone="bg-white" />
            <Bar w="45px" tone="bg-white" />
          </div>
        </div>
      </div>
    )
  }
  if (kind === 'dashboard') {
    return (
      <div className="h-full w-full grid grid-cols-2 gap-2.5 bg-[#dbdee6] p-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="rounded-lg bg-white border border-gray-300 shadow p-3 flex flex-col gap-2 justify-center">
            <Bar w="55%" h="h-3" tone="bg-gray-600" />
            <Bar w="80%" tone="bg-gray-200" />
          </div>
        ))}
      </div>
    )
  }
  if (kind === 'settings') {
    return (
      <div className="h-full w-full flex flex-col gap-2.5 justify-center bg-[#dbdee6] p-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex items-center justify-between rounded-lg bg-white border border-gray-300 shadow px-3.5 py-3">
            <Bar w="45%" tone="bg-gray-500" />
            <div className={`h-5 w-9 rounded-full flex items-center px-0.5 ${i === 1 ? 'bg-emerald-500 justify-end' : 'bg-gray-300 justify-start'}`}>
              <div className="h-4 w-4 rounded-full bg-white shadow" />
            </div>
          </div>
        ))}
      </div>
    )
  }
  if (kind === 'checklist') {
    return (
      <div className="h-full w-full flex flex-col gap-2.5 justify-center bg-[#dbdee6] p-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-2.5 rounded-lg bg-white border border-gray-300 shadow px-3 py-2">
            <div className="h-5 w-5 rounded bg-emerald-500 flex items-center justify-center shrink-0">
              <Check size={12} strokeWidth={3} className="text-white" />
            </div>
            <Bar w={`${70 - i * 8}%`} tone="bg-gray-300" />
          </div>
        ))}
      </div>
    )
  }
  // deploy
  return (
    <div className="h-full w-full flex flex-col items-center justify-center gap-3 bg-[#dbdee6] p-4">
      <div className="h-14 w-14 rounded-full bg-emerald-500 flex items-center justify-center shadow">
        <Check size={26} strokeWidth={3} className="text-white" />
      </div>
      <Bar w="130px" h="h-3" tone="bg-gray-600" />
      <Bar w="90px" tone="bg-gray-300" />
    </div>
  )
}

// Moldura de janela de navegador — dá aparência de "print de tela" real.
// Altura fixa (não aspect-ratio+flex) pra garantir que o conteúdo interno sempre apareça certinho.
function BrowserMockup({ url, kind }: { url: string; kind: MockupKind }) {
  return (
    <div className="rounded-xl overflow-hidden border border-white/10 mt-3 bg-[#1c1c26] shadow-lg">
      <div className="h-8 flex items-center gap-2 px-3 bg-[#26262f] border-b border-white/10">
        <div className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
        </div>
        <div className="flex-1 max-w-[220px] h-5 rounded-md bg-black/30 flex items-center px-2.5">
          <span className="text-[10px] text-zinc-400 font-jet truncate">{url}</span>
        </div>
      </div>
      <div className="h-52 sm:h-56">
        <MockupScene kind={kind} />
      </div>
    </div>
  )
}

export default function CentralPublicacaoPage() {
  const [activeTab, setActiveTab] = useState<TabId>('ebook')
  const [completed, setCompleted] = useState<Record<string, boolean>>({})
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [me, setMe] = useState<any>(null)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) setCompleted(JSON.parse(stored))
    } catch {}
    fetch('/api/me').then((r) => (r.ok ? r.json() : null)).then((d) => setMe(d)).catch(() => {})
  }, [])

  function toggleStep(stepId: string) {
    const updated = { ...completed, [stepId]: !completed[stepId] }
    setCompleted(updated)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    } catch {}
  }

  const tab = TABS.find((t) => t.id === activeTab)!
  const steps = tab.steps
  const completedCount = steps.filter((s) => completed[s.id]).length
  const progressPercent = steps.length > 0 ? Math.round((completedCount / steps.length) * 100) : 0
  const faqs = FAQS[activeTab]

  return (
    <div>
      <PageHeader
        title="Central de"
        highlight="Publicação 📚"
        description="Guia passo a passo pra transformar o prompt gerado em ebook, aplicativo ou site pronto e publicado — sem precisar programar."
      />

      {/* Sub-abas: Ebook / App / Site */}
      <div className="flex bg-[#0a0a14] p-1.5 rounded-xl border border-white/5 max-w-md mb-8">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => { setActiveTab(t.id); setOpenFaq(null) }}
            className={`flex-1 py-2.5 rounded-lg text-xs font-bold font-grotesk flex items-center justify-center gap-2 transition-all duration-300 ${
              activeTab === t.id
                ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-500/10'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <span>{t.emoji}</span> {t.label}
          </button>
        ))}
      </div>

      {/* Barra de progresso */}
      <div className="lz-card p-5 bg-[#0a0a14] border border-white/5 mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-bold text-zinc-300 font-grotesk">
            Passo {Math.min(completedCount + 1, steps.length)} de {steps.length}
          </span>
          <span className="text-xs font-bold text-[var(--purple-soft)] font-jet">
            {completedCount}/{steps.length} concluídos ({progressPercent}%)
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

      {/* Timeline de passos (stepper vertical) */}
      <div className="relative pl-8 md:pl-10 space-y-6 before:absolute before:left-[17px] before:top-6 before:bottom-6 before:w-0.5 before:bg-white/5">
        {steps.map((step, idx) => {
          const isCompleted = !!completed[step.id]
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
              {/* Círculo numerado do timeline */}
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

              {/* Cabeçalho: ícone + título + checkbox */}
              <div className="flex justify-between items-start gap-4 mb-3">
                <div className="flex items-start gap-3">
                  <div className={`p-2.5 rounded-xl shrink-0 ${isCompleted ? 'bg-emerald-500/10 text-emerald-400' : 'bg-violet-500/10 text-[var(--purple-soft)]'}`}>
                    <StepIcon size={18} />
                  </div>
                  <div>
                    <h3 className={`font-grotesk font-bold text-sm ${isCompleted ? 'text-emerald-400 line-through opacity-85' : 'text-white'}`}>
                      {step.title}
                    </h3>
                    <p className="text-xs text-zinc-400 leading-relaxed mt-1.5">
                      {step.desc}
                    </p>
                  </div>
                </div>

                {/* Checkbox "Marcar como concluído" */}
                <label className="flex items-center gap-2 cursor-pointer select-none shrink-0">
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
                    {isCompleted ? 'Concluído' : 'Marcar'}
                  </span>
                </label>
              </div>

              {/* Mockup em formato de janela de navegador — simula um print de tela real. Troque por um print de verdade quando quiser. */}
              <BrowserMockup url={tab.toolUrl.replace('https://', '')} kind={step.mockup} />
            </motion.div>
          )
        })}
      </div>

      {/* Botão de destaque para a ferramenta externa */}
      <div className="mt-8 p-6 rounded-2xl bg-gradient-to-r from-violet-950/10 to-fuchsia-950/10 border border-white/5 text-center">
        <h4 className="font-grotesk text-sm font-bold text-white mb-2">Pronto para começar?</h4>
        <p className="text-xs text-zinc-400 mb-4 max-w-md mx-auto">
          Abra o {tab.tool} em uma nova aba e siga os passos acima para publicar seu {tab.label.toLowerCase()}.
        </p>
        <a
          href={tab.toolUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="lz-btn-primary py-3 px-8 text-xs font-bold uppercase tracking-widest inline-flex items-center gap-2"
        >
          {activeTab === 'ebook' ? <BookOpen size={14} /> : <AppWindow size={14} />} Abrir {tab.tool}
        </a>
      </div>

      {/* FAQ */}
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
                    className={`text-zinc-500 transition-transform duration-200 shrink-0 ml-3 ${isOpen ? 'rotate-180 text-white' : ''}`}
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

      {/* Suporte */}
      <div className="mt-8 p-4 rounded-xl bg-[#090912] border border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-center sm:text-left">
          <h4 className="text-xs font-bold text-white font-grotesk">Ainda com dúvidas?</h4>
          <p className="text-[10px] text-zinc-500 mt-0.5">Nosso time de suporte está disponível para tirar qualquer dúvida sobre esse processo.</p>
        </div>
        <a
          href={`https://wa.me/55${me?.whatsappNumber || '11999999999'}?text=Olá! Estou com dúvida na Central de Publicação do LeadZap.`}
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 rounded-xl text-xs font-bold bg-[#121225] border border-white/10 hover:border-violet-500 text-white transition-all shrink-0"
          onClick={() => toast.success('Abrindo WhatsApp do suporte...')}
        >
          💬 Falar com Suporte
        </a>
      </div>
    </div>
  )
}
