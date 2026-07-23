// Diretório real de grupos de WhatsApp (gruposwhats.app) — indicado pelo
// usuário. Slugs de categoria conferidos direto no sitemap oficial do site
// (https://gruposwhats.app/sitemap-categories.xml) e testados de verdade
// (a categoria de emagrecimento mostra grupos reais e relevantes, não
// conteúdo genérico) — NÃO adivinhar slug novo sem repetir essa checagem.
//
// Só mapeamos nichos com correspondência real e verificável no site. Nicho
// sem categoria boa (ex: idiomas, pets, milhas — o site não tem isso) cai no
// fallback de busca no Google que já existia, em vez de forçar uma categoria
// que não bate com o tema.

import { resolveNicheId } from './niche-icons'

const CATEGORY_SLUG: Record<string, string> = {
  emagrecimento: 'emagrecimento-e-perda-de-peso',
  fitness: 'emagrecimento-e-perda-de-peso', // sem categoria própria de fitness no site — tema mais próximo
  financas: 'investimentos-e-financas',
  'renda-extra': 'ganhar-dinheiro',
  relacionamento: 'amor-e-romance',
  culinaria: 'receitas',
  'air-fryer': 'receitas',
  educacao: 'educacao',
  religiao: 'religiao',
  carreira: 'vagas-de-empregos',
  viagem: 'viagem-e-turismo',
  skincare: 'moda-e-beleza',
}

export function whatsappDirectoryUrl(nicheIdOrLabel: string): string | null {
  const id = resolveNicheId(nicheIdOrLabel)
  const slug = id ? CATEGORY_SLUG[id] : undefined
  return slug ? `https://gruposwhats.app/category/${slug}` : null
}
