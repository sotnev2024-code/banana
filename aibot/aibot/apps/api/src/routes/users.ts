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
        _count: { select: { generations: { where: { status: 'DONE', isPublic: true } }, payments: { where: { status: 'SUCCEEDED' } } } },
      },
    })

    if (!user) return reply.code(404).send({ error: 'Not found' })

    const likesResult = await prisma.generation.aggregate({
      where: { userId: id, status: 'DONE', isPublic: true },
      _sum: { likesCount: true },
    })

    // Check follow status
    let isFollowing = false
    let followersCount = 0
    try {
      followersCount = await prisma.follow.count({ where: { followingId: id } })
      const decoded = await (req as any).jwtVerify().catch(() => null)
      if (decoded?.userId) {
        const f = await prisma.follow.findUnique({
          where: { followerId_followingId: { followerId: decoded.userId, followingId: id } },
        })
        isFollowing = !!f
      }
    } catch {}

    return reply.send({
      id: user.id,
      firstName: user.firstName,
      username: user.username,
      photoUrl: user.photoUrl,
      minDonate: user.minDonate,
      canReceiveDonations: user._count.payments > 0,
      isFollowing,
      followersCount,
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

    // Check both users have made at least one payment
    const [senderPayments, recipientPayments] = await Promise.all([
      prisma.payment.count({ where: { userId: fromUserId, status: 'SUCCEEDED' } }),
      prisma.payment.count({ where: { userId: toUserId, status: 'SUCCEEDED' } }),
    ])

    if (senderPayments === 0) {
      return reply.code(403).send({ error: 'Top up your balance first to enable donations' })
    }
    if (recipientPayments === 0) {
      return reply.code(403).send({ error: 'This user cannot receive donations yet' })
    }

    // Check min donate
    const toUser = await prisma.user.findUnique({ where: { id: toUserId }, select: { minDonate: true, telegramId: true, firstName: true } })
    if (!toUser) return reply.code(404).send({ error: 'User not found' })

    if (amount < toUser.minDonate) {
      return reply.code(400).send({ error: `Minimum donation: ${toUser.minDonate} tokens` })
    }

    // 10% commission
    const commission = Math.ceil(amount * 0.1)
    const recipientAmount = amount - commission

    // Check sender balance (full amount charged)
    const fromUser = await prisma.user.findUnique({ where: { id: fromUserId }, select: { balance: true, firstName: true } })
    if (!fromUser || fromUser.balance < amount) {
      return reply.code(402).send({ error: 'Insufficient balance' })
    }

    // Transfer with commission
    await prisma.$transaction([
      prisma.user.update({ where: { id: fromUserId }, data: { balance: { decrement: amount } } }),
      prisma.user.update({ where: { id: toUserId }, data: { balance: { increment: recipientAmount } } }),
      prisma.transaction.create({
        data: { userId: fromUserId, amount: -amount, type: 'SPEND', description: `Donate to ${toUser.firstName}` },
      }),
      prisma.transaction.create({
        data: { userId: toUserId, amount: recipientAmount, type: 'BONUS', description: `Donate from ${fromUser.firstName}${message ? ': ' + message.slice(0, 100) : ''} (${commission} fee)` },
      }),
      prisma.donation.create({
        data: { fromUserId, toUserId, amount, message: message?.slice(0, 200) ?? null },
      }),
    ])

    // Notify recipient via Telegram
    try {
      const BOT_TOKEN = process.env.BOT_TOKEN
      if (BOT_TOKEN) {
        let text = `+${recipientAmount} tokens from ${fromUser.firstName}`
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
