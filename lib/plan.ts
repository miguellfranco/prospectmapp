// Verificação de acesso pago — usada nas rotas de geração com IA.
// O fluxo de venda é: pagar na página inicial (AbacatePay) → conta criada/
// renovada com plano ativo. Contas criadas em /cadastro nascem "free" e só
// destravam a geração após assinar.

const PAID_PLANS = new Set(['mensal', 'trimestral', 'anual', 'vitalicio'])

export interface PlanUser {
  email?: string | null
  plan?: string | null
  planStatus?: string | null
  planExpiresAt?: Date | string | null
  isAdmin?: boolean | null
}

export function isAdminUser(user: PlanUser): boolean {
  const master = process.env.MASTER_EMAIL?.trim().toLowerCase()
  if (master && user.email?.toLowerCase() === master) return true
  return user.isAdmin === true
}

export function hasActiveAccess(user: PlanUser): boolean {
  // Administradores (dono + promovidos no Super Admin) sempre têm acesso
  if (isAdminUser(user)) return true

  if (!PAID_PLANS.has(user.plan ?? '')) return false
  if (user.planStatus !== 'active') return false
  // planExpiresAt null = contas legadas sem expiração; datas passadas bloqueiam
  if (user.planExpiresAt && new Date(user.planExpiresAt) < new Date()) return false
  return true
}

export const NO_ACCESS_MSG =
  'Seu plano não está ativo. Assine um plano na página inicial para criar infoprodutos com IA.'
