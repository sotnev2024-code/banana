import type { FastifyInstance } from 'fastify'
import { prisma } from '../index'
import { notify } from '../notifications'

function getThumbnailUrl(resultUrl: string | null, type: string): string | null {
  if (!resultUrl) return null
  if (!resultUrl.includes('/uploads/gen/')) return resultUrl

  if (type === 'VIDEO' || type === 'MOTION') {
    // Video thumbnails are .jpg in thumb/ folder
    const id = resultUrl.split('/').pop()?.replace(/\.[^.]+$/, '')
    return resultUrl.replace('/uploads/gen/', '/uploads/gen/thumb/').replace(/\.[^.]+$/, '.jpg')
  }

  return resultUrl.replace('/uploads/gen/', '/uploads/gen/thumb/')
}

export async function feedRoutes(app: FastifyInstance) {
  // GET /feed?cursor=xxx&type=IMAGE&limit=20
  app.get('/', async (req, reply) => {
    const { cursor, type, limit = '20' } = req.query as Record<string, string>
    const take = Math.min(Number(limit), 50)

    const where: Record<string, unknown> = { isPublic: true, status: 'DONE', reportsCount: { lt: 3 } }
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
      thumbnailUrl: getThumbnailUrl(item.resultUrl, item.type),
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
    let isReported = false
    try {
      const authHeader = req.headers.authorization
      if (authHeader) {
        const decoded = await (req as any).jwtVerify().catch(() => null)
        if (decoded?.userId) {
          const [like, fav, report] = await Promise.all([
            prisma.like.findUnique({ where: { userId_generationId: { userId: decoded.userId, generationId: id } } }),
            prisma.favorite.findUnique({ where: { userId_generationId: { userId: decoded.userId, generationId: id } } }),
            prisma.report.findUnique({ where: { userId_generationId: { userId: decoded.userId, generationId: id } } }),
          ])
          isLiked = !!like
          isFavorited = !!fav
          isReported = !!report
        }
      }
    } catch {}

    return reply.send({
      ...item,
      commentsCount: (item as any)._count?.comments ?? 0,
      _count: undefined,
      isLiked,
      isFavorited,
      isReported,
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
      // Notify author
      const gen = await prisma.generation.findUnique({ where: { id }, select: { likesCount: true, userId: true } })
      if (gen && gen.userId !== userId) {
        const liker = await prisma.user.findUnique({ where: { id: userId }, select: { firstName: true } })
        notify(gen.userId, 'like', `${liker?.firstName} liked your work`, id)
      }
      return reply.send({ liked: true, likesCount: gen?.likesCount ?? 0 })
    }
  })

  // POST /feed/:id/report — report content
  app.post('/:id/report', { onRequest: [(app as any).authenticate] }, async (req, reply) => {
    const { userId } = req.user as { userId: string }
    const { id } = req.params as { id: string }
    const { reason = 'inappropriate' } = (req.body as { reason?: string }) ?? {}

    // Check if already reported
    const existing = await prisma.report.findUnique({
      where: { userId_generationId: { userId, generationId: id } },
    })
    if (existing) return reply.send({ ok: true, message: 'Already reported' })

    await prisma.$transaction([
      prisma.report.create({ data: { userId, generationId: id, reason } }),
      prisma.generation.update({ where: { id }, data: { reportsCount: { increment: 1 } } }),
    ])

    // Auto-hide after 3 reports
    const gen = await prisma.generation.findUnique({ where: { id }, select: { reportsCount: true } })
    if (gen && gen.reportsCount >= 3) {
      await prisma.generation.update({ where: { id }, data: { isPublic: false } })
    }

    return reply.send({ ok: true })
  })

  const ADMIN_IDS = ['1724263429']

  const commentSelect = {
    id: true, text: true, likesCount: true, parentId: true, createdAt: true, userId: true,
    user: { select: { firstName: true, username: true, photoUrl: true } },
    replies: {
      select: {
        id: true, text: true, likesCount: true, parentId: true, createdAt: true, userId: true,
        user: { select: { firstName: true, username: true, photoUrl: true } },
      },
      orderBy: { createdAt: 'asc' as const },
    },
  }

  // GET /feed/:id/comments — tree structure
  app.get('/:id/comments', async (req, reply) => {
    const { id } = req.params as { id: string }

    let currentUserId: string | null = null
    try {
      const decoded = await (req as any).jwtVerify().catch(() => null)
      if (decoded?.userId) currentUserId = decoded.userId
    } catch {}

    const comments = await prisma.comment.findMany({
      where: { generationId: id, parentId: null },
      select: commentSelect,
      orderBy: { createdAt: 'desc' },
      take: 100,
    })

    // Check which comments current user liked
    let likedIds = new Set<string>()
    if (currentUserId) {
      const allIds = comments.flatMap(c => [c.id, ...c.replies.map(r => r.id)])
      const likes = await prisma.commentLike.findMany({
        where: { userId: currentUserId, commentId: { in: allIds } },
        select: { commentId: true },
      })
      likedIds = new Set(likes.map(l => l.commentId))
    }

    const enriched = comments.map(c => ({
      ...c,
      isLiked: likedIds.has(c.id),
      isOwn: c.userId === currentUserId,
      replies: c.replies.map(r => ({
        ...r,
        isLiked: likedIds.has(r.id),
        isOwn: r.userId === currentUserId,
      })),
    }))

    return reply.send(enriched)
  })

  // POST /feed/:id/comments — create comment or reply
  app.post('/:id/comments', { onRequest: [(app as any).authenticate] }, async (req, reply) => {
    const { userId } = req.user as { userId: string }
    const { id } = req.params as { id: string }
    const { text, parentId } = req.body as { text: string; parentId?: string }

    if (!text?.trim() || text.length > 500) {
      return reply.code(400).send({ error: 'Invalid comment' })
    }

    const comment = await prisma.comment.create({
      data: { userId, generationId: id, text: text.trim(), parentId: parentId ?? null },
      include: { user: { select: { firstName: true, username: true, photoUrl: true } } },
    })

    // Notify
    const commenter = await prisma.user.findUnique({ where: { id: userId }, select: { firstName: true } })
    if (parentId) {
      // Reply notification to parent comment author
      const parent = await prisma.comment.findUnique({ where: { id: parentId }, select: { userId: true } })
      if (parent && parent.userId !== userId) {
        notify(parent.userId, 'reply', `${commenter?.firstName} replied to your comment`, id)
      }
    } else {
      // Comment notification to generation author
      const gen = await prisma.generation.findUnique({ where: { id }, select: { userId: true } })
      if (gen && gen.userId !== userId) {
        notify(gen.userId, 'comment', `${commenter?.firstName} commented on your work`, id)
      }
    }

    return reply.send({ ...comment, isLiked: false, isOwn: true, replies: [] })
  })

  // DELETE /feed/comments/:commentId
  app.delete('/comments/:commentId', { onRequest: [(app as any).authenticate] }, async (req, reply) => {
    const { userId, telegramId } = req.user as { userId: string; telegramId: string }
    const { commentId } = req.params as { commentId: string }

    const comment = await prisma.comment.findUnique({ where: { id: commentId } })
    if (!comment) return reply.code(404).send({ error: 'Not found' })

    const isAdmin = ADMIN_IDS.includes(telegramId)
    if (comment.userId !== userId && !isAdmin) {
      return reply.code(403).send({ error: 'Forbidden' })
    }

    // Cascade delete: replies + likes handled by onDelete: Cascade in schema
    await prisma.comment.delete({ where: { id: commentId } })

    return reply.send({ ok: true })
  })

  // POST /feed/comments/:commentId/like — toggle like
  app.post('/comments/:commentId/like', { onRequest: [(app as any).authenticate] }, async (req, reply) => {
    const { userId } = req.user as { userId: string }
    const { commentId } = req.params as { commentId: string }

    const existing = await prisma.commentLike.findUnique({
      where: { userId_commentId: { userId, commentId } },
    })

    if (existing) {
      await prisma.$transaction([
        prisma.commentLike.delete({ where: { id: existing.id } }),
        prisma.comment.update({ where: { id: commentId }, data: { likesCount: { decrement: 1 } } }),
      ])
      const c = await prisma.comment.findUnique({ where: { id: commentId }, select: { likesCount: true } })
      return reply.send({ liked: false, likesCount: c?.likesCount ?? 0 })
    } else {
      await prisma.$transaction([
        prisma.commentLike.create({ data: { userId, commentId } }),
        prisma.comment.update({ where: { id: commentId }, data: { likesCount: { increment: 1 } } }),
      ])
      const c = await prisma.comment.findUnique({ where: { id: commentId }, select: { likesCount: true } })
      return reply.send({ liked: true, likesCount: c?.likesCount ?? 0 })
    }
  })
}
