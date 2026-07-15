'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BookOpen, ChevronDown, CheckCircle2, Sparkles, Zap, ShieldCheck,
  Menu, X as CloseIcon, CreditCard, Headset, Wand2, Tag, Globe, Megaphone,
  Infinity as InfinityIcon,
} from 'lucide-react'
import { PixCheckoutModal } from '@/components/lz/pix-checkout-modal'

export default function InfoBookLanding() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [checkoutPlan, setCheckoutPlan] = useState<string | null>(null)

  const steps = [
    {
      step: 'PASSO — 1',
      title: 'E-book pronto com IA',
      desc: 'Escolha o nicho e a dor principal do seu público. A IA escreve um e-book completo, estruturado e pronto para entregar.',
      icon: Wand2,
    },
    {
      step: 'PASSO — 2',
      title: 'Produto no ar',
      desc: 'Defina o preço com sugestão inteligente e conecte sua conta Kiwify ou Hotmart para receber pelas vendas.',
      icon: Tag,
    },
    {
      step: 'PASSO — 3',
      title: 'Página de vendas pronta',
      desc: 'A IA escreve a copy persuasiva e entrega sua landing page pronta, nas suas cores — você publica grátis com 1 clique e a página é 100% sua.',
      icon: Globe,
    },
    {
      step: 'PASSO — 4',
      title: 'Divulgação guiada',
      desc: 'Descubra comunidades do seu nicho e gere mensagens de divulgação com IA para postar onde seu público está.',
      icon: Megaphone,
    },
  ]

  const features = [
    { icon: Wand2, title: 'E-books ilimitados', desc: 'Gere quantos e-books quiser, em mais de 20 nichos validados ou em qualquer nicho que você digitar.' },
    { icon: Globe, title: 'Landing page 100% sua', desc: 'Baixe a página pronta com copy de conversão feita por IA e publique grátis onde quiser — com pré-visualização instantânea.' },
    { icon: CreditCard, title: 'Integração com gateways', desc: 'Conecte Kiwify ou Hotmart e acompanhe as vendas dos seus produtos direto no painel.' },
    { icon: Zap, title: 'Painel de faturamento', desc: 'Veja seu faturamento de hoje, da semana e do mês, com gráfico diário e histórico por produto.' },
  ]

  const faqs = [
    {
      q: 'Preciso saber escrever ou programar?',
      a: 'Não. Você só escolhe o nicho e a dor que o produto resolve — a IA escreve o e-book inteiro e a copy da página de vendas. Tudo é editável se você quiser dar seu toque.',
    },
    {
      q: 'Como eu recebo o dinheiro das vendas?',
      a: 'As vendas acontecem no seu gateway (Kiwify ou Hotmart), com o dinheiro caindo direto na sua conta. O InfoBook não fica com nenhuma comissão sobre as suas vendas.',
    },
    {
      q: 'A página de vendas fica hospedada onde?',
      a: 'Onde você quiser — a página é sua. Você baixa o arquivo pronto e publica grátis em 1 minuto em serviços como Netlify ou Vercel (mostramos como). Também geramos uma pré-visualização instantânea para você conferir o resultado antes de publicar.',
    },
    {
      q: 'Posso editar o e-book que a IA gerar?',
      a: 'Sim. O conteúdo é gerado em formato editável: você pode revisar, cortar, acrescentar e baixar o arquivo final para entregar aos compradores.',
    },
    {
      q: 'O plano Vitalício é pagamento único mesmo?',
      a: 'Sim. Você paga R$ 297 uma única vez e tem acesso para sempre, incluindo as atualizações da plataforma. Sem mensalidade.',
    },
  ]

  return (
    <div className="min-h-screen bg-[#05050b] text-zinc-300 font-sans selection:bg-violet-600/30 overflow-x-hidden">

      {/* HEADER */}
      <header className="fixed top-0 w-full z-50 border-b border-white/5 bg-[#05050b]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-violet-950/50 border border-violet-500/30 shadow-[0_0_20px_rgba(124,58,237,0.25)] text-violet-400">
              <BookOpen size={22} />
            </div>
            <span className="font-bold text-2xl text-white tracking-tight font-grotesk">InfoBook</span>
          </div>

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
              Começar Agora
            </Link>
          </div>

          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="md:hidden flex items-center justify-center h-10 w-10 rounded-lg text-zinc-300 hover:text-white hover:bg-white/5 transition-colors"
            aria-label="Abrir menu"
          >
            {menuOpen ? <CloseIcon size={22} /> : <Menu size={22} />}
          </button>
        </div>

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
                  Começar Agora
                </Link>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main className="pt-20">

        {/* HERO */}
        <section className="relative pt-24 pb-32 overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1000px] h-[600px] bg-violet-900/10 blur-[150px] pointer-events-none rounded-full" />

          <div className="max-w-5xl mx-auto px-6 text-center relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-violet-500/30 bg-violet-950/30 text-violet-300 text-xs font-semibold uppercase tracking-wider mb-8">
                <Sparkles size={14} />
                Do zero ao produto no ar em 4 passos
              </div>
              <h1 className="text-5xl md:text-7xl font-bold text-white tracking-tight leading-[1.1] mb-8 font-grotesk">
                Crie um infoproduto completo<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-fuchsia-400 to-violet-300">com Inteligência Artificial.</span>
              </h1>

              <p className="text-xl text-zinc-400 mb-12 max-w-3xl mx-auto leading-relaxed">
                E-book escrito pela IA, produto conectado ao seu gateway, página de vendas publicada com URL própria
                e plano de divulgação — <strong className="text-white">tudo em uma única ferramenta</strong>.
              </p>

              <Link href="#planos" className="inline-flex items-center justify-center gap-3 px-10 py-5 rounded-xl bg-gradient-to-r from-violet-600 to-violet-800 hover:from-violet-500 hover:to-violet-700 text-white font-black text-lg shadow-[0_0_40px_rgba(124,58,237,0.4)] transition-all hover:scale-[1.02] active:scale-95 group">
                QUERO CRIAR MEU PRODUTO
                <Zap size={22} className="group-hover:animate-bounce" />
              </Link>
            </motion.div>

            {/* Mockup do wizard */}
            <motion.div
              initial={{ opacity: 0, y: 80 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.2 }}
              className="mt-20 relative mx-auto max-w-5xl"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-violet-500/10 to-transparent blur-3xl -z-10" />
              <div className="rounded-2xl border border-white/5 bg-[#080812]/95 shadow-2xl overflow-hidden ring-1 ring-white/10">

                <div className="h-12 border-b border-white/5 flex items-center px-4 gap-2 bg-[#05050c]/80">
                  <div className="flex gap-1.5">
                    <div className="w-3.5 h-3.5 rounded-full bg-red-500/80" />
                    <div className="w-3.5 h-3.5 rounded-full bg-yellow-500/80" />
                    <div className="w-3.5 h-3.5 rounded-full bg-green-500/80" />
                  </div>
                  <div className="mx-auto px-4 py-1 rounded bg-white/5 text-[10px] text-zinc-500 font-mono flex items-center gap-2">
                    <ShieldCheck size={12} className="text-violet-500" />
                    infobook — nova estrutura
                  </div>
                </div>

                <div className="p-6 md:p-10 text-left">
                  {/* Barra de progresso dos 4 passos */}
                  <div className="flex items-center justify-between max-w-2xl mx-auto mb-10">
                    {['E-book', 'Produto', 'Página', 'Grupos'].map((label, i) => (
                      <div key={label} className="flex items-center flex-1 last:flex-none">
                        <div className="flex flex-col items-center gap-2">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold font-mono border ${i === 0 ? 'bg-violet-600 border-violet-400 text-white shadow-[0_0_16px_rgba(124,58,237,0.6)]' : 'bg-white/5 border-white/10 text-zinc-500'}`}>
                            {i + 1}
                          </div>
                          <span className={`text-[10px] font-semibold ${i === 0 ? 'text-violet-300' : 'text-zinc-600'}`}>{label}</span>
                        </div>
                        {i < 3 && <div className="flex-1 h-px bg-white/10 mx-2 mb-5" />}
                      </div>
                    ))}
                  </div>

                  <div className="text-center mb-8">
                    <p className="text-white font-bold text-lg font-grotesk">Criar E-book</p>
                    <p className="text-zinc-500 text-xs mt-1">Escolha o nicho e o sub-nicho — a IA entrega o e-book pronto.</p>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-3xl mx-auto">
                    {['Emagrecimento', 'Finanças', 'Relacionamento', 'Marketing', 'Saúde Mental', 'Culinária', 'Fitness', 'Air Fryer'].map((n, i) => (
                      <div key={n} className={`px-4 py-3 rounded-xl border text-xs font-medium text-center ${i === 0 ? 'border-violet-500/60 bg-violet-950/40 text-violet-200' : 'border-white/10 bg-white/[0.03] text-zinc-400'}`}>
                        {n}
                      </div>
                    ))}
                  </div>

                  <div className="max-w-3xl mx-auto mt-6">
                    <div className="w-full py-3.5 rounded-xl bg-gradient-to-r from-violet-600 to-violet-800 text-center text-white text-sm font-bold shadow-[0_0_25px_rgba(124,58,237,0.35)]">
                      ✨ Gerar E-book com IA
                    </div>
                  </div>
                </div>

              </div>
            </motion.div>
          </div>
        </section>

        {/* COMO FUNCIONA — 4 PASSOS */}
        <section id="como-funciona" className="scroll-mt-20 py-28 border-y border-white/5 bg-[#070710] relative">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-sm font-semibold tracking-wider text-violet-400 uppercase mb-3">COMO FUNCIONA</h2>
              <h3 className="text-4xl font-bold text-white tracking-tight font-grotesk">Seu funil completo em 4 passos</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {steps.map((s, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.12 }}
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

        {/* FUNCIONALIDADES */}
        <section id="funcionalidades" className="scroll-mt-20 py-28 relative">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-20">
              <h2 className="text-4xl font-bold text-white tracking-tight font-grotesk">Tudo o que você precisa para vender</h2>
              <p className="text-zinc-400 max-w-xl mx-auto mt-2">Da criação do conteúdo ao acompanhamento do faturamento — sem sair da plataforma.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((w, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.98 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
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

        {/* TRUST BAR */}
        <section className="py-24 bg-gradient-to-b from-[#080812] to-[#05050b] border-t border-white/5">
          <div className="max-w-5xl mx-auto px-6 text-center">
            <div className="max-w-3xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-4 mb-16">
              {[
                { icon: CreditCard, text: 'Você recebe 100% das suas vendas — sem comissão do InfoBook' },
                { icon: Zap, text: 'Acesso liberado na hora, após a confirmação do pagamento' },
                { icon: Headset, text: 'Suporte direto pelo WhatsApp' },
              ].map((t, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.08 }}
                  className="flex items-center gap-3 p-5 rounded-2xl border border-white/5 bg-white/[0.01] hover:border-violet-500/20 text-left transition-colors"
                >
                  <t.icon size={20} className="text-violet-400 shrink-0" />
                  <span className="text-xs text-zinc-300">{t.text}</span>
                </motion.div>
              ))}
            </div>

            <Link href="#planos" className="inline-flex items-center justify-center px-8 py-4 rounded-lg bg-white/5 border border-white/10 text-white font-bold hover:bg-white/10 hover:border-violet-500/40 transition-all">
              Ver os planos
            </Link>
          </div>
        </section>

        {/* PLANOS */}
        <section id="planos" className="scroll-mt-20 py-32 relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-violet-900/5 blur-[150px] pointer-events-none rounded-full" />

          <div className="max-w-5xl mx-auto px-6 relative z-10">
            <div className="text-center mb-20">
              <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-4 font-grotesk">Escolha seu plano</h2>
              <p className="text-zinc-400 max-w-xl mx-auto">Sem taxas sobre as suas vendas. Cancele quando quiser.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch max-w-5xl mx-auto">

              {/* PLANO MENSAL */}
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="rounded-3xl border border-white/10 bg-[#07070f] p-8 flex flex-col hover:border-violet-500/20 hover:-translate-y-1 transition-all">
                <h3 className="text-xl font-bold text-white mb-2">Mensal</h3>
                <p className="text-xs text-zinc-500 mb-8">Para começar agora e validar seu primeiro produto.</p>
                <div className="flex items-baseline gap-1 mb-8">
                  <span className="text-zinc-500 font-semibold">R$</span>
                  <span className="text-5xl font-black text-white font-grotesk">97</span>
                  <span className="text-zinc-500 font-semibold">/mês</span>
                </div>

                <ul className="flex-1 space-y-4 mb-10">
                  {[
                    'E-books ilimitados gerados com IA',
                    'Páginas de vendas publicadas com URL própria',
                    'Copy persuasiva e mensagens de divulgação com IA',
                    'Integração com Kiwify e Hotmart',
                    'Painel de faturamento em tempo real',
                  ].map((f) => (
                    <li key={f} className="flex items-start gap-3 text-sm text-zinc-400">
                      <CheckCircle2 size={16} className="text-violet-500 shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <button onClick={() => setCheckoutPlan('mensal')} className="block w-full py-3.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-center font-bold text-white transition-colors">
                  ASSINAR MENSAL
                </button>
              </motion.div>

              {/* PLANO TRIMESTRAL */}
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.05 }}
                className="rounded-3xl border border-white/10 bg-[#07070f] p-8 flex flex-col hover:border-violet-500/30 hover:-translate-y-1 transition-all relative">
                <div className="mb-3 flex">
                  <span className="px-3 py-1 rounded-full bg-violet-600/20 border border-violet-500/30 text-violet-300 text-[10px] font-bold uppercase tracking-wider">
                    Economize 32%
                  </span>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Trimestral</h3>
                <p className="text-xs text-zinc-500 mb-6">3 meses para lançar e escalar seus produtos.</p>
                <div className="text-xs text-zinc-500 line-through mb-1">De R$ 291,00</div>
                <div className="flex items-baseline gap-1 mb-8">
                  <span className="text-zinc-500 font-semibold">R$</span>
                  <span className="text-5xl font-black text-white font-grotesk">197</span>
                  <span className="text-zinc-500 font-semibold">/trimestre</span>
                </div>

                <ul className="flex-1 space-y-4 mb-10">
                  {[
                    'Tudo do plano Mensal',
                    '3 meses de acesso completo',
                    'Melhor preço para validar vários nichos',
                  ].map((f) => (
                    <li key={f} className="flex items-start gap-3 text-sm text-zinc-400">
                      <CheckCircle2 size={16} className="text-violet-500 shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <button onClick={() => setCheckoutPlan('trimestral')} className="block w-full py-3.5 rounded-xl border border-violet-500/40 bg-violet-950/20 hover:bg-violet-950/40 text-center font-bold text-white transition-colors">
                  ASSINAR TRIMESTRAL
                </button>
              </motion.div>

              {/* PLANO VITALÍCIO (DESTAQUE) */}
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="rounded-3xl border-2 border-violet-500 bg-violet-950/15 p-8 flex flex-col relative md:-translate-y-4 shadow-[0_0_50px_rgba(124,58,237,0.2)] transition-transform">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-6 py-1.5 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-600 text-white text-[10px] font-black tracking-widest uppercase whitespace-nowrap">
                  Mais Vantajoso 🔥
                </div>

                <div className="flex items-center gap-2 mb-2 mt-2">
                  <InfinityIcon size={20} className="text-violet-400" />
                  <h3 className="text-xl font-bold text-white">Vitalício</h3>
                </div>
                <p className="text-xs text-violet-300 mb-6">Pague uma vez, use para sempre. Sem mensalidade.</p>
                <div className="flex items-baseline gap-1 mb-8">
                  <span className="text-zinc-500 font-semibold">R$</span>
                  <span className="text-5xl font-black text-white font-grotesk">297</span>
                  <span className="text-zinc-500 font-semibold">único</span>
                </div>

                <div className="flex-1">
                  <ul className="space-y-4 mb-10">
                    {[
                      'Tudo do plano Mensal',
                      'Acesso vitalício — pagamento único',
                      'Todas as atualizações futuras incluídas',
                    ].map((f) => (
                      <li key={f} className="flex items-start gap-3 text-sm text-zinc-300">
                        <CheckCircle2 size={16} className="text-violet-400 shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </li>
                    ))}
                    <li className="flex items-start gap-3 text-sm text-white bg-violet-900/30 p-3 rounded-lg border border-violet-500/20">
                      <Headset size={16} className="text-violet-300 shrink-0 mt-0.5" />
                      <span><strong>Bônus:</strong> Suporte individual via WhatsApp</span>
                    </li>
                  </ul>
                </div>

                <button onClick={() => setCheckoutPlan('vitalicio')} className="block w-full py-4 rounded-xl bg-gradient-to-r from-violet-600 to-violet-800 hover:from-violet-500 hover:to-violet-700 text-center font-black text-white transition-colors shadow-[0_0_25px_rgba(124,58,237,0.4)]">
                  GARANTIR ACESSO VITALÍCIO
                </button>
              </motion.div>

            </div>

            <div className="mt-12 text-center">
              <p className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full border border-violet-500/20 bg-violet-950/10 text-violet-300 font-semibold text-xs uppercase tracking-wider">
                <ShieldCheck size={14} /> Pagamento seguro via PIX ou cartão · Sem taxas escondidas
              </p>
            </div>

          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="scroll-mt-20 py-24 border-t border-white/5 bg-[#05050b]">
          <div className="max-w-3xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-white font-grotesk">Perguntas Frequentes</h2>
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
            <BookOpen size={26} />
          </div>
          <h2 className="text-2xl font-bold text-white mb-6 font-grotesk">Seu primeiro infoproduto está a 4 passos de distância.</h2>
          <Link href="#planos" className="inline-flex items-center gap-2 px-8 py-3.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-bold transition-all mb-12 shadow-[0_0_20px_rgba(124,58,237,0.3)]">
            Criar meu produto agora
          </Link>
          <p className="text-xs text-zinc-600">
            © {new Date().getFullYear()} InfoBook. Todos os direitos reservados.
          </p>
        </div>
      </footer>

      {checkoutPlan && (
        <PixCheckoutModal plan={checkoutPlan} onClose={() => setCheckoutPlan(null)} />
      )}
    </div>
  )
}
