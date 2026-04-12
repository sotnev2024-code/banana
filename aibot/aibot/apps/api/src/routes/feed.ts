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

  // GET /feed/:id — single generation detail
  app.get('/:id', async (req, reply) => {
    const { id } = req.params as { id: string }

    const item = await prisma.generation.findUnique({
      where: { id },
      include: {
        user: { select: { firstName: true, username: true, photoUrl: true } },
      },
    })

    if (!item) return reply.code(404).send({ error: 'Not found' })

    // Check if favorited by current user (if authenticated)
    let isFavorited = false
    try {
      const authHeader = req.headers.authorization
      if (authHeader) {
        const decoded = await (req as any).jwtVerify().catch(() => null)
        if (decoded?.userId) {
          const fav = await prisma.favorite.findUnique({
            where: { userId_generationId: { userId: decoded.userId, generationId: id } },
          })
          isFavorited = !!fav
        }
      }
    } catch {}

    return reply.send({
      ...item,
      telegramId: undefined,
      isFavorited,
    })
  })
}
