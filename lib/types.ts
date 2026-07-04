export type Tier = 'hot' | 'warm' | 'cold'
export type Plan = 'mensal' | 'vitalicio' | 'free'

export interface LeadDTO {
  id: string
  businessName: string
  phone: string | null
  city: string | null
  niche: string | null
  rating: number | null
  reviewCount: number | null
  hasWebsite: boolean
  yearsWithoutSite: number | null
  score: number
  tier: string
  status: string
  createdAt: string
}

export interface SaleDTO {
  id: string
  niche: string | null
  city: string | null
  saleValue: number | null
  description: string | null
  createdAt: string
  userName?: string | null
}

export const NICHE_ICONS: Record<string, string> = {
  restaurante: 'utensils',
  academia: 'dumbbell',
  salao: 'scissors',
  clinica: 'stethoscope',
  pizzaria: 'pizza',
  petshop: 'paw-print',
  barbearia: 'scissors',
  estetica: 'sparkles',
  oficina: 'wrench',
  advocacia: 'scale',
  imobiliaria: 'home',
  contabilidade: 'calculator',
  default: 'building-2',
}
