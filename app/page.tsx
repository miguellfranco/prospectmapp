'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Radar, Search, MessageSquare, ChevronDown, CheckCircle2,
  Star, Zap, BarChart3, ShieldCheck, Flame, Laptop, BookOpen, Compass,
  Menu, X as CloseIcon, CreditCard, Headset
} from 'lucide-react'

export default function ProspectMapLanding() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)

  const steps = [
    {
      step: 'ETAPA — 1',
      title: 'Você dá a direção.',
      desc: 'Digite o seu nicho ou a dor do seu público. Apenas isso.',
      icon: Compass,
    },
    {
      step: 'ETAPA — 2',
      title: 'A máquina constrói o arsenal.',
      desc: 'Em menos de 3 minutos, a IA escreve seu E-book, cria a copy da página e estrutura as mensagens persuasivas.',
      icon: Zap,
    },
    {
      step: 'ETAPA — 3',
      title: 'Você liga o tráfego e lucra.',
      desc: 'Copie, cole e publique. Seu ecossistema de vendas está pronto para transformar cliques em dinheiro.',
      icon: Flame,
    },
  ]

  const workflow = [
    { icon: Laptop, title: 'Configuração do Perfil do Cliente', desc: 'Defina quem é seu cliente dos sonhos em poucos cliques e deixe a IA alinhar a oferta.' },
    { icon: Search, title: 'IA de Busca em Massa', desc: 'Nosso motor inteligente extrai dados reais e ocultos do Google Maps em qualquer cidade.' },
    { icon: MessageSquare, title: 'Gestão de Conversas no WhatsApp', desc: 'Centralize e gerencie todas as suas abordagens frias sem perder o controle dos contatos.' },
    { icon: BarChart3, title: 'Relatórios de Desempenho', desc: 'Acompanhe taxas de resposta, faturamento real e otimize o funil em tempo real.' },
  ]

  const stats = [
    { value: '+2.400', label: 'Funis Criados' },
    { value: '+50', label: 'Nichos Disponíveis' },
    { value: '< 3 min', label: 'Tempo Médio' },
  ]

  const faqs = [
    { 
      q: 'O ProspectMap funciona para qualquer nicho?', 
      a: 'Sim! Nossa inteligência artificial consegue prospectar estabelecimentos e nichos de qualquer mercado B2B ou comercial local (academias, clínicas, restaurantes, lojas, etc.) e modelar ofertas ideais.' 
    },
    { 
      q: 'Preciso saber programar para criar os sites e apps?', 
      a: 'De jeito nenhum! Nós fornecemos prompts e ensinamos passo a passo a usar IAs generativas como Lovable (para gerar apps e sites funcionais) e Gamma (para estruturar ebooks e apresentações) de forma instantânea.' 
    },
    { 
      q: 'Como recebo os pagamentos dos meus clientes?', 
      a: 'Você recebe 100% do valor direto na sua conta bancária (Pix, Stripe, Mercado Pago ou cartão). O ProspectMap não cobra nenhuma taxa sobre as suas vendas.' 
    },
    { 
      q: 'Como funciona o suporte individual gratuito?', 
      a: 'Para os planos Semestral e Anual, a partir do 6º mês de uso, você ganha acesso direto a um especialista da nossa equipe para sessões personalizadas de alinhamento estratégico via suporte por WhatsApp.' 
    },
    { 
      q: 'O que acontece quando as 500 vagas forem preenchidas?', 
      a: 'Nós fecharemos temporariamente as novas inscrições para garantir a qualidade de processamento das buscas da IA e a estabilidade do servidor para os membros ativos.' 
    }
  ]

  return (
    <div className="min-h-screen bg-[#05050b] text-zinc-300 font-sans selection:bg-violet-600/30 overflow-x-hidden">
      
      {/* HEADER */}
      <header className="fixed top-0 w-full z-50 border-b border-white/5 bg-[#05050b]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-violet-950/50 border border-violet-500/30 shadow-[0_0_20px_rgba(124,58,237,0.25)] text-violet-400">
              <Radar size={22} className="animate-pulse" />
            </div>
            <span className="font-bold text-2xl text-white tracking-tight">ProspectMap</span>
          </div>

          {/* Menu do Centro */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-400">
            <Link href="#como-funciona" className="hover:text-white transition-colors">Como Funciona</Link>
            <Link href="#funcionalidades" className="hover:text-white transition-colors">Funcionalidades</Link>
            <Link href="#planos" className="hover:text-white transition-colors">Planos</Link>
            <Link href="#faq" className="hover:text-white transition-colors">FAQ</Link>
          </nav>

          <div className="hidden md:flex items-center gap-4">
            <Link href="/login" className="text-sm font-semibold text-zinc-400 hover:text-white transition-colors">
              Entrar
            </Link>
            <Link href="#planos" className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-bold text-sm shadow-[0_0_20px_-5px_rgba(124,58,237,0.4)] transition-all hover:scale-105">
              Assinar Agora
            </Link>
          </div>

          {/* Botão do menu mobile */}
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="md:hidden flex items-center justify-center h-10 w-10 rounded-lg text-zinc-300 hover:text-white hover:bg-white/5 transition-colors"
            aria-label="Abrir menu"
          >
            {menuOpen ? <CloseIcon size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* Painel do menu mobile */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="md:hidden overflow-hidden border-t border-white/5 bg-[#05050b]"
            >
              <nav className="flex flex-col px-6 py-4 gap-1 text-sm font-medium text-zinc-300">
                <Link href="#como-funciona" onClick={() => setMenuOpen(false)} className="py-3 border-b border-white/5 hover:text-white transition-colors">Como Funciona</Link>
                <Link href="#funcionalidades" onClick={() => setMenuOpen(false)} className="py-3 border-b border-white/5 hover:text-white transition-colors">Funcionalidades</Link>
                <Link href="#planos" onClick={() => setMenuOpen(false)} className="py-3 border-b border-white/5 hover:text-white transition-colors">Planos</Link>
                <Link href="#faq" onClick={() => setMenuOpen(false)} className="py-3 border-b border-white/5 hover:text-white transition-colors">FAQ</Link>
                <Link href="/login" onClick={() => setMenuOpen(false)} className="py-3 hover:text-white transition-colors">Entrar</Link>
                <Link
                  href="#planos"
                  onClick={() => setMenuOpen(false)}
                  className="mt-2 inline-flex items-center justify-center px-5 py-3 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-bold text-sm transition-all"
                >
                  Assinar Agora
                </Link>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main className="pt-20">
        
        {/* HERO SECTION */}
        <section className="relative pt-24 pb-32 overflow-hidden">
          {/* Ambient Glows */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1000px] h-[600px] bg-violet-900/10 blur-[150px] pointer-events-none rounded-full" />
          
          <div className="max-w-5xl mx-auto px-6 text-center relative z-10">
            <motion.div 
              initial={{ opacity: 0, y: 30 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <h1 className="text-5xl md:text-7xl font-bold text-white tracking-tight leading-[1.1] mb-8">
                O Jeito Mais Rápido e Lucrativo de Criar e Vender no Digital.<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-fuchsia-400 to-indigo-400">Tudo em 3 Minutos.</span>
              </h1>
              
              <p className="text-xl text-zinc-400 mb-12 max-w-3xl mx-auto leading-relaxed">
                Descubra negócios locais que precisam de ajuda, gere aplicativos com <strong className="text-white">Lovable</strong> e ebooks com <strong className="text-white">Gamma</strong>, e feche vendas no WhatsApp com a nossa inteligência artificial.
              </p>

              <Link href="#planos" className="inline-flex items-center justify-center gap-3 px-10 py-5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-black text-lg shadow-[0_0_40px_rgba(124,58,237,0.4)] transition-all hover:scale-[1.02] active:scale-95 group">
                QUERO COMEÇAR AGORA
                <Zap size={22} className="group-hover:animate-bounce" />
              </Link>
            </motion.div>

            {/* Dashboard Showcase Mockup */}
            <motion.div 
              initial={{ opacity: 0, y: 80 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.2 }}
              className="mt-20 relative mx-auto max-w-5xl"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-violet-500/10 to-transparent blur-3xl -z-10" />
              <div className="rounded-2xl border border-white/5 bg-[#080812]/95 shadow-2xl overflow-hidden ring-1 ring-white/10">
                
                {/* Mockup Toolbar */}
                <div className="h-12 border-b border-white/5 flex items-center px-4 gap-2 bg-[#05050c]/80">
                  <div className="flex gap-1.5">
                    <div className="w-3.5 h-3.5 rounded-full bg-red-500/80" />
                    <div className="w-3.5 h-3.5 rounded-full bg-yellow-500/80" />
                    <div className="w-3.5 h-3.5 rounded-full bg-green-500/80" />
                  </div>
                  <div className="mx-auto px-4 py-1 rounded bg-white/5 text-[10px] text-zinc-500 font-mono flex items-center gap-2">
                    <ShieldCheck size={12} className="text-violet-500" />
                    app.prospectmap.com.br/dashboard
                  </div>
                </div>

                {/* Mockup Dashboard Content */}
                <div className="p-6 md:p-10 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
                  <div className="col-span-2 space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="h-4 w-12 bg-violet-500/20 rounded animate-pulse" />
                      <div className="h-4 w-24 bg-white/5 rounded" />
                    </div>
                    <div className="h-48 w-full bg-gradient-to-br from-violet-950/20 to-transparent border border-violet-500/15 rounded-2xl p-6 relative overflow-hidden">
                       <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/5 blur-3xl" />
                       <div className="flex items-center gap-3 mb-6">
                         <Radar className="text-violet-400 animate-pulse" size={22} />
                         <span className="text-violet-100 font-semibold tracking-wide text-sm uppercase">Varredura de Prospecção</span>
                       </div>
                       <div className="space-y-4">
                         {[1, 2, 3].map(i => (
                           <div key={i} className="flex items-center justify-between">
                             <div className="flex items-center gap-3 w-2/3">
                               <div className="h-2 w-2 rounded-full bg-violet-500" />
                               <div className="h-3 w-full bg-white/10 rounded" />
                             </div>
                             <div className="h-6 w-20 bg-violet-500/10 rounded-full border border-violet-500/20 flex items-center justify-center text-[10px] text-violet-300 font-mono">
                               Sem Site
                             </div>
                           </div>
                         ))}
                       </div>
                    </div>
                  </div>
                  <div className="col-span-1 space-y-4">
                     <div className="h-28 w-full bg-white/[0.02] rounded-2xl border border-white/5 p-5">
                       <div className="text-xs text-zinc-500 mb-2">Mensagens Geradas</div>
                       <div className="text-3xl font-bold text-white font-grotesk">1,492</div>
                       <div className="text-violet-400 text-xs mt-1">+12% hoje</div>
                     </div>
                     <div className="h-28 w-full bg-white/[0.02] rounded-2xl border border-white/5 p-5">
                       <div className="text-xs text-zinc-500 mb-2">Faturamento Estimado</div>
                       <div className="text-3xl font-bold text-emerald-400 font-grotesk">R$ 13.200</div>
                       <div className="text-zinc-500 text-xs mt-1">Este período</div>
                     </div>
                  </div>
                </div>

              </div>
            </motion.div>
          </div>
        </section>

        {/* WORKFLOW (ETAPAS) */}
        <section id="como-funciona" className="scroll-mt-20 py-28 border-y border-white/5 bg-[#070710] relative">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-sm font-semibold tracking-wider text-violet-400 uppercase mb-3">COMO FUNCIONA</h2>
              <h3 className="text-4xl font-bold text-white tracking-tight">Crie seu funil automatizado em minutos</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {steps.map((s, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: false }}
                  transition={{ delay: i * 0.15 }}
                  className="flex flex-col p-8 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-violet-500/30 transition-all group"
                >
                  <span className="text-xs font-bold text-violet-400/60 uppercase tracking-widest mb-4 font-mono">{s.step}</span>
                  <div className="w-12 h-12 rounded-xl bg-violet-950/50 border border-violet-500/20 flex items-center justify-center mb-6 text-violet-400 group-hover:scale-110 transition-transform">
                    <s.icon size={24} />
                  </div>
                  <h4 className="text-xl font-bold text-white mb-4">{s.title}</h4>
                  <p className="text-zinc-400 leading-relaxed text-sm">{s.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* FEATURES */}
        <section id="funcionalidades" className="scroll-mt-20 py-28 relative">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-20">
              <h2 className="text-4xl font-bold text-white tracking-tight">Estrutura Pronta para Vendas</h2>
              <p className="text-zinc-400 max-w-xl mx-auto mt-2">Nossas ferramentas cobrem todo o ciclo de prospecção do seu negócio.</p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {workflow.map((w, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, scale: 0.98 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: false }}
                  className="p-8 rounded-2xl bg-white/[0.01] border border-white/5 hover:border-violet-500/20 transition-all group"
                >
                  <w.icon className="text-violet-400 mb-6 opacity-75 group-hover:opacity-100 group-hover:scale-110 transition-all" size={32} />
                  <h4 className="text-lg font-bold text-white mb-3">{w.title}</h4>
                  <p className="text-sm text-zinc-500 leading-relaxed">{w.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* STATS & TRUST BAR */}
        <section className="py-24 bg-gradient-to-b from-[#080812] to-[#05050b] border-t border-white/5">
          <div className="max-w-5xl mx-auto px-6 text-center">

            {/* Big Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
              {stats.map((s, i) => (
                <div key={i} className="flex flex-col items-center justify-center p-8 rounded-2xl bg-white/[0.01] border border-white/5 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-violet-500 to-transparent" />
                  <div className="text-5xl font-black text-white tracking-tight mb-2 font-grotesk">{s.value}</div>
                  <div className="text-zinc-500 text-xs uppercase font-semibold tracking-wider">{s.label}</div>
                </div>
              ))}
            </div>

            {/* TRUST BAR — garantias reais, sem contador fabricado */}
            <div className="max-w-3xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-4 mb-16">
              <div className="flex items-center gap-3 p-5 rounded-2xl border border-white/5 bg-white/[0.01] text-left">
                <CreditCard size={20} className="text-violet-400 shrink-0" />
                <span className="text-xs text-zinc-300">Sem fidelidade — cancele quando quiser</span>
              </div>
              <div className="flex items-center gap-3 p-5 rounded-2xl border border-white/5 bg-white/[0.01] text-left">
                <Zap size={20} className="text-violet-400 shrink-0" />
                <span className="text-xs text-zinc-300">Acesso liberado na hora, após a assinatura</span>
              </div>
              <div className="flex items-center gap-3 p-5 rounded-2xl border border-white/5 bg-white/[0.01] text-left">
                <Headset size={20} className="text-violet-400 shrink-0" />
                <span className="text-xs text-zinc-300">Suporte direto pelo WhatsApp</span>
              </div>
            </div>

            <Link href="#planos" className="inline-flex items-center justify-center px-8 py-4 rounded-lg bg-white/5 border border-white/10 text-white font-bold hover:bg-white/10 hover:border-violet-500/40 transition-all">
              Quero Começar Agora
            </Link>
          </div>
        </section>

        {/* PRICING SECTION */}
        <section id="planos" className="scroll-mt-20 py-32 relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-violet-900/5 blur-[150px] pointer-events-none rounded-full" />
          
          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="text-center mb-20">
              <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-4">Escolha seu plano</h2>
              <p className="text-zinc-400 max-w-xl mx-auto">Invista no método que vai acelerar sua escala. Sem taxas ou comissões adicionais.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
              
              {/* PLANO MENSAL */}
              <div className="rounded-3xl border border-white/10 bg-[#07070f] p-8 flex flex-col hover:border-violet-500/20 transition-all">
                <h3 className="text-xl font-bold text-white mb-2">Mensal</h3>
                <p className="text-xs text-zinc-500 mb-8">Ideal para testar rápido e sentir o poder da IA.</p>
                <div className="flex items-baseline gap-1 mb-8">
                  <span className="text-zinc-500 font-semibold">R$</span>
                  <span className="text-5xl font-black text-white font-grotesk">97</span>
                  <span className="text-zinc-500 font-semibold">,90/mês</span>
                </div>
                
                <ul className="flex-1 space-y-4 mb-10">
                  <li className="flex items-start gap-3 text-sm text-zinc-400">
                    <CheckCircle2 size={16} className="text-violet-500 shrink-0 mt-0.5" />
                    <span>Criação de funis completos com IA</span>
                  </li>
                  <li className="flex items-start gap-3 text-sm text-zinc-400">
                    <CheckCircle2 size={16} className="text-violet-500 shrink-0 mt-0.5" />
                    <span>E-books e copys ilimitados</span>
                  </li>
                  <li className="flex items-start gap-3 text-sm text-zinc-400">
                    <CheckCircle2 size={16} className="text-violet-500 shrink-0 mt-0.5" />
                    <span>Roteiros de WhatsApp prontos</span>
                  </li>
                  <li className="flex items-start gap-3 text-sm text-zinc-400">
                    <CheckCircle2 size={16} className="text-violet-500 shrink-0 mt-0.5" />
                    <span>Prompts para Gamma e Lovable App</span>
                  </li>
                </ul>

                <Link href="/cadastro?plan=mensal" className="block w-full py-3.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-center font-bold text-white transition-colors">
                  ASSINAR AGORA
                </Link>
              </div>

              {/* PLANO SEMESTRAL (PRINCIPAL / RECOMENDADO) */}
              <div className="rounded-3xl border-2 border-amber-500 bg-amber-950/15 p-8 flex flex-col relative transform md:-translate-y-6 shadow-[0_0_50px_rgba(245,158,11,0.15)]">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-6 py-1.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-600 text-white text-[10px] font-black tracking-widest uppercase whitespace-nowrap">
                  Mais Vendido / Recomendado 🔥
                </div>
                
                <h3 className="text-xl font-bold text-white mb-2 mt-2">Semestral (6 Meses)</h3>
                <p className="text-xs text-amber-300 mb-6">Nosso plano mais completo para escalar suas vendas.</p>
                <div className="text-xs text-zinc-500 line-through mb-1">De R$ 575,00</div>
                <div className="flex items-baseline gap-1 mb-8">
                  <span className="text-zinc-500 font-semibold">Por R$</span>
                  <span className="text-5xl font-black text-white font-grotesk">197</span>
                  <span className="text-zinc-500 font-semibold">,90/semestre</span>
                </div>
                
                <div className="flex-1">
                  <p className="text-[10px] font-bold text-amber-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Star size={12} /> RECURSOS DE ELITE INCLUSOS
                  </p>
                  <ul className="space-y-4 mb-10">
                    <li className="flex items-start gap-3 text-sm text-zinc-300">
                      <CheckCircle2 size={16} className="text-amber-500 shrink-0 mt-0.5" />
                      <span>Criação de funis completos com IA</span>
                    </li>
                    <li className="flex items-start gap-3 text-sm text-zinc-300">
                      <CheckCircle2 size={16} className="text-amber-500 shrink-0 mt-0.5" />
                      <span>E-books e copys ilimitados</span>
                    </li>
                    <li className="flex items-start gap-3 text-sm text-zinc-300">
                      <CheckCircle2 size={16} className="text-amber-500 shrink-0 mt-0.5" />
                      <span>Roteiros de WhatsApp altamente persuasivos</span>
                    </li>
                    <li className="flex items-start gap-3 text-sm text-zinc-300">
                      <CheckCircle2 size={16} className="text-amber-500 shrink-0 mt-0.5" />
                      <span>Prompts de engenharia para Gamma e Lovable</span>
                    </li>
                    <li className="flex items-start gap-3 text-sm text-white bg-amber-900/30 p-3 rounded-lg border border-amber-500/20">
                      <MessageSquare size={16} className="text-amber-400 shrink-0 mt-0.5" />
                      <span><strong>Bônus:</strong> Suporte individual via WhatsApp</span>
                    </li>
                    <li className="flex items-start gap-3 text-sm text-zinc-300">
                      <CheckCircle2 size={16} className="text-amber-500 shrink-0 mt-0.5" />
                      <span>Dashboard analítico de controle de faturamento</span>
                    </li>
                    <li className="flex items-start gap-3 text-sm text-zinc-300">
                      <CheckCircle2 size={16} className="text-amber-500 shrink-0 mt-0.5" />
                      <span>Pixel Master para rastreamento de sites de clientes</span>
                    </li>
                  </ul>
                </div>

                <Link href="/cadastro?plan=vitalicio" className="block w-full py-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-center font-black text-black transition-colors shadow-[0_0_25px_rgba(245,158,11,0.3)]">
                  GARANTIR ACESSO SEMESTRAL
                </Link>
              </div>

              {/* PLANO ANUAL (12 MESES + 3 MESES DE PROMOÇÃO) */}
              <div className="rounded-3xl border border-violet-500/30 bg-[#07070f] p-8 flex flex-col hover:border-violet-500/50 transition-all relative overflow-hidden shadow-[0_0_40px_rgba(124,58,237,0.05)]">
                {/* Posicionado no topo como elemento em fluxo para evitar sobreposição de textos em telas mobile */}
                <div className="mb-4 flex">
                  <span className="px-3 py-1 rounded-full bg-violet-600/20 border border-violet-500/30 text-violet-300 text-[10px] font-bold uppercase tracking-wider">
                    Melhor Custo-Benefício
                  </span>
                </div>
                
                <h3 className="text-xl font-bold text-white mb-2">Anual (12 Meses + 3 Meses Grátis)</h3>
                <p className="text-xs text-zinc-500 mb-6">Para quem está comprometido em dominar o mercado.</p>
                <div className="text-xs text-zinc-500 line-through mb-1">De R$ 975,00</div>
                <div className="flex items-baseline gap-1 mb-8">
                  <span className="text-zinc-500 font-semibold">Por R$</span>
                  <span className="text-5xl font-black text-white font-grotesk">345</span>
                  <span className="text-zinc-500 font-semibold">,90/ano</span>
                </div>
                
                <div className="flex-1">
                  <p className="text-[10px] font-bold text-violet-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Star size={12} /> RECURSOS INCLUSOS
                  </p>
                  <ul className="space-y-4 mb-10">
                    <li className="flex items-start gap-3 text-sm text-zinc-400">
                      <CheckCircle2 size={16} className="text-violet-500 shrink-0 mt-0.5" />
                      <span>Criação de funis completos com IA</span>
                    </li>
                    <li className="flex items-start gap-3 text-sm text-zinc-400">
                      <CheckCircle2 size={16} className="text-violet-500 shrink-0 mt-0.5" />
                      <span>E-books e copys ilimitados</span>
                    </li>
                    <li className="flex items-start gap-3 text-sm text-zinc-400">
                      <CheckCircle2 size={16} className="text-violet-500 shrink-0 mt-0.5" />
                      <span>Roteiros de WhatsApp prontos</span>
                    </li>
                    <li className="flex items-start gap-3 text-sm text-zinc-400">
                      <CheckCircle2 size={16} className="text-violet-500 shrink-0 mt-0.5" />
                      <span>Prompts para Gamma e Lovable App</span>
                    </li>
                    <li className="flex items-start gap-3 text-sm text-white bg-violet-950/20 p-3 rounded-lg border border-violet-500/25">
                      <MessageSquare size={16} className="text-violet-400 shrink-0 mt-0.5" />
                      <span><strong>Bônus:</strong> Suporte individual via WhatsApp</span>
                    </li>
                  </ul>
                </div>

                <Link href="/cadastro?plan=anual" className="block w-full py-3.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-center font-bold text-white transition-colors">
                  ASSINAR ANUAL
                </Link>
              </div>

            </div>

            {/* Reforço de garantia (sem contador fabricado) */}
            <div className="mt-12 text-center">
              <p className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full border border-violet-500/20 bg-violet-950/10 text-violet-300 font-semibold text-xs uppercase tracking-wider">
                <ShieldCheck size={14} /> Pagamento seguro · Sem taxas escondidas · Cancele quando quiser
              </p>
            </div>

          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="scroll-mt-20 py-24 border-t border-white/5 bg-[#05050b]">
          <div className="max-w-3xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-white">Perguntas Frequentes</h2>
            </div>
            
            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <div key={index} className="border border-white/10 rounded-xl bg-white/[0.01] overflow-hidden">
                  <button 
                    onClick={() => setOpenFaq(openFaq === index ? null : index)}
                    className="w-full px-6 py-5 flex items-center justify-between text-left focus:outline-none hover:bg-white/[0.02]"
                  >
                    <span className="font-semibold text-white">{faq.q}</span>
                    <ChevronDown size={18} className={`text-violet-500 transition-transform duration-300 ${openFaq === index ? 'rotate-180' : ''}`} />
                  </button>
                  <AnimatePresence>
                    {openFaq === index && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="px-6 pb-5 text-zinc-400 text-sm leading-relaxed border-t border-white/5 pt-4">
                          {faq.a}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </div>
        </section>

      </main>

      {/* FOOTER */}
      <footer className="py-12 border-t border-white/5 bg-[#070710] text-center">
        <div className="max-w-7xl mx-auto px-6 flex flex-col items-center">
          <div className="relative flex items-center justify-center w-12 h-12 rounded-xl bg-violet-950/50 border border-violet-500/30 mb-6 text-violet-400">
            <Radar size={26} className="animate-pulse" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-6">Comece sua jornada hoje mesmo.</h2>
          <Link href="#planos" className="inline-flex items-center gap-2 px-8 py-3.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-bold transition-all mb-12 shadow-[0_0_20px_rgba(124,58,237,0.3)]">
            Quero Começar Agora
          </Link>
          <p className="text-xs text-zinc-600">
            © {new Date().getFullYear()} ProspectMap. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  )
}
