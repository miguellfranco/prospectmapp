'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { DollarSign, Sparkles, Award, Zap } from 'lucide-react'

const NAMES = [
  "Mariana Costa Silva", "Carlos Mendes Rezende", "Rafael Oliveira Santos", 
  "Juliana Alves Pereira", "Bruno Santos Moreira", "Fernanda Lima Castro", 
  "Lucas Pereira Souza", "Amanda Rocha Fernandes", "Thiago Souza Araujo", 
  "Ana Beatriz Cardoso", "Felipe Carvalho Gomes", "Camila Rodrigues Lima", 
  "Gustavo Xavier Martins", "Letícia Barros Barbosa", "Rodrigo Nogueira Pinto",
  "Gisele Albuquerque Silva", "Renato Cariani Mendes", "Beatriz Viana Souza", 
  "Ricardo Santos Rezende", "Julio Cesar Albuquerque", "Claudio Duarte Martins"
]

const CITIES = [
  "São Paulo, SP", "Rio de Janeiro, RJ", "Belo Horizonte, MG", 
  "Curitiba, PR", "Salvador, BA", "Porto Alegre, RS", 
  "Recife, PE", "Fortaleza, CE", "Florianópolis, SC", "Campinas, SP"
]

const NICHES = [
  { key: "academia", label: "Academia", emoji: "🏋️" },
  { key: "restaurante", label: "Restaurante", emoji: "🍕" },
  { key: "salao", label: "Salão de Beleza", emoji: "💇" },
  { key: "barbearia", label: "Barbearia", emoji: "💈" },
  { key: "clinica", label: "Clínica", emoji: "🏥" },
  { key: "pizzaria", label: "Pizzaria", emoji: "🍕" },
  { key: "petshop", label: "Pet Shop", emoji: "🐾" },
  { key: "estetica", label: "Estética", emoji: "💅" },
  { key: "oficina", label: "Oficina Mecânica", emoji: "🔧" },
  { key: "advocacia", label: "Advocacia", emoji: "💼" },
  { key: "imobiliaria", label: "Imobiliária", emoji: "🏠" },
  { key: "contabilidade", label: "Contabilidade", emoji: "📊" }
]

const GRADIENTS = [
  "linear-gradient(135deg, #7c3aed, #a855f7)",
  "linear-gradient(135deg, #ec4899, #8b5cf6)",
  "linear-gradient(135deg, #3b82f6, #8b5cf6)",
  "linear-gradient(135deg, #10b981, #3b82f6)",
  "linear-gradient(135deg, #f59e0b, #ec4899)"
]

export function LiveSalesToast() {
  const [notification, setNotification] = useState<any>(null)

  useEffect(() => {
    // Show first toast after 3 seconds
    const startTimeout = setTimeout(triggerRandomSale, 3000)

    // Repeat every 14-22 seconds for active ranking feel
    const interval = setInterval(() => {
      triggerRandomSale()
    }, 18000)

    return () => {
      clearTimeout(startTimeout)
      clearInterval(interval)
    }
  }, [])

  function triggerRandomSale() {
    const name = NAMES[Math.floor(Math.random() * NAMES.length)]
    const city = CITIES[Math.floor(Math.random() * CITIES.length)]
    const nicheObj = NICHES[Math.floor(Math.random() * NICHES.length)]
    const val = [600, 800, 1200, 1500, 1800, 2000, 2500][Math.floor(Math.random() * 7)]
    const minutes = Math.floor(1 + Math.random() * 9)

    const parts = name.split(' ')
    const initials = ((parts[0]?.charAt(0) || '') + (parts[parts.length - 1]?.charAt(0) || '')).toUpperCase()
    
    let hash = 0
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash)
    }
    const gradient = GRADIENTS[Math.abs(hash) % GRADIENTS.length]

    setNotification({
      name,
      city,
      niche: nicheObj.label,
      emoji: nicheObj.emoji,
      value: val,
      time: `há ${minutes} min`,
      initials,
      gradient
    })

    // Hide toast after 6 seconds
    setTimeout(() => {
      setNotification(null)
    }, 6000)
  }

  return (
    <AnimatePresence>
      {notification && (
        <motion.div
          initial={{ opacity: 0, y: 70, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 280, damping: 22 }}
          className="fixed bottom-6 right-6 z-[9999] max-w-sm w-full p-4 flex gap-3 items-center rounded-2xl border"
          style={{
            borderColor: 'rgba(124, 58, 237, 0.4)',
            boxShadow: '0 20px 50px rgba(0,0,0,0.85), 0 0 30px rgba(124,58,237,0.2)',
            background: 'rgba(15, 15, 30, 0.96)',
            backdropFilter: 'blur(20px)'
          }}
        >
          {/* Circular avatar with gradient & pulsing effect */}
          <div className="relative shrink-0">
            <div
              className="h-11 w-11 rounded-full flex items-center justify-center font-grotesk font-bold text-xs text-white shadow-lg"
              style={{ background: notification.gradient }}
            >
              {notification.initials}
            </div>
            <span className="absolute -bottom-1 -right-1 h-5.5 w-5.5 rounded-full bg-emerald-500 border-2 border-[#0d0d1a] flex items-center justify-center text-[10px] text-white">
              <Zap size={10} />
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 justify-between">
              <span className="text-[10px] font-grotesk font-bold flex items-center gap-1 text-[var(--purple-soft)] tracking-wider">
                <Sparkles size={11} className="animate-spin text-glow" /> VENDA AO VIVO
              </span>
              <span className="text-[9px] font-jet text-zinc-400">
                {notification.time}
              </span>
            </div>
            <p className="text-xs mt-1 text-zinc-200">
              <span className="font-bold text-white">{notification.name}</span> de {notification.city.split(',')[0]} fechou um cliente de <span className="font-semibold text-white">{notification.niche}</span> {notification.emoji}
            </p>
            <div className="flex items-center gap-1 mt-1 text-[11px] font-jet font-bold text-emerald-400">
              <DollarSign size={11} /> Faturamento: R$ {notification.value.toLocaleString('pt-BR')}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
