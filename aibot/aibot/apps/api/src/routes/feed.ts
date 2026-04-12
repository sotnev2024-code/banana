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
        tokensSpent: true,
        likesCount: true,
        createdAt: true,
        _count: { select: { comments: true } },
        user: { select: { firstName: true, username: true, photoUrl: true } },
      },
    })

    const hasMore = items.length > take
    if (hasMore) items.pop()

    const feedItems = items.map(item => ({
      ...item,
      commentsCount: (item as any)._count?.comments ?? 0,
      _count: undefined,
      thumbnailUrl: item.resultUrl?.includes('/uploads/gen/')
        ? item.resultUrl.replace('/uploads/gen/', '/uploads/gen/thumb/')
        : item.resultUrl,
    }))

    return reply.send({
      items: feedItems,
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
        comments: {
          include: { user: { select: { firstName: true, username: true, photoUrl: true } } },
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
        _count: { select: { comments: true } },
      },
    })

    if (!item) return reply.code(404).send({ error: 'Not found' })

    let isLiked = false
    let isFavorited = false
    try {
      const authHeader = req.headers.authorization
      if (authHeader) {
        const decoded = await (req as any).jwtVerify().catch(() => null)
        if (decoded?.userId) {
          const [like, fav] = await Promise.all([
            prisma.like.findUnique({ where: { userId_generationId: { userId: decoded.userId, generationId: id } } }),
            prisma.favorite.findUnique({ where: { userId_generationId: { userId: decoded.userId, generationId: id } } }),
          ])
          isLiked = !!like
          isFavorited = !!fav
        }
      }
    } catch {}

    return reply.send({
      ...item,
      commentsCount: (item as any)._count?.comments ?? 0,
      _count: undefined,
      isLiked,
      isFavorited,
    })
  })

  // POST /feed/:id/like — toggle like
  app.post('/:id/like', { onRequest: [(app as any).authenticate] }, async (req, reply) => {
    const { userId } = req.user as { userId: string }
    const { id } = req.params as { id: string }

    const existing = await prisma.like.findUnique({
      where: { userId_generationId: { userId, generationId: id } },
    })

    if (existing) {
      await prisma.$transaction([
        prisma.like.delete({ where: { id: existing.id } }),
        prisma.generation.update({ where: { id }, data: { likesCount: { decrement: 1 } } }),
      ])
      const gen = await prisma.generation.findUnique({ where: { id }, select: { likesCount: true } })
      return reply.send({ liked: false, likesCount: gen?.likesCount ?? 0 })
    } else {
      await prisma.$transaction([
        prisma.like.create({ data: { userId, generationId: id } }),
        prisma.generation.update({ where: { id }, data: { likesCount: { increment: 1 } } }),
      ])
      const gen = await prisma.generation.findUnique({ where: { id }, select: { likesCount: true } })
      return reply.send({ liked: true, likesCount: gen?.likesCount ?? 0 })
    }
  })

  // GET /feed/:id/comments
  app.get('/:id/comments', async (req, reply) => {
    const { id } = req.params as { id: string }
    const comments = await prisma.comment.findMany({
      where: { generationId: id },
      include: { user: { select: { firstName: true, username: true, photoUrl: true } } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })
    return reply.send(comments)
  })

  // POST /feed/:id/comments
  app.post('/:id/comments', { onRequest: [(app as any).authenticate] }, async (req, reply) => {
    const { userId } = req.user as { userId: string }
    const { id } = req.params as { id: string }
    const { text } = req.body as { text: string }

    if (!text?.trim() || text.length > 500) {
      return reply.code(400).send({ error: 'Invalid comment' })
    }

    const comment = await prisma.comment.create({
      data: { userId, generationId: id, text: text.trim() },
      include: { user: { select: { firstName: true, username: true, photoUrl: true } } },
    })

    return reply.send(comment)
  })
}
