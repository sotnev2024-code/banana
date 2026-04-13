import type { FastifyInstance } from 'fastify'
import { prisma } from '../index'

export async function usersRoutes(app: FastifyInstance) {
  // GET /users/:id — public profile
  app.get('/:id', async (req, reply) => {
    const { id } = req.params as { id: string }

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true, firstName: true, username: true, photoUrl: true,
        minDonate: true, createdAt: true,
        _count: { select: { generations: { where: { status: 'DONE', isPublic: true } } } },
      },
    })

    if (!user) return reply.code(404).send({ error: 'Not found' })

    // Count total likes on user's generations
    const likesResult = await prisma.generation.aggregate({
      where: { userId: id, status: 'DONE', isPublic: true },
      _sum: { likesCount: true },
    })

    return reply.send({
      id: user.id,
      firstName: user.firstName,
      username: user.username,
      photoUrl: user.photoUrl,
      minDonate: user.minDonate,
      createdAt: user.createdAt.toISOString(),
      generationsCount: user._count.generations,
      totalLikes: likesResult._sum.likesCount ?? 0,
    })
  })

  // GET /users/:id/generations — user's public generations
  app.get('/:id/generations', async (req, reply) => {
    const { id } = req.params as { id: string }
    const { cursor } = req.query as Record<string, string>
    const take = 20

    const items = await prisma.generation.findMany({
      where: { userId: id, status: 'DONE', isPublic: true },
      take: take + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, type: true, model: true, resultUrl: true,
        likesCount: true, createdAt: true,
      },
    })

    const hasMore = items.length > take
    if (hasMore) items.pop()

    const feedItems = items.map(item => ({
      ...item,
      thumbnailUrl: item.resultUrl?.includes('/uploads/gen/')
        ? item.resultUrl.replace('/uploads/gen/', '/uploads/gen/thumb/')
        : item.resultUrl,
    }))

    return reply.send({
      items: feedItems,
      nextCursor: hasMore ? items[items.length - 1].id : null,
    })
  })

  // POST /users/:id/donate — send tokens
  app.post('/:id/donate', { onRequest: [(app as any).authenticate] }, async (req, reply) => {
    const { userId: fromUserId } = req.user as { userId: string }
    const { id: toUserId } = req.params as { id: string }
    const { amount, message } = req.body as { amount: number; message?: string }

    if (fromUserId === toUserId) {
      return reply.code(400).send({ error: 'Cannot donate to yourself' })
    }

    if (!amount || amount < 1) {
      return reply.code(400).send({ error: 'Invalid amount' })
    }

    // Check min donate
    const toUser = await prisma.user.findUnique({ where: { id: toUserId }, select: { minDonate: true, telegramId: true, firstName: true } })
    if (!toUser) return reply.code(404).send({ error: 'User not found' })

    if (amount < toUser.minDonate) {
      return reply.code(400).send({ error: `Minimum donation: ${toUser.minDonate} tokens` })
    }

    // Check sender balance
    const fromUser = await prisma.user.findUnique({ where: { id: fromUserId }, select: { balance: true, firstName: true } })
    if (!fromUser || fromUser.balance < amount) {
      return reply.code(402).send({ error: 'Insufficient balance' })
    }

    // Transfer
    await prisma.$transaction([
      prisma.user.update({ where: { id: fromUserId }, data: { balance: { decrement: amount } } }),
      prisma.user.update({ where: { id: toUserId }, data: { balance: { increment: amount } } }),
      prisma.transaction.create({
        data: { userId: fromUserId, amount: -amount, type: 'SPEND', description: `Donate to ${toUser.firstName}` },
      }),
      prisma.transaction.create({
        data: { userId: toUserId, amount, type: 'BONUS', description: `Donate from ${fromUser.firstName}${message ? ': ' + message.slice(0, 100) : ''}` },
      }),
      prisma.donation.create({
        data: { fromUserId, toUserId, amount, message: message?.slice(0, 200) ?? null },
      }),
    ])

    // Notify recipient via Telegram
    try {
      const BOT_TOKEN = process.env.BOT_TOKEN
      if (BOT_TOKEN) {
        let text = `+${amount} tokens from ${fromUser.firstName}`
        if (message) text += `\n\n"${message.slice(0, 200)}"`
        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: toUser.telegramId.toString(), text }),
        })
      }
    } catch {}

    return reply.send({ ok: true })
  })
}
