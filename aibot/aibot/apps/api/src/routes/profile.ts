import type { FastifyInstance } from 'fastify'
import { prisma } from '../index'
import { TOKEN_PLANS } from '@aibot/shared'
import { sanitizeUser } from './auth'

export async function plansRoutes(app: FastifyInstance) {
  app.get('/', async (_req, reply) => {
    return reply.send(TOKEN_PLANS)
  })
}

export async function profileRoutes(app: FastifyInstance) {
  app.get('/', { onRequest: [(app as any).authenticate] }, async (req, reply) => {
    const { userId } = req.user as { userId: string }
    const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } })
    return reply.send(sanitizeUser(user))
  })

  app.get('/generations', { onRequest: [(app as any).authenticate] }, async (req, reply) => {
    const { userId } = req.user as { userId: string }
    const { cursor, limit = '20' } = req.query as Record<string, string>
    const take = Math.min(Number(limit), 50)

    const items = await prisma.generation.findMany({
      where: { userId },
      take: take + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: { createdAt: 'desc' },
    })

    const hasMore = items.length > take
    if (hasMore) items.pop()

    return reply.send({ items, nextCursor: hasMore ? items[items.length - 1].id : null })
  })

  app.get('/transactions', { onRequest: [(app as any).authenticate] }, async (req, reply) => {
    const { userId } = req.user as { userId: string }
    const txs = await prisma.transaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })
    return reply.send(txs)
  })
}
