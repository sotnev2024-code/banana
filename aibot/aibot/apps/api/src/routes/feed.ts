import type { FastifyInstance } from 'fastify'
import { prisma } from '../index'

export async function feedRoutes(app: FastifyInstance) {
  // GET /feed?cursor=xxx&type=IMAGE&limit=20
  app.get('/', async (req, reply) => {
    const { cursor, type, limit = '20' } = req.query as Record<string, string>
    const take = Math.min(Number(limit), 50)

    const where: Record<string, unknown> = { isPublic: true, status: 'DONE' }
    if (type && type !== 'ALL') where.type = type

    const items = await prisma.generation.findMany({
      where,
      take: take + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        type: true,
        model: true,
        prompt: true,
        resultUrl: true,
        createdAt: true,
        user: { select: { firstName: true, username: true, photoUrl: true } },
      },
    })

    const hasMore = items.length > take
    if (hasMore) items.pop()

    return reply.send({
      items,
      nextCursor: hasMore ? items[items.length - 1].id : null,
    })
  })
}
