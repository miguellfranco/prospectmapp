import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// Nunca fabrica um usuário fictício (ex.: plano vitalício ativo) se o banco
// falhar ou o id da sessão não bater com nenhuma conta real — isso já foi um
// bug real que dava acesso pago de graça durante instabilidades. Se não dá
// pra confirmar o usuário de verdade no banco, trata como não autenticado.
export async function getCurrentUser() {
  try {
    const session = await getServerSession(authOptions)
    const userId = (session?.user as any)?.id
    if (!userId) return null
    return await prisma.user.findUnique({ where: { id: userId } })
  } catch {
    return null
  }
}


